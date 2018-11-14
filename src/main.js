'use strict';

const App = require('./app');
const _   = require('lodash');

const Main = function() {
    App.apply(App, _.toArray(arguments) ) 
};

if (process) {(() => (
    Main.apply( Main, _.slice( process.argv, 2 ) )
))();}
