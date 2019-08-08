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

      const prefixArg = args.find(arg => /prefix=/gi.test(arg));
      const prefix = prefixArg ? prefixArg.substring(7) : '';

      console.log('Creating unienv branch to save your work...');
      await executeCommand('git checkout -b unienv', true);
      await executeCommand('git add -A', true);
      console.log('Commiting your work...');
      await executeCommand('git commit -m "original changes"', true);

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
      await executeCommand('git commit -m "env applied"', true);
      console.log('Done.');
    } else if (args[0] === 'revert') {
      await executeCommand('git revert --no-edit --no-commit HEAD', true);
      await executeCommand('git reset --mixed HEAD~2', true);

    }

    process.exit(0);
  } catch (error) {
    console.error(`An error has ocurred: ${error instanceof Error ? error.message : error}`);
    process.exit(1);
  }
})(process.argv.splice(2, process.argv.length - 1));
