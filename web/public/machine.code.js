/**
 * @typedef {import('express').Request} Request
 * @typedef {import('express').Response} Response
 * @typedef {import('stratis').StratisRequestInfo} StratisRequestInfo
 */

class Machine {
    constructor(req = null) {
        this.machine_name = null
        if (req != null) this.parse_request(req)
    }

    get is_new_machine() {
        return this.machine_name == null
    }

    /**
     * @param {Request} req
     */
    parse_request(req) {
        /** @type {StratisRequestInfo} */
        const info = req.stratis_info
        this.machine_name = info.url.searchParams['machine_name']
    }
}

module.exports = {
    constructors: {
        Machine,
    },
}
