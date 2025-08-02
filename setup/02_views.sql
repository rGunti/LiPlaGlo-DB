-- v_untranslated_strings
CREATE VIEW v_untranslated_strings as
with all_combinations as (
    select distinct
        i.string_key,
        l.id as language_key
    from i18n i
    cross join languages l
),
missing_translations as (
    select
        ac.string_key,
        ac.language_key
    from all_combinations ac
    left join i18n i
        on ac.string_key = i.string_key and ac.language_key = i.language_key
    where i.string_key is null and ac.language_key != 'xx'
),
grouped_missing as (
    select
        string_key,
        group_concat(language_key, ',') as missing_languages
    from missing_translations
    group by string_key
)
select * from grouped_missing;
