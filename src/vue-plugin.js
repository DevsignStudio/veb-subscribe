import each from 'lodash/each'
import omit from 'lodash/omit'
import isFunction from 'lodash/isFunction'
import Observer from './Observer'
import Emitter from './Emitter'

export default {
    install (Vue) {
        let server = `http://${process.env.HOST || 'localhost'}:${process.env.PORT || 3000}`
        let observer = new Observer(server)
        Vue.prototype.$socket = observer.Socket

        Vue.mixin({
            created () {
                let sockets = omit(this.$options['veb'], 'subscribe')
                let subscribe

                if (this.$options.veb) {
                    subscribe = this.$options.veb.subscribe
                }
                this.$options.veb = new Proxy({}, {
                    set: (target, key, value) => {
                        Emitter.addListener(key, value, this)
                        target[key] = value
                        return true
                    },
                    deleteProperty: (target, key) => {
                        Emitter.removeListener(key, this.$options.sockets[key], this)
                        delete target.key
                        return true
                    }
                })

                if (sockets) {
                    Object.keys(sockets).forEach((key) => {
                        this.$options.veb[key] = sockets[key]
                    })
                }
                if (subscribe) {
                    each(subscribe, (item, key) => {
                        let socket = params => this.$socket.emit(key, params)
                        if (isFunction(item)) {
                            this.$watch(item, params => {
                                socket(params)
                            }, {
                                immediate: true
                            })
                        } else {
                            socket(item)
                        }
                    })
                }
            },
            beforeDestroy () {
                let sockets = omit(this.$options['veb'], 'subscribe')

                if (sockets) {
                    Object.keys(sockets).forEach((key) => {
                        delete this.$options.veb[key]
                    })
                }
            }
        })
    }
}
