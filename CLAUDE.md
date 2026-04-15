# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

This repository aggregates license plate data from European countries (Germany, Switzerland, Austria) and compiles it into a SQLite database (`liplaglo.db`) consumed by the License Plate Glossary iOS app.

External data source: [openpotato/kfz-kennzeichen](https://github.com/openpotato/kfz-kennzeichen/tree/main) (CSV files stored under `data/external/openpotato/`).

## Commands

```bash
npm run build      # Rebuild the database from scratch (deletes and recreates liplaglo.db)
npm run liplaglo   # Run the CLI management tool
```

The `liplaglo` CLI manages i18n strings:
```bash
node liplaglo.js add-string --language <lang> --string <key> "<value>"
node liplaglo.js import-string --language <lang> --string <key> <file>
```

To bulk-import i18n from `data/i18n/_import.json` (array of `{language_key, string_key, value}`):
```bash
node _import.js
```

## Build Pipeline

`build.js` orchestrates the full build in this order:

1. **Setup SQL scripts** — runs all `.sql` files in `setup/` alphabetically (files prefixed with `_` are skipped). These create tables, views, and the version table.
2. **Static JSON data** — inserts `data/languages.json`, `data/countries.json`, `data/country_links.json`, `data/plate_variants.json`, `data/plate_identifier_type.json` directly into matching tables.
3. **i18n** — inserts all `data/i18n/<lang>.json` files into the `i18n` table. The `xx` language is a placeholder with empty values used to track all string keys.
4. **Transformation** (`transformation/openpotato.js`) — parses openpotato CSVs and inserts `plate_identifier` rows.
5. **Post-processing SQL** — runs all `.sql` files in `data/postprocessing/` alphabetically.
6. **Version** — sets `db_version` to the current git commit SHA (appended with `-dirty` if there are uncommitted changes).

## Key Data Concepts

**`plate_identifier.name` field**: Uses either a `raw:` prefix (e.g., `raw:Bayern`) meaning the value is a literal display string, or a plain string key (e.g., `canton_zh`) that references the `i18n` table for localized lookup.

**`plate_identifier_type` IDs**: Defined as constants in `transformation/openpotato.js`:
- Germany: district=20, federal=21, state=22, diplomatic=23
- Switzerland: canton=10
- Austria: district=30, federal=31, state=32, diplomatic=33

**`v_untranslated_strings` view**: Lists string keys that are missing translations for any language (excluding `xx`). Useful for finding gaps in i18n coverage.

## Adding a New Country

1. Add the country to `data/countries.json` and any links to `data/country_links.json`.
2. Add identifier types to `data/plate_identifier_type.json`.
3. Add plate variants to `data/plate_variants.json`.
4. Add all required i18n string keys to each `data/i18n/<lang>.json` file (including `xx` with empty values).
5. If importing from openpotato CSVs, add a parser in `transformation/openpotato.js` and register it in `transformation/index.js`.
6. Run `npm run build` to rebuild the database.
