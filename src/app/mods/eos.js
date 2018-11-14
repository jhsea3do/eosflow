'use strict';

const _      = require('lodash');
const eosjs  = require('eosjs');
const path   = require('path');
const fs     = require('fs');
const Config = require('../config');
const Helper = require('../helper');

function eosFunc(name) {
    return {
        'console.log': consoleLog,
        'console.nil': consoleNil
    }[name];

    function consoleNil(obj) {
        return obj;
    }

    function consoleLog(obj) {
        // console.log(JSON.stringify(obj));
        console.log(obj);
        return obj;
    }
}

async function Eos(config, action) {
    const me = this; 
    me.config = config;

    await eosKeys(config.app.eos)
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
            try{ fx = require( './eos/' + action ); }catch(e){}
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

async function request(api, payload, resolve, reject) {
    return this.api[api] ? this.api[api](payload).then(resolve).catch(reject) : Helper.sleep(1);
}

async function job(job, parallel) {
    const me = this;
    const exec = (parallel === true) ? Helper.par : Helper.seq;
    const tasks = ( job.tasks || [] ).map( task => (
        () => { 
            Helper.log(job.name);
            const req = [
                task.api, (task.payload || {}), 
                eosFunc( task.callback || 'console.log'), 
                eosFunc( task.failover || 'console.log') ];
            return me.request.apply(me, req);
        }
    ) );
    return exec(tasks);
}

async function eosKeys(cfg) {
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

exports = module.exports = Eos;
