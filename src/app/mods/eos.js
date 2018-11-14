'use strict';

const _      = require('lodash');
const eosjs  = require('eosjs');
const path   = require('path');
const fs     = require('fs');
const Config = require('../config');

async function par(proms) {
    return Promise.all(proms)
}

async function seq(proms, ms) {
    let ds = [];
    for(const prom of proms) {
        await prom().then((d) => (ds.push(d)))
        if(ms) {
          await sleep(ms);
        }
    }
    return Promise.resolve(ds)
}

async function sleep(ms){
    return new Promise(resolve => {
        setTimeout(resolve, ms)
    })
}

function log() {
    const args = _.flatten( ['#', new Date(), _.toArray(arguments)] )
    console.log.apply(console, args);
}

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
        'jobs': jobs,
        'init': init,
        'job': job,
        'run': run,
        'request': request
    };

    Object.keys(pairs).forEach((k) => {
        me[k] = pairs[k].bind(me)
    });

    me.run.apply(me, _.slice(arguments, 1) );

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
    if(action && me[action]) {
        const f = me[action];
        const args = _.slice( _.toArray(arguments), 1 );
        me.init();
        f.apply(f, args);
    }
}

async function request(api, payload, resolve, reject) {
    return this.api[api] ? this.api[api](payload).then(resolve).catch(reject) : sleep(1);
}

async function job(job, parallel) {
    const me = this;
    const exec = (parallel === true) ? par : seq;
    const tasks = ( job.tasks || [] ).map( task => (
        () => { 
            log(job.name);
            const req = [
                task.api, (task.payload || {}), 
                eosFunc( task.callback || 'console.log'), 
                eosFunc( task.failover || 'console.log') ];
            return me.request.apply(me, req);
        }
    ) );
    return exec(tasks);
}

async function jobs(parallel) {
    const me = this;
    const exec = (parallel === true) ? par : seq;
    const offset = 1000;
    const args = _.toArray(arguments);
    const name = args && args[0] ? args[0] : 'jobs';
    const items = Config(name);
    if(items && items.length > 0) {
        const todos = items.map(
            item => ( () => me.job(item) )
        );
        exec(todos, offset).then(d => {
            console.log('done', d);
        });
    }
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
