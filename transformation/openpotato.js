import { createReadStream } from 'fs';
import { parse } from 'csv-parse';
import { finished } from "stream/promises";
import * as logging from '../utils/logging.js';
import { insertLanguageString, insertRegionalIdentifier } from '../utils/inserts.js';
import { getSupportedLanguages } from '../utils/selects.js';

const COUNTRY_IDS = {
    germany: 'D',
    switzerland: 'CH',
    austria: 'A',
};
const TYPE_IDS = {
    germany: {
        district: 20,
        federal: 21,
        state: 22,
        diplomatic: 23,
    },
    switzerland: {
        canton: 10,
        diplomatic: -1,
    },
    austria: {
        district: 30,
        federal: 31,
        state: 32,
        diplomatic: 33,
    },
};

async function parseKennzeichenDeutschlandCsv(filePath) {
    const records = [];
    const parser = createReadStream(filePath)
        .pipe(parse({ delimiter: ',', from_line: 2 }));
    parser.on("readable", function () {
      let record;
      while ((record = parser.read()) !== null) {
        records.push({
            country_id: COUNTRY_IDS.germany,
            type_id: TYPE_IDS.germany.district,
            identifier: record[1],
            name: `raw:${record[2]}`,
            description: null,
            is_geographic: true,
        });
      }
    });
    await finished(parser);
    return records;
}

async function parseSonderKennzeichenDeutschlandCsv(filePath) {
    const TYPE_MAPPING = {
        'Bund': TYPE_IDS.germany.federal,
        'Länder': TYPE_IDS.germany.state,
        'Diplo': TYPE_IDS.germany.diplomatic,
    };
    const records = [];
    const parser = createReadStream(filePath)
        .pipe(parse({ delimiter: ',', from_line: 2 }));
    parser.on("readable", function () {
      let record;
      while ((record = parser.read()) !== null) {
        const typeId = TYPE_MAPPING[record[2]];
        const isGeographic = typeId !== TYPE_IDS.germany.federal && typeId !== TYPE_IDS.germany.diplomatic;
        records.push({
            country_id: COUNTRY_IDS.germany,
            type_id: typeId,
            identifier: record[1],
            name: `raw:${record[3]}`,
            description: `raw:${record[4]}`,
            is_geographic: isGeographic,
        });
      }
    });
    await finished(parser);
    return records;
}

/**
 * 
 * @param {string} cantonIdent 
 * @returns string
 */
function getCantonNameIdentifier(cantonIdent) {
    return `canton_${cantonIdent.toLocaleLowerCase()}`;
}

async function parseKennzeichenSchweizCsv(filePath) {
    const indices = [
        [2, 'de'],
        [4, 'fr'],
        [5, 'it'],
        [6, 'rm']
    ];
    const records = [];
    const i18n = [];
    const parser = createReadStream(filePath)
        .pipe(parse({ delimiter: ',', from_line: 2 }));
    parser.on("readable", function () {
      let record;
      while ((record = parser.read()) !== null) {
        records.push({
            country_id: COUNTRY_IDS.switzerland,
            type_id: TYPE_IDS.switzerland.canton,
            identifier: record[1],
            name: getCantonNameIdentifier(record[3]),
            description: null,
            is_geographic: true,
        });
        i18n.push({
            string_key: getCantonNameIdentifier(record[3]),
            values: indices.reduce((p, c, i, a) => {
                return {
                    ...p,
                    [c[1]]: record[c[0]],
                };
            }, {}),
        });
      }
    });
    await finished(parser);

    i18n.forEach(item => {
        item.values.en = item.values.de;
    });

    return {
        records,
        i18n: i18n.flatMap(i => {
            return Object.keys(i.values)
                .map(language_key => {
                    return {
                        string_key: i.string_key,
                        language_key,
                        value: i.values[language_key],
                    };
                })
        }),
    };
}

async function parseKennzeichenOesterreichCsv(filePath) {
    const records = [];
    const parser = createReadStream(filePath)
        .pipe(parse({ delimiter: ',', from_line: 2 }));
    parser.on("readable", function () {
      let record;
      while ((record = parser.read()) !== null) {
        records.push({
            country_id: COUNTRY_IDS.austria,
            type_id: TYPE_IDS.austria.district,
            identifier: record[1],
            name: `raw:${record[2]}`,
            description: null,
            is_geographic: true,
        });
      }
    });
    await finished(parser);
    return records;
}

async function parseSonderKennzeichenOesterreichCsv(filePath) {
    const TYPE_MAPPING = {
        'Bund': TYPE_IDS.austria.federal,
        'Länder': TYPE_IDS.austria.state,
        'Diplo': TYPE_IDS.austria.diplomatic,
    };
    const records = [];
    const parser = createReadStream(filePath)
        .pipe(parse({ delimiter: ',', from_line: 2 }));
    parser.on("readable", function () {
      let record;
      while ((record = parser.read()) !== null) {
        const typeId = TYPE_MAPPING[record[2]];
        const isGeographic = typeId !== TYPE_IDS.austria.federal && typeId !== TYPE_IDS.austria.diplomatic;
        records.push({
            country_id: COUNTRY_IDS.austria,
            type_id: typeId,
            identifier: record[1],
            name: `raw:${record[3]}`,
            description: null,
            is_geographic: isGeographic,
        });
      }
    });
    await finished(parser);
    return records;
}

export async function importOpenPotato(db) {
    const germany = await parseKennzeichenDeutschlandCsv('./data/external/openpotato/kfz-kennzeichen/src/de/kennzeichen.csv');
    const germanySK = await parseSonderKennzeichenDeutschlandCsv('./data/external/openpotato/kfz-kennzeichen/src/de/sonderkennzeichen.csv');
    const switzerland = await parseKennzeichenSchweizCsv('./data/external/openpotato/kfz-kennzeichen/src/ch/kennzeichen.csv');
    const austria = await parseKennzeichenOesterreichCsv('./data/external/openpotato/kfz-kennzeichen/src/at/kennzeichen.csv');
    const austriaSK = await parseSonderKennzeichenOesterreichCsv('./data/external/openpotato/kfz-kennzeichen/src/at/sonderkennzeichen.csv');

    const finalData = [
        ...germany,
        ...germanySK,
        ...switzerland.records,
        ...austria,
        ...austriaSK,
    ];
    const finalI18n = [
        ...switzerland.i18n,
    ];

    const supportedLanguages = new Set(getSupportedLanguages(db));
    logging.log('Supported languages', supportedLanguages);

    finalData.forEach(record => {
        insertRegionalIdentifier(
            db,
            record.country_id,
            record.type_id,
            record.identifier,
            record.name,
            record.description,
            record.is_geographic,
        );
    });
    finalI18n
        .filter(record => supportedLanguages.has(record.language_key))
        .forEach(record => {
            insertLanguageString(
                db,
                record.string_key,
                record.language_key,
                record.value,
            );
        });
}
