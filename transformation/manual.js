import { readFileSync } from 'fs';
import { insertRegionalIdentifier } from '../utils/inserts.js';

const COUNTRY_IDS = {
    czech: 'CZ',
    slovakia: 'SK',
    poland: 'PL',
    norway: 'N',
    ukraine: 'UA',
};
const TYPE_IDS = {
    czech:    { regions: 40 },
    slovakia: { district: 50 },
    poland:   { district: 60 },
    norway:   { district: 70, special: 71, diplomatic: 72, federal: 73 },
    ukraine:  { district: 80, diplomatic: 81, federal: 82 },
};

function loadPlates(filePath, countryId, typeId) {
    const entries = JSON.parse(readFileSync(filePath, 'utf8'));
    return entries.map(entry => ({
        country_id: countryId,
        type_id: typeId,
        identifier: entry.identifier,
        name: `raw:${entry.name}`,
        description: null,
        is_geographic: true,
    }));
}

function loadPlatesWithTypes(filePath, countryId, typeIds) {
    const entries = JSON.parse(readFileSync(filePath, 'utf8'));
    return entries.map(entry => ({
        country_id: countryId,
        type_id: typeIds[entry.type],
        identifier: entry.identifier,
        name: `raw:${entry.name}`,
        description: null,
        is_geographic: entry.type === 'district',
    }));
}

export function importManual(db) {
    const czech    = loadPlates('./data/external/manual/cz/plates.json', COUNTRY_IDS.czech,    TYPE_IDS.czech.regions);
    const slovakia = loadPlates('./data/external/manual/sk/plates.json', COUNTRY_IDS.slovakia, TYPE_IDS.slovakia.district);
    const poland   = loadPlates('./data/external/manual/pl/plates.json', COUNTRY_IDS.poland,   TYPE_IDS.poland.district);
    const norway   = loadPlatesWithTypes('./data/external/manual/no/plates.json', COUNTRY_IDS.norway,   TYPE_IDS.norway);
    const ukraine  = loadPlatesWithTypes('./data/external/manual/ua/plates.json', COUNTRY_IDS.ukraine,  TYPE_IDS.ukraine);

    [...czech, ...slovakia, ...poland, ...norway, ...ukraine].forEach(record => {
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
}
