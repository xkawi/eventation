#!/bin/sh

rm -rf dist
grunt build
tar -cvzf dist.tar.gz dist/
scp dist.tar.gz "$1"
ssh kawi@evently.tk
