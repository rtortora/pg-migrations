#!/usr/bin/env node

const minimist = require('minimist');
const FS = require('async-file');
const Path = require('path');
const ChildProcess = require('child_process');

const args = minimist(process.argv.slice(2));

async function shell(command, options = {}) {
  return new Promise((resolve, reject)=>{
    ChildProcess.exec(command, options, (error, stdout, stderr)=>{
      if (error) reject(error);
      else resolve({ stdout, stderr });
    });
  });
}

(async()=>{
  try {
    const dirtyCount = parseInt((await shell(`git status --porcelain | wc -l`)).stdout.trim());
    if (dirtyCount !== 0) {
      console.log((await shell(`git status`)).stdout);
      console.log(`ERROR: Git status isn't tidy, can't publish.`);
      process.exit(1);
      return;
    }

    const pkg = JSON.parse(await FS.readFile(Path.join(__dirname, "../package.json")));
    const version = pkg.version.split(".").map((x)=>parseInt(x));
    let nextVersion;
    if (args.major) {
      nextVersion = [version[0] + 1, 0, 0].join('.');
    } else if (args.patch) {
      nextVersion = [version[0], version[1], version[2] + 1].join('.');
    } else {
      nextVersion = [version[0], version[1] + 1, 0].join('.');
    }

    pkg.version = nextVersion;
    await FS.writeFile(Path.join(__dirname, "../package.json"), JSON.stringify(pkg, null, 2));

    await shell(`
      git checkout master &&
      git add package.json &&
      git commit -m 'bump to ${nextVersion}' &&
      git push &&
      git checkout stable &&
      git merge master &&
      git push &&
      git tag -a v${nextVersion} -m 'v${nextVersion}' &&
      git push origin v${nextVersion} &&
      git checkout master &&
    `);
  } catch(exception) {
    console.error(exception);
    process.exit(1);
  }
})();
