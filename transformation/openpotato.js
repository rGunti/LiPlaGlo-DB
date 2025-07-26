import { createReadStream } from 'fs';
import { parse } from 'csv-parse';
import { finished } from "stream/promises";
import { insertRegionalIdentifier } from '../utils/inserts.js';

const COUNTRY_ID_GERMANY = 'D';
const TYPE_ID_GERMANY_STATES = 2;

async function parseKennzeichenDeutschlandCsv(filePath) {
    const records = [];
    const parser = createReadStream(filePath)
        .pipe(parse({ delimiter: ',', from_line: 2 }));
    parser.on("readable", function () {
      let record;
      while ((record = parser.read()) !== null) {
        records.push({
            country_id: COUNTRY_ID_GERMANY,
            type_id: TYPE_ID_GERMANY_STATES,
            identifier: record[1],
            name: `raw:${record[2]}`,
            description: null,
        });
      }
    });
    await finished(parser);
    return records;
}

export const openPotato = {
    parseKennzeichenDeutschlandCsv,
};

async function importKennzeichenDeutschlandCsv(db, filePath) {
    const parsedData = await parseKennzeichenDeutschlandCsv(filePath);
    parsedData.forEach(record => {
        insertRegionalIdentifier(
            db,
            record.country_id,
            record.type_id,
            record.identifier,
            record.name,
            record.description
        );
    });
}

export async function importOpenPotato(db) {
    await importKennzeichenDeutschlandCsv(db, './data/external/openpotato/kfz-kennzeichen/src/de/kennzeichen.csv');
}
