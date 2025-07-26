// LIPLAGLO - License Plate Glossary CLI tool
// This tool allows for management of any kind of data related to the License Plate Glossary database.

import { program } from 'commander';
import { addI18nString } from './utils/imports.js';
import { readFileSync } from 'fs';

program
    .command('import-string')
    .option('--language <language key>', 'Language key')
    .option('--string <string key>', 'String key')
    .argument('<string file>', 'String file to load the text from')
    .action((stringFile, args) => {
        const { language, string } = args;
        if (!language || !string || !stringFile) {
            console.error('Please provide a language key, and string key.');
            process.exit(1);
        }

        const stringFileContent = readFileSync(stringFile).toString('utf8').trim();
        try {
            addI18nString(language, string, stringFileContent.trim());
        } catch (error) {
            console.error(`Error importing string: ${error.message}`);
            process.exit(1);
        }
    });

program
    .command('add-string')
    .option('--language <language key>', 'Language key')
    .option('--string <string key>', 'String key')
    .argument('<string>', 'String to add')
    .action((stringContent, args) => {
        const { language, string } = args;
        if (!language || !string || !stringContent) {
            console.error('Please provide a language key, and string key.');
            process.exit(1);
        }

        try {
            addI18nString(language, string, stringContent.trim());
        } catch (error) {
            console.error(`Error importing string: ${error.message}`);
            process.exit(1);
        }
    });

program.parse();
