import { readFileSync, writeFileSync } from 'fs';

function getI18nTargetFile(language) {
    return `./data/i18n/${language}.json`;
}

export function addI18nString(languageKey, stringKey, stringValue) {
    if (!languageKey || !stringKey) {
        throw new Error('Please provide a language key, and string key.');
    }

    if (!stringValue) {
        throw new Error('Please provide a string file.');
    }

    const targetFile = getI18nTargetFile(languageKey);
    const i18n = JSON.parse(readFileSync(targetFile, 'utf8'));

    const newI18n = {
        ...i18n,
        [stringKey]: stringValue,
    };
    writeFileSync(targetFile, JSON.stringify(newI18n, null, 2), 'utf8');
    console.log(`String "${stringKey}" imported into language "${languageKey}"`);
}
