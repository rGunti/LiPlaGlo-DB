-- languages
create table languages
(
    id                    TEXT not null
        constraint languages_pk
            primary key,
    native_language_name  TEXT not null,
    english_language_name TEXT not null
);

-- i18n
create table i18n
(
    string_key   TEXT not null,
    language_key TEXT not null
        constraint i18n_languages_id_fk
            references languages,
    value        TEXT not null,
    constraint i18n_pk
        primary key (string_key, language_key) on conflict rollback
);

create unique index i18n_string_key_language_key_uindex
    on i18n (string_key, language_key);

-- countries
create table countries
(
    id                        TEXT collate NOCASE not null
        constraint countries_pk
            primary key
                on conflict rollback,
    name                      TEXT                not null,
    flag_emoji                text,
    license_plate_font        TEXT,
    generic_preview           TEXT,
    description               text,
    vanity_plates_possible    INT,
    vanity_plates_description TEXT,
    hidden                    integer default 1   not null
);

create index countries_id_index
    on countries (id);

-- country_links
create table country_links
(
    id            integer not null
        constraint countries_links_pk
            primary key autoincrement,
    country_id    TEXT    not null
        constraint countries_links_countries_id_fk
            references countries
            on update cascade on delete cascade,
    label         TEXT,
    link          TEXT    not null,
    link_language TEXT
);

-- plate_variants
create table plate_variants
(
    id                   integer       not null
        constraint plate_variants_pk
            primary key autoincrement,
    country_id           TEXT          not null
        constraint plate_variants_countries_id_fk
            references countries
            on update restrict on delete restrict,
    title                TEXT          not null,
    preview              TEXT          not null,
    preview_text_color   TEXT,
    preview_bg_color     TEXT,
    preview_border_color TEXT,
    in_use               INT default 1 not null,
    preview_font         TEXT,
    description          TEXT,
    "order"              integer
);

-- plate_identifier_type
create table plate_identifier_type
(
    id         integer not null
        constraint plate_identifier_type_pk
            primary key autoincrement,
    country_id text    not null
        constraint plate_identifier_type_countries_id_fk
            references countries,
    name       text    not null
);

-- plate_identifier
create table plate_identifier
(
    id            integer           not null
        constraint plate_identifier_pk
            primary key autoincrement,
    country_id    TEXT              not null,
    type_id       integer           not null
        constraint plate_identifier_plate_identifier_type_id_fk
            references plate_identifier_type,
    identifier    TEXT              not null,
    name          TEXT              not null,
    description   TEXT,
    is_geographic integer           not null
);
