#! /usr/bin/env node

const APP_ROOT = require('app-root-path').toString();
const path = require('path');
const {
  executeCommand,
  readEnv,
  listFiles,
  asyncForEach,
  readTextFile,
  writeTextFile,
} = require('./methods');

(async (args) => {
  try {
    if (args[0] === 'apply') {
      const envFileArg = args.find(arg => arg.startsWith('env='));
      const envFile = envFileArg ? envFileArg.substring(4).replace(/["']/g, '') : `${APP_ROOT}/.env`;
      const envEntries = await readEnv(envFile);

      const prefixArg = args.find(arg => /--prefix=/gi.test(arg));
      const prefix = prefixArg ? prefixArg.substring(9) : '';

      const currentBranch = await executeCommand('git rev-parse --abbrev-ref HEAD');
      console.log('Creating unienv branch to save your work...');
      await executeCommand('git checkout -b unienv', true);
      await executeCommand('git add -A', true);
      console.log('Commiting your work...');
      await executeCommand(`git commit --allow-empty -m "unienv: original changes from branch ${currentBranch}"`, true);

      console.log(`Applying environment values from file ${path.basename(envFile)}...`);
      const fileList = await listFiles(APP_ROOT, path.join(APP_ROOT, '.gitignore'));
      await asyncForEach(fileList, async (filePath) => {
        let fileContent = await readTextFile(filePath);
        envEntries.forEach((envEntry) => {
          fileContent = fileContent.replace(new RegExp(`${prefix}\\b(${envEntry.key})\\b`), envEntry.value);
        });
        return writeTextFile(filePath, fileContent);
      });

      console.log('Commiting environment values application to revert at a later point...');
      await executeCommand('git add -A', true);
      await executeCommand('git commit -m "unienv: env values applied"', true);

      console.log('Done.');
      console.log('\n    !====================================!');
      console.log('     CAUTION: DO NOT DO ANY GIT OPERATION\n     before runing "unienv revert" or the\n      revert might not work as expected!');
      console.log('    !====================================!\n');
    } else if (args[0] === 'revert') {
      const previousBranch = (await executeCommand('git log --format=%B -n 1 HEAD~1')).trim().substring(37);
      console.log('Removing environment values from source code');
      await executeCommand('git revert --no-edit --no-commit HEAD', true);
      console.log('Retrieving your saved work');
      await executeCommand('git reset --mixed HEAD~2', true);
      await executeCommand(`git checkout ${previousBranch}`, true);
      console.log('Cleaning everything');
      await executeCommand('git branch -D unienv', true);
      console.log('Done. You can now commit and push your changes ;)');
    }

    process.exit(0);
  } catch (error) {
    console.error(`An error has ocurred: ${error instanceof Error ? error.message : error}`);
    process.exit(1);
  }
})(process.argv.splice(2, process.argv.length - 1));
