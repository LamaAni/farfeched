#!/usr/bin/env node
const path = require('path')
const { Cli, CliArgument } = require('@lamaani/infer')
const { StratisCli } = require('stratis')

class FarfetchedWebApi extends StratisCli {
    constructor() {
        super()
        this.serve_path = path.join(__dirname, 'public')

        // remove cli configurations.
        delete this.__$serve_path
        delete this.__$default_redirect
        delete this.__$redirect_all_unknown

        /** The search path from which to load the remote development configuration and assets. */
        this.src = process.cwd()
        /** @type {CliArgument} */
        this.__$src = {
            type: 'positional',
            environmentVariable: 'FARFETCHED_SRC',
            default: this.src,
            description:
                'The search path from which to load the remote development configuration and assets.',
        }
    }

    /**
     * @param {Cli} cli
     */
    run(cli) {
        // call to run the service.
        super.run(cli)
        cli.logger.info('Listening on http://localhost:' + this.port)
    }
}

module.exports = {
    FarfetchedWebApi,
}

if (require.main == module) {
    const api_runner = new FarfetchedWebApi()
    const cli = new Cli({
        name: 'farfetched',
    })

    cli.default(async () => {
        await api_runner.run(cli)
        cli.logger.info('Farfetched is running on http://localhost:' + api_runner.port)
    }, api_runner)

    cli.parse().catch((err) => {
        console.log(err)
        cli.logger.error(err.message)
    })
}
