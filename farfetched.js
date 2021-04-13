#!/usr/bin/env node
const path = require('path')
const { Cli, CliArgument } = require('@lamaani/infer')
const { FarfetchedWebApi } = require('./web/web-api')
const express = require('express')

const cli = new Cli({
    name: 'farfetched',
})

class FarfetchedCli {
    constructor() {}

    /**
     * @param {Cli} cli
     */
    run() {
        // call to run the service.
        const pkg = require('./package.json')
        console.log('Farfetchd ' + pkg.version)
    }
}

module.exports = {
    FarfetchedCli,
}

if (require.main == module) {
    const cli_runner = new FarfetchedCli()

    cli.default(async () => {
        await cli_runner.run()
    }, cli_runner)

    const webserver = new FarfetchedWebApi()

    cli.on(
        'webserver',
        () => {
            webserver.run(cli)
        },
        webserver,
    )

    cli.parse().catch((err) => {
        console.log(err)
        cli.logger.error(err.message)
    })
}
