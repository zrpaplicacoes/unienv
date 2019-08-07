const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const ignore = require('ignore');
const { Stash } = require('./classes');

async function replaceInFile(filePath, searchPattern, value) {
  return new Promise((resolve, reject) => {
    fs.readFile(filePath, null, (error, data) => {
      if (error) reject(error);
      const result = data.toString().replace(searchPattern, value);
      fs.writeFile(filePath, result, null, (error) => {
        if (error) throw error;
      });
    });
  });
}

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
 * Reads and parse the indicated file for a list of key-value pairs
 *
 * @param {string} filePath file path
 * @return {Array<{ key: string, value: string }>}
 */
async function readEnv(filePath) {
  const data = await readTextFile(filePath);
  const keyValueList = {};
  data.toString().split('\n').forEach((line) => {
    if (line.trim() === '') return;
    const [key, value] = line.split('=');
    keyValueList.push({ key, value });
  });
  return keyValueList;
}

function executeCommand(command) {
  return new Promise((resolve, reject) => {
    exec(command, (error, stdout, stderr) => {
      if (error) {
        reject(error);
        return;
      }
      if (stderr.length > 0) {
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

module.exports = {
  readEnv,
  getStashList,
  getHeadInfo,
  executeCommand,
  listFiles,
  replaceInFile,
};
