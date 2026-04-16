import { importOpenPotato } from './openpotato.js';
import { importManual } from './manual.js';

export async function runDataImports(db) {
    await importOpenPotato(db);
    importManual(db);
}
