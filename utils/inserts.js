import * as logging from './logging.js';

export function insertLanguageString(db, stringKey, languageKey, value) {
    const sql = `INSERT INTO i18n (string_key, language_key, value) VALUES (?, ?, ?)`;
    try {
        logging.logSqlCommand(sql, [stringKey, languageKey, '...']);
        db.prepare(sql).run(stringKey, languageKey, value);
    } catch (error) {
        console.error(`Error inserting string: ${stringKey}, ${languageKey}`, error);
        throw error;
    }
}

export function insertRegionalIdentifier(db, countryId, typeId, identifier, name, description) {
    const sql = `INSERT INTO regional_identifier (country_id, type_id, identifier, name, description) VALUES (?, ?, ?, ?, ?)`;
    try {
        logging.logSqlCommand(sql, [countryId, typeId, identifier, name, description]);
        db.prepare(sql).run(countryId, typeId, identifier, name, description);
    } catch (error) {
        console.error(`Error inserting regional identifier: ${identifier}`, error);
        throw error;
    }
}
