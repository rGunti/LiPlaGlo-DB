import { importOpenPotato } from './openpotato.js';

export async function runDataImports(db) {
    await importOpenPotato(db);
}
