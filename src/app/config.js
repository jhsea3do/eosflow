'use strict';

const yaml = require('js-yaml');
const _ = require('lodash');
const path = require('path');
const fs = require('fs');

function Config(name, data) {

    name = name || 'app';
    const base = path.dirname(process.argv[1]);
    const conf = load();

    return conf;

    function load(file) {
        file = file || [name, '.yaml'].join('');
        const fp = path.join(base, 'etc', file);
        let doc = null;
        try {
            doc = yaml.safeLoad(fs.readFileSync(fp, 'utf8'));
        } catch (e) {
            doc = {}
        }
        return doc;
    }

}

exports = module.exports = Config;
