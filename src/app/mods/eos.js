'use strict';

const _      = require('lodash');
const eosjs  = require('eosjs');
const path   = require('path');
const fs     = require('fs');
const Config = require('../config');
const Helper = require('../helper');
const Wallet = require('./eos/wallet');
const Tsdb   = require('./eos/tsdb');
const Funcs  = require('./eos/funcs');

async function Eos(config, action) {
    const me = this; 
    me.config = config;
    me.tsdb = Tsdb.apply( Tsdb, [ config.app.eos.influxdb ] );
    // me.tsdb.upsert("test1,a=1,b=2 value=100.0").then((res));
    me.wallet = Wallet.apply( Wallet, [ config.app.eos.wallet ] );
    await eosKeys(me.wallet)
            .then((d) => (me.accounts=d));
    const pairs = {
        'init': init,
        'job': job,
        'request': request
    };
    Object.keys(pairs).forEach((k) => {
        me[k] = pairs[k].bind(me)
    });
    run.apply(me, _.slice( _.toArray(arguments), 2) );
    return me;
}

async function init() {
    const me = this;
    me.inited = ( me.inited == undefined ) ? false : me.inited;
    if(me.inited === false) {
        me.inited = true;
        console.log("#", { url: this.config.eos.httpEndpoint } );
        const cfg = me.config.eos;
        const kp  = () => ( _.values(me.accounts) );
        cfg.keyProvider = kp();
        me.api = eosjs(cfg);
    }
}

async function run( action ) {
    const me = this;
    let fx = null;
    try {
      if(action) {
        fx = me[action];
        if ( !fx ) {
            try{ fx = global[ action ]; }catch(e){}
        }
        if ( !fx ) {
            try{ fx = require( './eos/flows/' + action ); }catch(e){}
        }
        /* eval is evil
        if ( !fx ) {
            try{ fx = eval(action); }catch(e){}
        }
        */
      }
    } catch (e) {
      // No such method
    }
    if(fx) {
        const args = _.slice( _.toArray(arguments), 1 );
        me.init();
        fx.apply(me, args);
    }
}

async function request(api, payload, options, resolve, reject) {
    return this.api[api] ? this.api[api](payload).then((d) => ( _.assign(options, { "result": d } )  ))
             .then(resolve).catch(reject) : Helper.sleep(1);
}

async function job(job, parallel) {
    const me = this;
    const exec = (parallel === true) ? Helper.par : Helper.seq;
    const tasks = ( job.tasks || [] ).map( (task, i) => (
        () => { 
            Helper.log(job.name);
            const options = { "name": job.name, "seq": i, "task": task };
            const req = [
                task.api, (task.payload || {}),  options, 
                Funcs(task.callback || 'console.obj').bind(me), 
                Funcs(task.failover || 'console.obj').bind(me) ];
            return me.request.apply(me, req);
        }
    ) );
    return exec(tasks);
}

async function eosKeysFromPlainText(cfg) {
    const name = cfg.name; // 'devnet';
    const base = cfg.base; // path.join(process.env.HOME, 'opt', 'eos', 'data', name);
    const dir = path.join(base, 'keys'); 
    const ks = {};
    const files = fs.readdirSync(dir); 
    files.forEach((file) => {
        const fp = path.join(dir, file)
        const data = fs.readFileSync(fp); 
        const lines = String(data).split("\n");
        const key = lines.filter(line => (line.startsWith('Private')) )[0].split(":")[1].trim();
        const acc = file.replace(/\.txt$/, '');
        ks[acc] = key;
    });
    return ks;
}

async function eosKeys(wallet) {
    return wallet.open().then((res) => {
        return (res.status == 200 ? res : false);
    }).then(wallet.unlock).then((res) => {
        return (res.status == 200 ? res : false);
    }).then(wallet.listKeys).then((res) => {
        return (res.status == 200 ? res : false);
    }).then((res) => (res.json())).then((pairs) => {
        return pairs.map(pair => pair[1]);
    });
}

exports = module.exports = Eos;
