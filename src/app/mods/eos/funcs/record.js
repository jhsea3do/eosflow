'use strict';

const _      = require('lodash');
const path   = require('path');
const fs     = require('fs');

function parse(obj) {
    let result = null;
    if ( obj.task.api == 'getCurrencyBalance' ) {
        const pair  = obj.result[0].split(" ");
        const job   = obj.name.indexOf('#') > -1 ? obj.name.split(/\#/)[1] : -1;
        result = {
            "job":     _.toInteger(job),
            "seq":     _.toInteger(obj.seq),
            "account": obj.task.payload.account,
            "symbol":  pair[1],
            "amount":  _.toNumber(pair[0])
        };
    } else if ( obj.task.api == 'transaction' ) {
        result = {};
        result['block_num']       = obj.result.processed.block_num;
        result['block_time']      = obj.result.processed.block_time;
        result['cpu_usage_us']    = obj.result.processed.receipt.cpu_usage_us;
        result['net_usage_words'] = obj.result.processed.receipt.net_usage_words;
        if ( obj.result.processed.action_traces 
            && obj.result.processed.action_traces.length > 0
            && obj.result.processed.action_traces[0].inline_traces
            && obj.result.processed.action_traces[0].inline_traces.length > 0 ) {
            const traces = obj.result.processed.action_traces[0].inline_traces;
            for ( const trace of traces ) {
                // console.log(trace);
                const detail = trace.act ? trace.act.data : {};   
                if ( detail.type == "buy" ) {
                    if ( detail.in ) {
                        const pair = detail.in.split(" ");
                        // result['in'] = { "symbol":  pair[1], "amount": _.toNumber(pair[0]) }
                        result['in_symbol'] = pair[1];
                        result['in'] = _.toNumber(pair[0]);
                    }
                    if ( detail.out ) {
                        const pair = detail.out.split(" ");
                        result['out_symbol'] = pair[1];
                        result['out'] = _.toNumber(pair[0]);
                    }
                    if ( detail.fee ) {
                        const pair = detail.fee.split(" ");
                        result['fee_symbol'] = pair[1];
                        result['fee'] = _.toNumber(pair[0]);
                    }
                } else if ( detail.memo && detail.memo.match(/reserve/) ) {
                    if ( detail.quantity ) {
                        const pair = detail.quantity.split(" ");
                        result['reserve_symbol'] = pair[1];
                        result['reserve'] = _.toNumber(pair[0]);
                    }
                }
            };
        }
    }
    return result;
}

function upsert( obj, result, tsdb ) {
    let q = null;
    if ( obj.task.api == 'getCurrencyBalance' ) {
        const t  = obj.task.api;
        const f  = _(result).omit(['amount']).map((a, b) => ( [b, a].join("=") )).value().join(",")
        const v  = [ "value", result.amount ].join("=")
        q = t + "," + f + " " + v;
    } else if ( obj.task.api == 'transaction' ) {
        const t  = obj.task.api;
        const n  = {"name": _.camelCase(obj.name.split(" -")[0])}
        const x  = {"seq": 
                     ( obj.name.match(/\#/) ? _.toNumber(_.camelCase(obj.name.split("#")[1])) : -1 ) }
        const r  = {"rate": (result.in / result.out) } 
        const f  = _(result).omit(['in', 'out', 'fee', 'reserve', 'net_usage_words', 'cpu_usage_us', 'block_num', 'block_time'])
                       .assign(n).map((a, b) => ( [b, a].join("=") )).value().join(",");
        const v  = _(result).pick(['in', 'out', 'fee', 'reserve', 'net_usage_words', 'cpu_usage_us', 'block_num'])
                       .assign(r, x).map((a, b) => ( [b, a].join("=") )).value().join(",");
        const s  = Date.parse(result.block_time) * 1000 * 1000;
        q = t + "," + f + " " + v + " " + s;
    }
    if ( q ) {
        tsdb.upsert(q).then(res => (console.log(res.status, q)));
    }
}

function record(obj) {
    const file = path.join('.', 'record.log');
    const result = parse(obj);
    if ( this.tsdb ) {
        upsert( obj, result, this.tsdb );
    }
    // const data = JSON.stringify( _.assign( obj, { "result": result } ) );
    const data = JSON.stringify( result ); 
    fs.appendFile(file, data + "\r\n", (e) => { if(e) { console.log('failed', e); } });
    return obj;
}

exports = module.exports = record;
