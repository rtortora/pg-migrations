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

yarn test
if [[ $? -ne 0 ]]; then
  echo "Test suite not passing, fix before releasing."
  exit 1
fi

exit 0

git checkout master && \
  git pull && \
  git checkout stable && \
  git merge master && \
  git push && \
  git tag -a v${version} -m 'v${version}' && \
  git checkout master
