-- version
create table version
(
    id TEXT not null
        constraint version_pk primary key,
    version TEXT not null
);
