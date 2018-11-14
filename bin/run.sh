#!/bin/sh
[ -f $HOME/.nodejs.env ] && . $HOME/.nodejs.env
cd $(realpath $(dirname $0)/..)
cd target
node main.js $@
