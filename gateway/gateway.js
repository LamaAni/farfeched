const http = require('http')
const https = require('https')
const net = require('net')
const { assert } = require('console')
const { Request, Response, NextFunction } = require('express/index')
const events = require('events')

/**
 * @param {string} target_path
 * @returns {string}
 */
function encode_hostname(target_path) {
    return target_path.replace(/[^\w.-]/g, (str) => {
        const char_num = str.charCodeAt(0)
        return `.e${char_num.toString().padStart(3, '0')}.`
    })
}

/**
 * @param {string} hostname
 * @returns {string}
 */
function decode_hostname(hostname) {
    return hostname.replace(/[.]e[0-9]{3}[.]/g, (str) => {
        const char_num = parseInt(str.substr(2, 3))
        return String.fromCharCode([parseInt(char_num)])
    })
}

class GatewayRequestInfo {
    constructor() {
        /** @type {boolean} If true, the gateway should intercept this request*/
        this.is_gateway_intercept = false

        /** @type {boolean} If true, this is a gateway host (encoded in domain) request*/
        this.is_gateway_host = false

        /** @type {boolean} If true, this is a websocket request*/
        this.is_websocket_request = false

        /** @type {string} An identifier for the target. Generated via a general call.*/
        this.target_id = null

        /** @type {string} The method to use when calling the target */
        this.target_method = null

        /** @type {URL} The target url to call on. */
        this.target_url = null

        /**
         * @type {Error}
         */
        this.gateway_intercept_error = null
    }
}

class GatewayRequestParser {
    /**
     * @param {{
     * parse_url_from_id: (gateway:Gateway, req: Request, target_id)=>string,
     * parse_url_from_route: (gateway:Gateway, req: Request)=>string,
     * parse_protocol: (gateway:Gateway, req: Request)=>string,
     * parse_method:(gateway:Gateway, req: Request)=>string,
     * }} param0
     */
    constructor({
        parse_url_from_id = null,
        parse_url_from_route = null,
        parse_protocol = null,
        parse_method = null,
    } = {}) {
        this.invoke_methods = {
            parse_url_from_id,
            parse_url_from_route,
            parse_protocol,
            parse_method,
        }
    }

    /**
     * Parse the hostname/domain from the host id and return
     * the new url.
     * @param {Gateway} gateway
     * @param {Request} req
     * @param {string} target_id
     */
    parse_url_from_id(gateway, req, target_id) {
        if (this.invoke_methods.parse_url_from_id)
            return this.invoke_methods.parse_url_from_id(gateway, req, target_id)
        // general case the id is the remote host + port
        const parsed_from_id = req.protocol + '://' + target_id + req.originalUrl
        const url = new URL(parsed_from_id)
        return url
    }

    /**
     * Parse the hostname/domain from the route and the return
     * the new url.
     * @param {Gateway} gateway
     * @param {Request} req
     */
    parse_url_from_route(gateway, req) {
        if (this.invoke_methods.parse_url_from_route)
            return this.invoke_methods.parse_url_from_route(gateway, req)

        const request_path = req.originalUrl.substr((req.baseUrl || '').length)
        const url = new URL(req.protocol + '://' + request_path)
        return url
    }

    /**
     * Returns the protocol to use when parsing a request.
     * @param {Gateway} gateway
     * @param {Request} req
     */
    parse_protocol(gateway, req) {
        if (this.invoke_methods.parse_protocol)
            return this.invoke_methods.parse_protocol(gateway, req)

        let target_protocol = req.protocol
        if (gateway.force_protocol != null) target_protocol = gateway.force_protocol
        // if (this.is_websocket_request && gateway.force_websocket_protocol)
        //     target_protocol = gateway.force_http || req.protocol != 'https' ? 'ws' : 'wss'
        if (gateway.force_http && target_protocol == 'https') target_protocol = 'http'

        return target_protocol
    }

    /**
     * Returns the http method to use when applying the protocol.
     * @param {Gateway} gateway
     * @param {Request} req
     */
    parse_method(gateway, req) {
        if (this.invoke_methods.parse_method) return this.invoke_methods.parse_method(gateway, req)
        return req.method
    }

    /**
     * @param {Gateway} gateway
     * @param {Request} req
     * @returns {GatewayRequestInfo} The gateway request info
     */
    parse_request(gateway, req) {
        const info = new GatewayRequestInfo()
        const req_host = req.get('host')
        const gateway_domain_postfix =
            gateway.gateway_subdomain + '.' + gateway.get_gateway_host(req)

        info.is_websocket_request =
            req.headers['sec-websocket-protocol'] != null || req.headers.upgrade == 'websocket'

        info.is_gateway_host = req_host.endsWith(gateway_domain_postfix)

        // by default intercept.
        info.is_gateway_intercept = true

        if (info.is_gateway_intercept) {
            try {
                if (info.is_gateway_host) {
                    info.target_id = decode_hostname(
                        req_host.substr(0, req_host.length - gateway_domain_postfix.length - 1),
                    )
                    info.target_url = this.parse_url_from_id(gateway, req, info.target_id)
                } else info.target_url = this.parse_url_from_route(gateway, req)

                if (info.target_url == null) {
                    info.is_gateway_intercept = false
                } else {
                    info.target_url =
                        info.target_url instanceof URL ? info.target_url : new URL(info.target_url)
                    info.target_id = info.target_id || info.target_url.host

                    assert(
                        info.target_url != null,
                        'Target url not defined or target url not resolved',
                    )

                    info.target_method = this.parse_method(gateway, req)
                    info.target_url.protocol = this.parse_protocol(gateway, req)

                    if (info.is_websocket_request) {
                        info.target_url.pathname = info.target_url.pathname.replace(
                            /\/[.]websocket$/,
                            '',
                        )
                    }
                }
            } catch (err) {
                info.gateway_intercept_error = err
                gateway.emit('log', 'ERROR', 'Gateway failed to parse')
                gateway.emit('error', err)
            }
        }

        return info
    }
}

/**
 * @typedef {(event: 'error', listener: (error: Error) => void) => this} GatewayEventListenError
 * @typedef {(event: 'log', listener: (level:string, ...args) => void) => this} GatewayEventListenLog
 * @typedef {GatewayEventListenError & GatewayEventListenLog} GatewayEventListenRegister
 */

/**
 * @typedef {(event: 'error', error:Error) => this} GatewayEventEmitError
 * @typedef {(event: 'log', level:'DEBUG'|'INFO'|'WARN'|'ERROR', ...args) => this} GatewayEventEmitLog
 * @typedef {GatewayEventEmitError & GatewayEventEmitLog} GatewayEventEmitter
 */

class Gateway extends events.EventEmitter {
    /**
     * @param {{
     * gateway_host: string,
     * force_protocol: string,
     * force_http: boolean
     * force_websocket_protocol: boolean,
     * gateway_subdomain: string,
     * logger: Console,
     * }} param0
     */
    constructor({
        gateway_host = null,
        force_protocol = null,
        force_http = true,
        force_websocket_protocol = true,
        gateway_subdomain = 'gateway-proxy',
        socket_ports = [22],
        logger = null,
    } = {}) {
        super()

        this.gateway_host = gateway_host
        this.force_protocol = force_protocol
        this.force_http = force_http
        this.force_websocket_protocol = force_websocket_protocol
        this.gateway_subdomain = gateway_subdomain
        this.socket_ports = socket_ports

        /**@type {GatewayEventListenRegister} */
        this.on
        /**@type {GatewayEventListenRegister} */
        this.once

        /**@type {GatewayEventEmitter} */
        this.emit

        if (logger) {
            this.on('log', (level, ...args) => {
                logger[level.toLowerCase()](...args)
            })
        }

        this.on('error', (err) => {
            if (logger && logger.error) logger.error(err)
        })
    }

    /**
     * Create a proxy request for the info.
     * @param {Request} req
     * @param {Response} rsp
     * @param {GatewayRequestInfo} info
     * @param {(rsp:http.IncomingMessage)=>{}} handle_response
     * @returns {http.ClientRequest}
     */
    create_proxy_request(
        req,
        rsp,
        info,
        handle_response = null,
        headers = null,
        override_headers = false,
    ) {
        /**
         * @type {http.RequestOptions}
         */
        const options = {
            method: info.target_method,
            protocol: info.target_url.protocol,
            hostname: info.target_url.hostname,
            port: info.target_url.port,
            path: info.target_url.pathname + info.target_url.search,
        }

        options.headers = { ...(override_headers ? {} : req.headers), ...(headers || {}) }

        let proxy_request = null
        switch (info.target_url.protocol) {
            case 'wss:':
            case 'https:':
                {
                    proxy_request = https.request(options, handle_response)
                }
                break
            default:
                {
                    proxy_request = http.request(options, handle_response)
                }
                break
        }

        proxy_request.on('error', (err) => {
            this.emit('error', err)
            this.emit('log', 'ERROR', 'Error while executing request')
            rsp.sendStatus(500)
        })

        return proxy_request
    }

    /**
     * A middleware function to execute the auth.
     * @param {Request} req
     * @param {Response} rsp
     * @param {GatewayRequestInfo} info
     */
    send_proxy_request(req, rsp, info) {
        const proxy_request = this.create_proxy_request(req, rsp, info, (proxy_rsp) => {
            rsp.writeHead(proxy_rsp.statusCode, proxy_rsp.headers)
            proxy_rsp.pipe(rsp, {
                end: true,
            })
        })

        req.pipe(proxy_request, {
            end: true,
        })
    }

    /**
     * A middleware function to execute the auth.
     * @param {Request} req
     * @param {Response} rsp
     * @param {GatewayRequestInfo} info
     */
    create_websocket_proxy(req, rsp, info) {
        try {
            const client_socket = req.socket
            client_socket.setTimeout(0)
            client_socket.setNoDelay(true)
            client_socket.setKeepAlive(true, 0)

            const ws_request = this.create_proxy_request(req, rsp, info)

            const create_websocket_socket_header = (...args) => {
                let lines = []
                for (let v of args) {
                    if (Array.isArray(v)) {
                        lines = lines.concat(v)
                    }
                    if (typeof v == 'object') {
                        for (let key of Object.keys(v)) {
                            let ov = v[key]
                            if (Array.isArray(ov))
                                ov.forEach((v) => {
                                    lines.push(key + ': ' + value[i])
                                })
                            else lines.push(key + ': ' + ov)
                        }
                    } else lines.push(v)
                }
                return lines.join('\r\n') + '\r\n\r\n'
            }

            ws_request.on('response', (proxy_rsp) => {
                if (proxy_rsp.upgrade == true) {
                    rsp.writeHead(proxy_rsp.statusCode, proxy_rsp.headers)
                    proxy_rsp.pipe(rsp)
                } else {
                    this.emit(
                        'log',
                        'WARN',
                        `Websocket proxy @ ${info.target_url} denied the websocket.`,
                    )
                    rsp.send('denied')
                }
            })

            ws_request.on('upgrade', (proxy_rsp, proxy_socket, proxy_head) => {
                proxy_socket.on('error', (err) => {
                    this.emit('error', err)
                    this.emit('log', 'ERROR', 'Proxy socket error')
                })

                if (proxy_head && proxy_head.length) proxy_socket.unshift(proxy_head)

                proxy_socket.on('close', () => {
                    client_socket.end()
                })

                client_socket.on('close', () => {
                    proxy_socket.end()
                })

                // keep the proxy socket active.
                proxy_socket.setKeepAlive(true, 0)
                proxy_socket.setNoDelay(true, 0)
                proxy_socket.setTimeout(0)

                client_socket.write(
                    create_websocket_socket_header(
                        'HTTP/1.1 101 Switching Protocols',
                        proxy_rsp.headers,
                    ),
                )

                proxy_socket.pipe(client_socket).pipe(proxy_socket)
            })

            req.pipe(ws_request)
        } catch (err) {
            this.emit('error', err)
            this.emit('log', 'ERROR', 'Proxy websocket exited with error')
        }
    }

    /**
     * A middleware function to execute the auth.
     * @param {Request} req
     * @param {Response} rsp
     * @param {GatewayRequestInfo} info
     */
    create_socket_tunnel(req, rsp, info) {
        const client_socket = req.socket
        const proxy_socket = new net.Socket({
            allowHalfOpen: true,
            readable: true,
            writable: true,
        })

        const handle_error = (err) => {
            this.emit('error', err)
            try {
                proxy_socket.end()
                client_socket.end()
            } catch {}

            this.emit('log', 'ERROR', 'Error in socket proxy')
        }

        proxy_socket.on('connect', () => {
            // piping
            proxy_socket.pipe(client_socket).pipe(proxy_socket)
            proxy_socket.on('close', () => {
                client_socket.end()
            })
            client_socket.on('close', () => {
                proxy_socket.end()
            })
        })

        proxy_socket.connect({
            port: info.target_url.port,
            host: info.target_url.host,
        })

        proxy_socket.on('error', handle_error)
        client_socket.on('error', handle_error)
    }

    /**
     * Call to auto detect gateway host.
     * @param {Request} req
     */
    get_gateway_host(req) {
        if (this.gateway_host != null) return this.gateway_host

        // auto-detect
        const host = req.get('host')
        const subdomain_prefix = `.${this.gateway_subdomain}.`
        const last_index = host.lastIndexOf(subdomain_prefix)
        if (last_index == -1) {
            // assume not a direct gateway call.
            return host
        } else {
            return host.substr(last_index + subdomain_prefix.length)
        }
    }

    /**
     * @param {Request} req
     * @param {GatewayRequestInfo} info
     * @returns {string} The host redirect
     */
    get_gateway_host_redirect(req, info) {
        const redirect_host = this.get_gateway_host(req)
        return (
            info.target_url.protocol +
            '//' +
            encode_hostname(info.target_id) +
            '.' +
            this.gateway_subdomain +
            '.' +
            redirect_host +
            info.target_url.pathname +
            info.target_url.search
        )
    }

    /**
     * @param {GatewayRequestParser | (gateway:Gateway, req: Request)=>string} parser
     * @param {(req:Request, gateway:Gateway} request_filter
     */
    middleware(parser = null, request_filter = null) {
        assert(parser != null, 'Parser must not be null')

        if (!(parser instanceof GatewayRequestParser)) {
            assert(
                typeof parser == 'function',
                'the parser must be a function or of type GatewayRequestParser',
            )

            parser = new GatewayRequestParser({
                parse_url_from_route: parser,
            })
        }

        /**
         * A middleware function to execute the auth.
         * @param {Request} req
         * @param {Response} rsp
         * @param {NextFunction} next
         */
        const run_middleware = async (req, rsp, next) => {
            /**
             * @type {GatewayRequestInfo}
             */
            const info = parser.parse_request(this, req)

            if (!info.is_gateway_host && request_filter != null && !request_filter(req, this))
                return next()

            // skip if not a gateway request.
            if (!info.is_gateway_intercept) return next()

            if (info.gateway_intercept_error) {
                this.emit('log', 'ERROR', 'Gateway internal error')
                rsp.sendStatus(500)
                return
            }

            try {
                // websocket/socket request do not require their own domain.
                if (info.is_websocket_request) {
                    this.emit(
                        'log',
                        'INFO',
                        `Starting websocket proxy ${req.originalUrl} -> ${info.target_url}`,
                    )
                    this.create_websocket_proxy(req, rsp, info)
                    return
                }

                // any other web request should be redirected.
                if (!info.is_gateway_host) {
                    const redirect_path = this.get_gateway_host_redirect(req, info)
                    this.emit('log', 'INFO', 'Redirect: ' + redirect_path)
                    rsp.redirect(redirect_path)
                    return
                }

                this.send_proxy_request(req, rsp, info)
            } catch (err) {
                this.emit('error', err)
                this.emit('log', 'ERROR', 'Error while sending request')
                rsp.sendStatus(500)
                return
            }
        }

        return run_middleware
    }
}

module.exports = {
    decode_hostname,
    encode_hostname,
    Gateway,
    GatewayRequestParser,
}
