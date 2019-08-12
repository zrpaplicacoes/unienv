# UNIENV

## Universal environment variables and configuration manager for multi-language projects.

In projects with multiple programming languages and complex build processes (like react-native) it may be hard to have a .env file for your environment configuration.  
This lib is a git based solution for **any** type of project (with non-binary source files), that allows you to directly inject your environment variables values in the source code (and remove them before you commit or push your changes to remote) in an automated fashion.  

## Installation

```> npm install unienv --save-dev```

| Note: if your project has CD, it may be useful to have the lib as a production dependency.

## How it works

### Values application (apply option):

- Create a new branch (called unienv) (to do not mess with your job);
- Commit all your changes (so your work doesn't get lost);
- Read the specified .env file (.env if none specified) and parses the keys and values; *
- Read and search for the keys (using the `--prefix` if specified) in every non-binary file not ignored by the .gitignore file or the `--alsoIgnore` option;
- Replace the keys with the values and commit everything (so the application can be reverted at a later point).

\* Every file's path operation is relative to the current working directory.

### Values removal (revert option):

- Revert the last commit in the active branch (hope you haven't done any git operation before, as you were told not to do); *
- Reset the 2 last commits, retrieving your work;
- Get back to your previous branch and remove the unienv branch.

\* The unienv revert command may fail at this point, for example, if you change a file which uses environment variables before running `unienv revert`. In this case, just run `git stash push` before the revert and `git stash pop` after.

## Docopt docs, for command line enthusiasts

```docopt
Usage:  
    unienv apply [--env=<file_path>] [--prefix=<any_text>] [--alsoIgnore=<csv_gitignores>]  
    unienv revert  
    unienv --help  

Options:  
    apply        Reads keys and values from .env or specified file and  
                 replaces keys [with prefix] in source code;  
    revert       Revert all changes made by the apply command;  
    --env        File to read environment variables. May have single or double quotes.  
                 The default is relative to the project root [default: ~/.env];  
    --prefix     Text to precede variable name in source code (for example, with  
                 --prefix=@, unienv will see API_URL in .env and search for  
                 @API_URL in source code). May have single or double quotes;  
    --alsoIgnore List of comma separated gitignore like patterns not included in  
                 .gitignore file;  
    --help       Shows README.md.
```

## React-Native usage example:

```json
{
  "name": "test",
  "version": "1.0.0",
  "scripts": {

    "android-dev": "npm run env-dev && react-native run-android",
    "android-staging": "npm run env-staging && react-native run-android",
    "android-prod": "npm run env-prod && react-native run-android",

    "build-android-dev": "npm run env-dev && cd android && ./gradlew assembleDebug && cd .. && npm run env-revert",
    "build-android-staging": "npm run env-staging && cd android && ./gradlew assembleRelease && cd .. && npm run env-revert",
    "build-android-prod": "npm run env-prod && cd android && ./gradlew bundleRelease && cd .. && npm run env-revert",

    "env-dev": "unienv apply --prefix=# --alsoIgnore=ios/Pods --env=.env.dev",
    "env-staging": "unienv apply --prefix=# --alsoIgnore=ios/Pods --env=.env.staging",
    "env-prod": "unienv apply --prefix=# --alsoIgnore=ios/Pods --env=.env.prod",
    "env-revert": "unienv revert"
...
```
