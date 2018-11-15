'use strict';

const record = require('./funcs/record');

function EosFuncs(name) {
    return {
        'console.obj': consoleObj,
        'console.log': consoleLog,
        'console.nil': consoleNil,
        'record': record
    }[name];

    function consoleNil(obj) {
        return obj;
    }

    function consoleObj(obj) {
        console.log(obj);
        return obj;
    }

    function consoleLog(obj) {
        console.log(JSON.stringify(obj));
        return obj;
    }
}

exports = module.exports = EosFuncs;
