'use strict';

const fetch = require('node-fetch');

function EosTsdb(config) {

    const db    = this;

    db.config   = config;
    db.upsert   = upsert.bind(db);

    return db;

    function getName() {
        return db.config.name;
    }

    function getEndpoint() {
        return db.config.httpEndpoint;
    }

    function getUrl(opt) {
        opt = opt || 'write'
        return [ getEndpoint(), opt ].join('/') + "?db=" + getName();
    }

    function upsert(data) {
        const url  = getUrl('write');
        // console.log(url);
        return fetch(url, { method: 'POST', body: data });
    }

}

exports = module.exports = EosTsdb;
