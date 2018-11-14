const _ = require('lodash');

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

exports = module.exports = {
    "par": par,
    "seq": seq,
    "sleep": sleep,
    "log": log
}
