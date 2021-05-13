#!/usr/bin/env node
const path = require('path')
const fs = require('fs')
const { Cli, CliArgument } = require('@lamaani/infer')
const { StratisCli } = require('@lamaani/stratis')
const { FarfetchedConfig } = require('./config')

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

        /** @type {FarfetchedConfig} */
        this.config = null
        /** The farfetched config file to use. */
        this.config_file = '.farfetched.yaml'
        /** @type {CliArgument} */
        this.__$config_file = {
            type: 'named',
            environmentVariable: 'FARFETCHED_CONFIG_FILE',
            default: this.config_file,
            description: 'The farfetched config file to use.',
        }

        /** The environment to load */
        this.env = 'default'
        /** @type {CliArgument} */
        this.__$env = {
            type: 'named',
            environmentVariable: 'FARFETCHED_ENV',
            default: this.env,
            description: 'The environment to load',
        }

        /** If true, enables the dns gateway */
        this.gateway_enabled = true
        /** @type {CliArgument} */
        this.__$gateway_enabled = {
            type: 'named',
            environmentVariable: 'FARFETCHED_GATEWAY_ENABLED',
            default: this.gateway_enabled,
            description: 'If true, enables the dns gateway',
            parse: (v) => v == true || (typeof v == 'string' && v.toLowerCase() == 'true'),
        }
    }

    /**
     * @param {Cli} cli
     */
    async invoke_initialization_scripts(cli) {
        super.invoke_initialization_scripts(cli)
        if (this.gateway_enabled) {
            
        }
    }

    /**
     * @param {Cli} cli
     */
    async run(cli) {
        this.config = new FarfetchedConfig(this, {
            environment: this.env,
        })

        if (fs.existsSync(path.resolve(this.config_file)))
            await this.config.load(path.resolve(this.config_file))

        // call to run the service.
        await super.run(cli)
    }
}

module.exports = {
    FarfetchedWebApi,
}

if (require.main == module) {
    const api_runner = new FarfetchedWebApi()
    api_runner.config_file = path.join(__dirname, '.farfetched.yaml')
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
