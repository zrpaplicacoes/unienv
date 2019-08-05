#! /usr/bin/env node
const child_process = require("child_process");

/* TAREFAS:
 * x git stash list
 * _ verifica se não tem nenhum "unienv stash push"
 * _ git stash push --include-untracked -m "unienv stash push"
 * _ listar entradas do .env
 * _ verifica se tem "unienv-prefix" no .env (se tiver, com o valor @, por exemplo, vai buscar por @API_URL ao invés de API_URL)
 * _ listar arquivos ignorados (.gitignore) // não sei como
 * _ procurar em todos os arquivos pelas entradas do .env, com exceção dos ignorados (usar regex e "match whole word")
 * _ substituir os resultados da busca pelos valores
 */

(async (args) => {
    try {
        const stashList = getStashList();

        
        
        process.exit(0);
    } catch (error) {
        console.error(`An error has ocurred: ${error instanceof Error ? error.message : error.toString()}`);
        process.exit(1);
    }
})(process.argv.splice(2, process.argv.length -1));

async function getStashList() {
    const stashList = await executeCommand('git stash list').split('\n');
    const lastEntry = stashList.pop(); // the last entry commonly is an empty new line
    if (lastEntry !== '') // but if it's not...
        stashList.push(lastEntry);
    return stashList;
}

function executeCommand(command) {
    return new Promise((resolve, reject) => {
        return child_process.exec(command, (error, stdout, stderr) => {
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
