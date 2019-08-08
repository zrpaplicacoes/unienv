const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const ignore = require('ignore');
const { Stash } = require('./classes');

function listFiles(folderPath, ignoreFilePath) {
  const ign = ignore().add(fs.readFileSync(ignoreFilePath).toString()).add(['.git', '.gitignore']);
  function recurse(recurseFolder) {
    const entryPaths = fs.readdirSync(recurseFolder);
    const filePaths = entryPaths.filter(entryPath => fs.statSync(path.join(recurseFolder, entryPath)).isFile() && !ign.ignores(entryPath));
    const dirPaths = entryPaths.filter(entryPath => !filePaths.includes(entryPath)
      && (entryPath.endsWith('/') ? !ign.ignores(entryPath) : !ign.ignores(`${entryPath}/`)));
    const dirFiles = dirPaths.reduce((prev, curr) => prev.concat(recurse(curr)), []);
    return [...filePaths.map(entry => path.join(recurseFolder, entry)), ...dirFiles.map(entry => path.join(recurseFolder, entry))];
  }
  return recurse(folderPath);
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
