#!/usr/bin/env bash
set -e

version=$(cat package.json | jq -r '.version')

git fetch
tagExists=$(git tag -l "v${version}")
if [[ "$tagExists" != "" ]]; then
  echo "Tag v${version} already exists, bump version in package.json"
  exit 1
fi

echo "Releasing version ${version}"

if [[ $(git status --porcelain | wc -l) -ne 0 ]]; then
  echo "Local changes, please sort out prior to releasing."
  git status --porcelain
  exit 1
fi

git checkout master && git pull

# Thanks to set -e, this should bail if any tests fail.
yarn test

git checkout stable && \
  git pull && \
  git merge master && \
  git push && \
  git tag -a v${version} -m 'v${version}' && \
  git push origin v${version} && \
  git checkout master

echo "Done, created tag v${version}"
