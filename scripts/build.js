#!/usr/bin/env node

const minimist = require('minimist');
const execa = require('execa');
const FS = require('async-file');
const Path = require('path');

const args = minimist(process.argv.slice(2));

(async()=>{
  try {
    if (args.stable) {
      await execa.shell(`git checkout master && git pull`, { stdio:[0,1,2] });
    }

    await execa.shell(`env NODE_ENV=development node_modules/.bin/babel --source-maps --copy-files -d dist/ src/`, { stdio:[0,1,2] });

    const pkg = JSON.parse(await FS.readFile(Path.join(__dirname, "../package.json")));
    const version = pkg.version.split(".").map((x)=>parseInt(x));

    let nextVersion;
    if (args.major) {
      nextVersion = [version[0] + 1, version[1], version[2]].join('.');
    } else if (args.patch) {
      nextVersion = [version[0], version[1], version[2] + 1].join('.');
    } else {
      nextVersion = [version[0], version[1] + 1, 0].join('.');
    }

    pkg.version = nextVersion;
    await FS.writeFile(Path.join(__dirname, "../package.json"), JSON.stringify(pkg, null, 2));

    if (args.stable) {
      await execa.shell(`git add --all && git commit -m 'bump to ${nextVersion}' && git push && git checkout stable && git merge master && git push && git tag -a v${nextVersion} -m 'v${nextVersion}' && git push origin v${nextVersion} && git checkout master`, { stdio:[0,1,2] });
    }

    process.exit(0);
  } catch(exception) {
    console.error(exception);
    process.exit(1);
  }
})();
