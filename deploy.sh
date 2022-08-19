#!/usr/bin/env sh

# abort on errors
set -e

yarn install && yarn build
mkdir -p ../deploy
cp -R dist/* ../deploy
git checkout pages
cp -R ../deploy/* .
git add -A && git commit -S -m "deploy"
git push