const _ = require('lodash');
const Config = require('../../config');
const Helper = require('../../helper');

async function jobs(parallel) {
    const me = this;
    const exec = (parallel === true) ? Helper.par : Helper.seq;
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


exports = module.exports = jobs;
