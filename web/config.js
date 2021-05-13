const path = require('path')
const fs = require('fs')
const yaml = require('yaml')
const extend = require('extend')
const { FarFetchedError, assert } = require('./errors')

const DEFAULT_CONFIG = yaml.parse(
    fs.readFileSync(path.join(__dirname, '.farfetched.yaml'), 'utf-8'),
)
/**
 * @typedef {import("./web-api").FarfetchedWebApi} FarfetchedWebApi
 */

class FarfetchedConfig {
    /**
     * @param {FarfetchedWebApi} api
     * @param {{
     * environment:string,
     * config: Object,
     * }} param1
     */
    constructor(api, { environment = null, config = DEFAULT_CONFIG }) {
        this.environment = environment || process.env.ENVIRONMENT || 'default'
        this.config_data = config || {}
        this.api = api
    }

    async load(config_file) {
        extend(true, this.config_data, await this._load(config_file))
    }

    async _load(config_file) {
        config_file = path.resolve(config_file)
        const stat = await fs.promises.stat(config_file)
        assert(stat.isFile(), 'Config file cannot be a directory and must be a file')

        const config_yaml = await fs.promises.readFile(config_file, 'utf-8')
        const config = yaml.parse(config_yaml)
        config.environments = config.environments || {}

        if (this.environment != null && config.environments[this.environment] != null) {
            await this._load_from_environment(
                config.environments[this.environment],
                config,
                path.dirname(config_file),
            )
        }

        return config
    }

    async _load_from_environment(environment_config, config, rel_path) {
        rel_path = rel_path || process.cwd()

        /**
         * @param {string} p
         */
        function resolve_config_file_path(p) {
            if (p.startsWith('/')) return p
            if (p.startsWith('./')) p = p.slice(2)
            if (p.startsWith('/')) p = p.slice(1)
            return path.resolve(path.join(rel_path, p))
        }

        function merge(other) {
            extend(true, config, other)
        }

        for (let arg in environment_config) {
            if (typeof arg == 'string') {
                // is a file.
                if (arg.endsWith('.js')) {
                    const as_val = require(arg)
                    if (typeof arg == 'object') merge(arg)
                    else if (typeof arg == 'function') merge(arg())
                } else if (arg.endsWith('.yaml') || arg.endsWith('.json')) {
                    merge(await this._load(resolve_config_file_path(arg)))
                } else
                    throw new FarFetchedError(
                        'Invalid argument when reading config environments ' + arg,
                    )
            } else merge(arg)
        }
    }
}

module.exports = {
    FarfetchedConfig,
}
