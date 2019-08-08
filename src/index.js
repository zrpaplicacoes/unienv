#! /usr/bin/env node

/* TAREFAS:
 * x git stash list
 * x verifica se não tem nenhum "unienv stash push"
 * x git stash push --include-untracked -m "unienv stash push"
 * x listar entradas do .env
 * x listar arquivos ignorados (.gitignore) // não sei como
 * x procurar em todos os arquivos pelas entradas do .env, com exceção dos ignorados (usar regex e "match whole word")
 * _ verifica se tem "unienv_prefix" no .env (se tiver, com o valor @, por exemplo, vai buscar por http://google.com ao invés de API_URL)
 * x substituir os resultados da busca pelos valores
 */

const APP_ROOT = require('app-root-path').toString();
const path = require('path');
const { STASH_PUSH_NAME_PREFIX } = require('./constants');
const {
  getHeadInfo,
  getStashList,
  executeCommand,
  readEnv,
  listFiles,
  asyncForEach,
  readTextFile,
  writeTextFile,
} = require('./methods');

(async (args) => {
  try {
    if (args[0] === '1') {
      const stashList = await getStashList();

      if (stashList.some(stash => stash.name.startsWith(''))) throw new Error('environment variables already applied');

      let envFile = args.find(arg => arg.startsWith('env='));
      if (envFile) envFile = envFile.substring(4).replace(/["']/g, '');
      else envFile = `${APP_ROOT}/.env`;
      const envEntries = await readEnv(envFile);
      const prefixEntryIndex = envEntries.findIndex(entry => /UNIENV_PREFIX/gi.test(entry.key));
      let prefix = '';
      if (prefixEntryIndex >= 0) {
        prefix = envEntries[prefixEntryIndex].value;
        envEntries.splice(prefixEntryIndex, 1);
      }

      // const stashName = `${STASH_PUSH_NAME_PREFIX} - ${await getHeadInfo()}`;
      // await executeCommand(`git stash push --include-untracked -m "${stashName}"`);
      // await executeCommand('git stash apply --index');

      const fileList = await listFiles(APP_ROOT, path.join(APP_ROOT, '.gitignore'));
      await asyncForEach(fileList, async (filePath) => {
        let fileContent = await readTextFile(filePath);
        envEntries.forEach((envEntry) => {
          fileContent = fileContent.replace(new RegExp(`${prefix}\\b(${envEntry.key})\\b`), envEntry.value);
        });
        return writeTextFile(filePath, fileContent);
      });
    } // else if (args[0] === '--help') {}


    process.exit(0);
  } catch (error) {
    console.error(`An error has ocurred: ${error instanceof Error ? error.message : error.toString()}`);
    process.exit(1);
  }
})(process.argv.splice(2, process.argv.length - 1));
