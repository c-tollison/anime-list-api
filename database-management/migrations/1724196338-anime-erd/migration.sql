CREATE TYPE anime_type AS ENUM ('TV', 'TV Special', 'CM', 'OVA', 'Movie', 'Music', 'ONA', 'PV', 'Special', 'Unknown');

CREATE TYPE anime_status AS ENUM ('Finished Airing', 'Currently Airing', 'Not yet aired');

CREATE TYPE anime_rating AS ENUM ('R - 17+ (violence & profanity)', 'PG-13 - Teens 13 or older', 'PG - Children', 'R+ - Mild Nudity', 'G - All Ages', 'Rx - Hentai', 'Not Yet Rated');

CREATE TYPE source_material AS ENUM ('Original', 'Manga', 'Light novel', 'Game', 'Visual novel', '4-koma manga', 'Novel', 'Other', 'Unknown', 'Picture book', 'Web manga', 'Music', 'Radio', 'Book', 'Mixed media', 'Card game', 'Web novel');

CREATE TYPE anime_demographic AS ENUM ('Shounen', 'Josei', 'Seinen', 'Shoujo', 'Kids');

CREATE TABLE anime_genre (
    id SERIAL PRIMARY KEY,
    genre TEXT UNIQUE NOT NULL,
    explicit BOOLEAN NOT NULL
);

INSERT INTO anime_genre (genre, explicit) VALUES 
('Action', false), ('Award Winning', false), 
('Sci-Fi', false), ('Adventure', false), 
('Drama', false), ('Mystery', false), 
('Supernatural', false), ('Fantasy', false), 
('Sports', false), ('Comedy', false), 
('Romance', false), ('Slice of Life', false), 
('Suspense', false), ('Ecchi', true), 
('Gourmet', false), ('Avant Garde', false), 
('Horror', false), ('Girls Love', false), 
('Boys Love', false), ('Hentai', true), 
('Erotica', true);

CREATE TABLE anime_theme (
    id SERIAL PRIMARY KEY,
    theme TEXT UNIQUE NOT NULL
);

INSERT INTO anime_theme (theme) VALUES 
('Adult Cast'), ('Space'), ('Detective'), 
('Team Sports'), ('Love Polygon'), 
('Visual Arts'), ('Racing'), ('Psychological'), 
('Martial Arts'), ('School'), ('Combat Sports'), 
('Gag Humor'), ('Organized Crime'), ('Vampire'), 
('Historical'), ('Military'), ('Time Travel'), 
('Mecha'), ('Gore'), ('Samurai'), ('Video Game'), 
('Reincarnation'), ('Strategy Game'), ('Harem'), 
('Music'), ('Survival'), ('Mythology'), 
('CGDCT'), ('Super Power'), ('Mahou Shoujo'), 
('Reverse Harem'), ('Childcare'), 
('Delinquents'), ('Isekai'), ('Crossdressing'), 
('Showbiz'), ('Magical Sex Shift'), ('Parody'), 
('Otaku Culture'), ('Workplace'), ('Iyashikei'), 
('High Stakes Game'), ('Performing Arts'), 
('Anthropomorphic'), ('Idols (Female)'), 
('Medical'), ('Pets'), ('Educational'), 
('Idols (Male)'), ('Romantic Subtext');

CREATE TABLE anime_series (
    id SERIAL PRIMARY KEY,
    title TEXT NOT NULL UNIQUE,
    synopsis TEXT,
    score NUMERIC(2,1) CHECK (score >= 0 AND score <= 5),
    scored_by_count INTEGER CHECK (scored_by_count >= 0),
    run_start DATE,
    run_end DATE,
    total_episodes INTEGER CHECK (total_episodes >= 0),
    total_seasons INTEGER CHECK (total_seasons >= 0),
    total_watchers INTEGER CHECK (total_watchers >= 0),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE anime (
    id SERIAL PRIMARY KEY,
    anime_series_id INTEGER NOT NULL REFERENCES anime_series(id),
    youtube_trailer_link TEXT,
    approved BOOLEAN NOT NULL,
    title TEXT NOT NULL,
    title_english TEXT,
    title_japanese TEXT,
    type anime_type NOT NULL,
    source_material source_material NOT NULL,
    episodes INTEGER CHECK (episodes >= 0),
    status anime_status NOT NULL,
    airing BOOLEAN NOT NULL,
    aired_start DATE,
    aired_end DATE,
    duration INTERVAL,
    rating anime_rating NOT NULL,
    score NUMERIC(2,1) CHECK (score >= 0 AND score <= 5),
    scored_by_count INTEGER CHECK (scored_by_count >= 0),
    season TEXT CHECK (season IN ('Winter', 'Spring', 'Summer', 'Fall')),
    year INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    season_order_index INTEGER CHECK (season_order_index > 0)
);

CREATE TABLE anime_producer (
    id SERIAL PRIMARY KEY,
    name TEXT UNIQUE NOT NULL
);

CREATE TABLE anime_licensor (
    id SERIAL PRIMARY KEY,
    name TEXT UNIQUE NOT NULL
);

CREATE TABLE anime_studio (
    id SERIAL PRIMARY KEY,
    name TEXT UNIQUE NOT NULL
);

CREATE TABLE anime_producer_join (
    anime_id INTEGER NOT NULL REFERENCES anime(id),
    producer_id INTEGER NOT NULL REFERENCES anime_producer(id),
    PRIMARY KEY (anime_id, producer_id)
);

CREATE TABLE anime_licensor_join (
    anime_id INTEGER NOT NULL REFERENCES anime(id),
    licensor_id INTEGER NOT NULL REFERENCES anime_licensor(id),
    PRIMARY KEY (anime_id, licensor_id)
);

CREATE TABLE anime_studio_join (
    anime_id INTEGER NOT NULL REFERENCES anime(id),
    studio_id INTEGER NOT NULL REFERENCES anime_studio(id),
    PRIMARY KEY (anime_id, studio_id)
);

CREATE TABLE anime_genre_join (
    anime_id INTEGER NOT NULL REFERENCES anime(id),
    genre_id INTEGER NOT NULL REFERENCES anime_genre(id),
    PRIMARY KEY (anime_id, genre_id)
);

CREATE TABLE anime_theme_join (
    anime_id INTEGER NOT NULL REFERENCES anime(id),
    theme_id INTEGER NOT NULL REFERENCES anime_theme(id),
    PRIMARY KEY (anime_id, theme_id)
);

CREATE TABLE anime_demographic_join (
    anime_id INTEGER NOT NULL REFERENCES anime(id),
    demographic anime_demographic NOT NULL,
    PRIMARY KEY (anime_id, demographic)
);