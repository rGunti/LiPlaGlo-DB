import { readFileSync, writeFileSync } from 'fs';

const importFilePath = './data/i18n/_import.json';
const importFile = JSON.parse(readFileSync(importFilePath, 'utf8'));

const languages = importFile.reduce((p, c, i, a) => {
    const languageKey = c.language_key;
    if (!p[languageKey]) {
        p[languageKey] = {};
    }
    p[languageKey][c.string_key] = c.value;
    return p;
}, {});

Object.keys(languages).forEach((languageKey) => {
    writeFileSync(`./data/i18n/${languageKey}.json`, JSON.stringify(languages[languageKey], null, 2), 'utf8');
});
