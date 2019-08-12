# UNIENV
### Universal environment variables and configuration manager for multi-language projects.
```
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