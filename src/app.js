'use strict';

const Modules = require('./app/modules');
const _   = require('lodash');

async function App() {
    for(const params of _.toArray(arguments)) {
        const args = params.split(":");
        await Modules.apply(Modules, args);
    }
};

exports = module.exports = App;
