'use strict';

const _ = require('lodash');
const Config = require('../../../config');
const Helper = require('../../../helper');

async function jobs(name, parallel) {
    const me = this;
    const exec = (parallel === true 
                     || parallel === 'true')
                     ? Helper.par : Helper.seq;
    const offset = 1000;
    name = name || 'jobs';
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


exports = module.exports = jobs;
