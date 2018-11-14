const fetch = require('node-fetch');

function EosWallet(config) {

    const wa    = this;

    wa.config   = config;

    wa.getUrl   = getUrl.bind(wa);
    wa.lockAll  = lockAll.bind(wa);
    wa.unlock   = unlock.bind(wa);
    wa.open     = open.bind(wa);
    wa.listKeys = listKeys.bind(wa);

    return wa;

    function getName() {
        return wa.config.name;
    }

    function getPasword() {
        return wa.config.password;
    }

    function getUrl(name) {
        const base = wa.config.httpEndpoint;
        return [ base, 'v1', 'wallet', name ].join('/');
    }

    function lockAll() {
        const url  = getUrl('lock_all');
        return fetch(url);
    }

    function unlock() {
        const url  = getUrl('unlock');
        const data = JSON.stringify( [ getName(), getPasword() ] )
        return fetch(url, { method: 'POST', body: data });
    }

    function unlock() {
        const url  = getUrl('unlock');
        const data = JSON.stringify( [ getName(), getPasword() ] )
        return fetch(url, { method: 'POST', body: data });
    }

    function open() {
        const url  = getUrl('open');
        const data = JSON.stringify( getName() );
        return fetch(url, { method: 'POST', body: data });
    }

    function listKeys() {
        const url  = getUrl('list_keys');
        const data = JSON.stringify( [ getName(), getPasword() ] )
        return fetch(url, { method: 'POST', body: data });
    }
}

exports = module.exports = EosWallet;
