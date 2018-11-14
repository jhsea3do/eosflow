#!/bin/sh
[ -f $HOME/.nodejs.env ] && . $HOME/.nodejs.env
cd $(realpath $(dirname $0)/..)
rm -rf target
mkdir -p target
cp -rf src/* target
cp -rf etc   target
cp package.json target
cd target
yarn install
