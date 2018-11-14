'use strict';

const _      = require('lodash');
const Config = require('./config');

async function Modules() {
    const env  = process.env.NODE_ENV || 'dev';
    const params = _.toArray(arguments);
    const mod = (params ? params[0] : null) || 'eos';
    const config = Config(env);
    let Mod = null;
    try {
        Mod = require('./mods/' + mod);
    } catch (e) {
        Mod = () => { console.log([mod, 'not impl'].join(' ')); }
    }
    const args = _.slice(params, 1);
    await Mod.apply(Mod, _.flatten([config, args]));
};

exports = module.exports = Modules;
