import { DatabaseSync } from 'node:sqlite';
import { readFileSync, rmSync, statSync } from 'node:fs';
import { opendir } from 'node:fs/promises';
import * as inserts from './utils/inserts.js';
import * as logging from './utils/logging.js';
import { getDatabaseVersion } from './utils/version.js';
import { runDataImports } from './transformation/index.js';

const DB_FILE = './liplaglo.db';

// Get a list of all SQL files in the setup directory
async function getSetupScripts() {
    const dir = await opendir('setup');
    const files = [];
    for await (const dirent of dir) {
        if (dirent.isFile() && dirent.name.toLocaleLowerCase().endsWith('.sql') && !dirent.name.startsWith('_')) {
            const filePath = `setup/${dirent.name}`;

            logging.log(`Loading setup script`, filePath);

            const content = readFileSync(filePath, 'utf8');
            files.push({ filePath, content });
        }
    }
    return files.sort((a, b) => a.filePath.localeCompare(b.filePath));
}

// Get a list of all language files in the languages directory
async function getLanguageFiles() {
    const dir = await opendir('data/i18n');
    const files = [];
    for await (const dirent of dir) {
        if (dirent.isFile() && dirent.name.toLocaleLowerCase().endsWith('.json')) {
            const filePath = `data/i18n/${dirent.name}`;
            const languageCode = dirent.name.replace('.json', '');

            logging.log(`Loading language file`, filePath);

            const content = readFileSync(filePath, 'utf8');
            files.push({ languageCode, content: JSON.parse(content) });
        }
    }
    return files;
}

async function getPostProcessingScripts() {
    const dir = await opendir('data/postprocessing');
    const files = [];
    for await (const dirent of dir) {
        if (dirent.isFile() && dirent.name.toLocaleLowerCase().endsWith('.sql')) {
            const filePath = `data/postprocessing/${dirent.name}`;

            logging.log(`Loading post processing script`, filePath);

            const content = readFileSync(filePath, 'utf8');
            files.push({ filePath, content });
        }
    }
    return files.sort((a, b) => a.filePath.localeCompare(b.filePath));
}

async function runPostProcessingScripts(database) {
    // Get post-processing files
    const postProcessingScripts = await getPostProcessingScripts();

    postProcessingScripts.forEach(script => {
        logging.logSqlScript(script.filePath);
        try {
            database.exec(script.content);
        } catch (error) {
            logging.logError(script.filePath, error);
            throw error;
        }
    });
}

// Main script execution
const setupScripts = await getSetupScripts();
console.log(`Found ${setupScripts.length} setup scripts.`);

if (statSync(DB_FILE, { throwIfNoEntry: false })) {
    logging.log(`Removing existing database file`);
    rmSync(DB_FILE, { force: true, recursive: true });
}

const database = new DatabaseSync(DB_FILE, {
    open: true,
});

// Run setup scripts in order
for (const script of setupScripts) {
    logging.logSqlScript(script.filePath);
    try {
        database.exec(script.content);
    } catch (error) {
        logging.logError(script.filePath, error);
        throw error;
    }
}

// Import data from JSON files
const dataFiles = [
    'data/languages.json',
    'data/countries.json',
    'data/country_links.json',
    'data/plate_variants.json',
    'data/plate_identifier_type.json',
];

for (const file of dataFiles) {
    logging.logSqlScript(file);
    try {
        const data = JSON.parse(readFileSync(file, 'utf8'));
        if (Array.isArray(data)) {
            for (const item of data) {
                const keys = Object.keys(item).map(x => `"${x}"`).join(', ');
                const placeholders = Object.keys(item).map((v, i) => `?`).join(', ');
                const values = Object.values(item);
                const sql = `INSERT INTO ${file.split('/')[1].replace('.json', '')} (${keys}) VALUES (${placeholders})`;
                
                logging.logSqlCommand(sql, values);
                database.prepare(sql).run(...values);
            }
        } else {
            logging.log(`No data found in file`, file);
        }
    } catch (error) {
        logging.logError(`Error importing data from file`, file, error);
        throw error;
    }
}

// i18n
const languageFiles = await getLanguageFiles();
logging.log(`Found ${languageFiles.length} language files.`);
for (const { languageCode, content } of languageFiles) {
    logging.log(`Inserting language data for language`, languageCode);

    Object.keys(content).forEach((key) => {
        inserts.insertLanguageString(database, key, languageCode, content[key]);
    });
}

// Run data imports
logging.log(`Running data imports...`);
await runDataImports(database);

// Run post processing
logging.log('Running post-processing scripts ...');
await runPostProcessingScripts(database);

// Set version
logging.log('Setting version');
const dbVersion = getDatabaseVersion();
inserts.setDbVersion(database, `${dbVersion}`);

database.close();

logging.log('DONE! Database built successfully.');
