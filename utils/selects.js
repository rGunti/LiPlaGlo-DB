import * as logging from './logging.js';

/**
 * @returns string[]
 */
export function getSupportedLanguages(db) {
    const sql = `SELECT id FROM languages`;
    try {
        logging.logSqlCommand(sql);
        const query = db.prepare(sql);
        return query.all().map(i => i.id);
    } catch (error) {
        throw error;
    }
}
