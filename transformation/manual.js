import { readFileSync } from 'fs';
import { insertRegionalIdentifier } from '../utils/inserts.js';

const COUNTRY_IDS = {
    czech: 'CZ',
    slovakia: 'SK',
    poland: 'PL',
};
const TYPE_IDS = {
    czech:    { regions: 40 },
    slovakia: { district: 50 },
    poland:   { district: 60 },
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

export function importManual(db) {
    const czech    = loadPlates('./data/external/manual/cz/plates.json', COUNTRY_IDS.czech,    TYPE_IDS.czech.regions);
    const slovakia = loadPlates('./data/external/manual/sk/plates.json', COUNTRY_IDS.slovakia, TYPE_IDS.slovakia.district);
    const poland   = loadPlates('./data/external/manual/pl/plates.json', COUNTRY_IDS.poland,   TYPE_IDS.poland.district);

    [...czech, ...slovakia, ...poland].forEach(record => {
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
