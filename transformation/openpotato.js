import { createReadStream } from 'fs';
import { parse } from 'csv-parse';
import { finished } from "stream/promises";
import { insertRegionalIdentifier } from '../utils/inserts.js';

const COUNTRY_ID_GERMANY = 'D';
const COUNTRY_ID_SWITZERLAND = 'CH';
const COUNTRY_ID_AUSTRIA = 'A';
const TYPE_ID_GERMANY_DISTRICTS = 2;
const TYPE_ID_SWITZERLAND_CANTONS = 1;
const TYPE_ID_AUSTRIA_DISTRICTS = 3;

async function parseKennzeichenDeutschlandCsv(filePath) {
    const records = [];
    const parser = createReadStream(filePath)
        .pipe(parse({ delimiter: ',', from_line: 2 }));
    parser.on("readable", function () {
      let record;
      while ((record = parser.read()) !== null) {
        records.push({
            country_id: COUNTRY_ID_GERMANY,
            type_id: TYPE_ID_GERMANY_DISTRICTS,
            identifier: record[1],
            name: `raw:${record[2]}`,
            description: null,
        });
      }
    });
    await finished(parser);
    return records;
}

async function parseKennzeichenSchweizCsv(filePath) {
    const records = [];
    const parser = createReadStream(filePath)
        .pipe(parse({ delimiter: ',', from_line: 2 }));
    parser.on("readable", function () {
      let record;
      while ((record = parser.read()) !== null) {
        records.push({
            country_id: COUNTRY_ID_SWITZERLAND,
            type_id: TYPE_ID_SWITZERLAND_CANTONS,
            identifier: record[1],
            name: `raw:${record[2]}`,
            description: null,
        });
      }
    });
    await finished(parser);
    return records;
}

async function parseKennzeichenOesterreichCsv(filePath) {
    const records = [];
    const parser = createReadStream(filePath)
        .pipe(parse({ delimiter: ',', from_line: 2 }));
    parser.on("readable", function () {
      let record;
      while ((record = parser.read()) !== null) {
        records.push({
            country_id: COUNTRY_ID_AUSTRIA,
            type_id: TYPE_ID_AUSTRIA_DISTRICTS,
            identifier: record[1],
            name: `raw:${record[2]}`,
            description: null,
        });
      }
    });
    await finished(parser);
    return records;
}

export async function importOpenPotato(db) {
    const germany = await parseKennzeichenDeutschlandCsv('./data/external/openpotato/kfz-kennzeichen/src/de/kennzeichen.csv');
    const switzerland = await parseKennzeichenSchweizCsv('./data/external/openpotato/kfz-kennzeichen/src/ch/kennzeichen.csv');
    const austria = await parseKennzeichenOesterreichCsv('./data/external/openpotato/kfz-kennzeichen/src/at/kennzeichen.csv');

    const finalData = [
        ...germany,
        ...switzerland,
        ...austria,
    ];
    finalData.forEach(record => {
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
