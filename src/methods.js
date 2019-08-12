const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const ignore = require('ignore');
const { isBinaryFileSync } = require('isbinaryfile');
const { Stash } = require('./classes');

/**
 * List all files inside given folder, relative to it
 * @param {string} relativeFolderPath
 * @param {string} ignoreFilePath absolute (or relative to cwd) path to .gitignore file
 * @param {boolean} ignoreBinaries if binary files should be ignored (use false if no binary files are tracked by git)
 * @param {string|Array<string>} additionalIgnores .gitignore like paths to be ignored that aren't in .gitignore
 * @returns {Array<string>} List of file paths relative to given folder
 */
function listFiles(relativeFolderPath, ignoreFilePath, ignoreBinaries, additionalIgnores) {
  let ign = ignore().add(fs.readFileSync(ignoreFilePath).toString()).add(['.git', '.gitignore', '.gitattributes']);
  if (additionalIgnores) ign = ign.add(additionalIgnores);
  function recurse(recurseFolder) {
    const entryPaths = fs.readdirSync(recurseFolder).map(entryPath => path.join(recurseFolder, entryPath));
    const filePaths = [];
    const dirPaths = [];

    entryPaths.forEach((entryPath) => {
      const isFile = fs.statSync(entryPath).isFile();
      if ((isFile && !ign.ignores(entryPath))
        || (!isFile && (entryPath.endsWith('/') ? !ign.ignores(entryPath) : !ign.ignores(`${entryPath}/`)))) {
        if (isFile) {
          if (!ignoreBinaries) filePaths.push(entryPath);
          else if (!isBinaryFileSync(entryPath)) filePaths.push(entryPath);
        } else dirPaths.push(entryPath);
      }
    });

    const dirFiles = dirPaths.reduce((prev, curr) => prev.concat(recurse(curr)), []);

    return [...filePaths, ...dirFiles];
  }
  return recurse(relativeFolderPath);
}

/**
 * @param {string} filePath
 * @returns {string}
 */
async function readTextFile(filePath) {
  return new Promise((resolve, reject) => {
    fs.readFile(filePath, (error, data) => {
      if (error) reject(error);
      resolve(data.toString());
    });
  });
}

/**
 * @param {string} filePath
 * @param {string} content
 * @throws {NodeJS.ErrnoException}
 */
async function writeTextFile(filePath, content) {
  return new Promise((resolve, reject) => {
    fs.writeFile(filePath, content, null, (error) => {
      if (error) reject(error);
      resolve();
    });
  });
}

/**
 * Reads and parse the indicated file for a list of key-value pairs
 *
 * @param {string} filePath file path
 * @return {Array<{ key: string, value: string }>}
 */
async function readEnv(filePath) {
  const data = await readTextFile(filePath);
  const keyValueList = [];
  data.toString().split('\n').forEach((line) => {
    if (line.trim() === '') return;
    const [key, value] = line.split('=');
    keyValueList.push({ key: key.trim(), value: value.trim() });
  });
  return keyValueList;
}

function executeCommand(command, ignoreStderr) {
  return new Promise((resolve, reject) => {
    exec(command, (error, stdout, stderr) => {
      if (error) {
        reject(error);
        return;
      }
      if (!ignoreStderr && stderr && stderr.length > 0) { // git likes to log as error...
        reject(error);
        return;
      }
      resolve(stdout);
    });
  });
}

/**
 * Returns a list with all the stashes in the current repo or an empty list.
 * @return {Array<Stash>}
 */
async function getStashList() {
  const stashList = (await executeCommand('git stash list')).split('\n');
  const lastEntry = stashList.pop(); // the last entry commonly is an empty new line
  if (lastEntry !== '') stashList.push(lastEntry); // but if it's not...

  return stashList.map((stash) => {
    const split = stash.split(':');
    return new Stash(split[0], split[2].substring(1));
  });
}

/**
 * Returns the current checked-out branch and the last commit's id in the format "commit@branch"
 * @return {string}
 */
async function getHeadInfo() {
  const branch = await executeCommand('git rev-parse --abbrev-ref HEAD');
  const commitId = await executeCommand('git rev-parse --short HEAD');
  return `${commitId}@${branch}`;
}

/**
 * Executes all promises simultaneously and only returns when every and each one has complete.
 * @param {Array<T>} array
 * @param {(item: T, index: number, array: Array.<T>)} callback
 */
async function asyncForEach(array, callback) {
  const promises = [];
  for (let index = 0; index < array.length; index += 1) {
    promises.push(callback(array[index], index, array));
  }
  return Promise.all(promises);
}


module.exports = {
  readEnv,
  getStashList,
  getHeadInfo,
  executeCommand,
  listFiles,
  asyncForEach,
  writeTextFile,
  readTextFile,
};
