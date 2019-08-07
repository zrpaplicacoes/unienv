#! /usr/bin/env node

/* TAREFAS:
 * x git stash list
 * x verifica se não tem nenhum "unienv stash push"
 * x git stash push --include-untracked -m "unienv stash push"
 * x listar entradas do .env
 * x listar arquivos ignorados (.gitignore) // não sei como
 * _ procurar em todos os arquivos pelas entradas do .env, com exceção dos ignorados (usar regex e "match whole word")
 * _ verifica se tem "unienv-prefix" no .env (se tiver, com o valor @, por exemplo, vai buscar por @API_URL ao invés de API_URL)
 * _ substituir os resultados da busca pelos valores
 */

const APP_ROOT = require('app-root-path').toString();
const { STASH_PUSH_NAME_PREFIX } = require('./constants');
const path = require('path');
const {
  getHeadInfo,
  getStashList,
  executeCommand,
  readEnv,
  listFiles,
} = require('./methods');

(async (args) => {
  try {
    if (args[0] === 'apply') {
      const stashList = await getStashList();

      if (stashList.some(stash => stash.name.startsWith(''))) throw new Error('environment variables already applied');

      let envFile = args.find(arg => arg.startsWith('env='));
      if (envFile) envFile = envFile.substring(4).replace(/["']/g, '');
      else envFile = `${APP_ROOT}/.env`;
      const envEntries = await readEnv(envFile);

      const stashName = `${STASH_PUSH_NAME_PREFIX} - ${getHeadInfo()}`;
      await executeCommand(`git stash push --include-untracked -m "${stashName}"`);
      await executeCommand('git stash apply --index');

      const fileList = await listFiles(APP_ROOT, path.join(APP_ROOT, '.gitignore'));
      fileList.forEach((file) => {

      });
    } // else if (args[0] === '--help') {}


    process.exit(0);
  } catch (error) {
    console.error(`An error has ocurred: ${error instanceof Error ? error.message : error.toString()}`);
    process.exit(1);
  }
})(process.argv.splice(2, process.argv.length - 1));
