#!/usr/bin/env node --require babel-register --require babel-polyfill

import minimist from 'minimist';
import execa from 'execa';
import FS from 'async-file';
import Path from 'path';
import map from 'lodash.map';

const args = minimist(process.argv.slice(2));

(async()=>{
  try {
    if (args.stable) {
      await execa.shell(`git checkout master && git pull`, { stdio:[0,1,2] });
    }

    await execa.shell(`env NODE_ENV=development node_modules/.bin/babel --source-maps -d dist/ src/`, { stdio:[0,1,2] });

    const pkg = JSON.parse(await FS.readFile(Path.join(__dirname, "../package.json")));
    const version = map(pkg.version.split("."), (x)=>parseInt(x));

    let nextVersion;
    if (args.major) {
      nextVersion = [version[0] + 1, version[1]];
    } else {
      nextVersion = [version[0], version[1] + 1];
    }

    pkg.version = nextVersion.join(".");
    await FS.writeFile(Path.join(__dirname, "../package.json"), JSON.stringify(pkg, null, 2));

    if (args.stable) {
      await execa.shell(`git add --all && git commit -m 'bump to ${nextVersion.join(',')}' && git push && git checkout stable && git merge master && git push && git checkout master`, { stdio:[0,1,2] });
    }

    process.exit(0);
  } catch(exception) {
    console.error(exception);
    process.exit(1);
  }
})();
