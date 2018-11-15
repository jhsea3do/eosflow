'use strict';

const _ = require('lodash');
const Config = require('../../../config');
const Helper = require('../../../helper');

async function batch(name, times, offset, parallel) {
    const me = this;
    const exec = (parallel === true 
                     || parallel === 'true')
                     ? Helper.par : Helper.seq;
    offset = offset ? ( _.toInteger(offset) ) : 1000;
    name   = name || 'jobs';
    times  = times ? ( _.toInteger(times) ) : 3;

    const confs = Config(name);

    const items = _.flatten( _.range(times).map(function(i) {
        const seq = i + 1;
        const row = confs.map(function(conf, j) {
            let cell = _.cloneDeep(conf);
            cell.name = cell.name + " - #" + seq;
            return cell;
        });
        return row;
    }) );
    
    if(items && items.length > 0) {
        const todos = items.map(
            item => ( () => me.job(item) )
        );
        exec(todos, offset).then(d => {
            console.log('done', d);
        });
    }
}


exports = module.exports = batch;
