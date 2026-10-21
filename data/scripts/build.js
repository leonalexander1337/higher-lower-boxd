const fs = require("fs");
const path = require("path");
const readline = require("readline");

const ROOT_DIR = path.join(__dirname, "..", "..");
const RAW_DIR = path.join(__dirname, "..", "raw");
const PROCESSED_DIR = path.join(__dirname, "..", "processed");
const DIST_DIR = path.join(__dirname, "..", "dist");
const CACHE_FILE = path.join(__dirname, "..", "cache", "posters.json");

// Guard against publishing a broken dataset (e.g. IMDb format change)
const MIN_MOVIES = 10000;

// TMDB throttling: CONCURRENCY parallel workers, each waiting at least
// REQUEST_INTERVAL ms between requests (~25 req/s, TMDB allows ~50)
const CONCURRENCY = 8;
const REQUEST_INTERVAL = 300;
const MAX_RETRIES = 3;

// Local runs read the key from .env, CI passes it as an env variable
const envFile = path.join(ROOT_DIR, ".env");
if (fs.existsSync(envFile)) process.loadEnvFile(envFile);
const API_KEY = process.env.TMDB_API_KEY;

const movies = [];

// =====================
// STEP 1: READ TSV
// =====================
async function loadTSV() {
    const rl = readline.createInterface({
        input: fs.createReadStream(path.join(PROCESSED_DIR, "movies.10000.votes.tsv"))
    });

    let first = true;

    for await (const line of rl) {
        if (first) {
            first = false;
            continue;
        }

        const cols = line.split("\t");

        const movie = {
            id: cols[0],
            title: cols[2],
            year: parseInt(cols[5]),
            rating: parseFloat(cols[8]),
            votes: parseInt(cols[9]),
            genres: cols[7].split(",")
        };

        movies.push(movie);
    }

    console.log("movies loaded:", movies.length);
}

// =====================
// STEP 2: POSTERS
// =====================
// Poster paths are resolved here once instead of in the browser, so the
// TMDB key never ships to the client. Results are cached by IMDb id, so
// later runs only query movies that are new (or had no poster yet).
function loadCache() {
    if (!fs.existsSync(CACHE_FILE)) return {};
    return JSON.parse(fs.readFileSync(CACHE_FILE, "utf8"));
}

function saveCache(cache) {
    fs.mkdirSync(path.dirname(CACHE_FILE), { recursive: true });

    // sorted keys keep git diffs small
    const sorted = {};
    for (const key of Object.keys(cache).sort()) sorted[key] = cache[key];

    fs.writeFileSync(CACHE_FILE, JSON.stringify(sorted, null, 1));
}

const sleep = ms => new Promise(r => setTimeout(r, ms));

// Returns the poster path, null if TMDB has none, or undefined on failure
async function fetchPosterPath(imdbId) {
    const url = `https://api.themoviedb.org/3/find/${imdbId}?api_key=${API_KEY}&external_source=imdb_id`;

    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
        try {
            const res = await fetch(url);

            if (res.status === 429) {
                const wait = parseInt(res.headers.get("retry-after")) || 2;
                await sleep(wait * 1000);
                continue;
            }

            if (res.status === 401) {
                throw new Error("TMDB rejected the API key (401)");
            }

            if (!res.ok) {
                await sleep(1000 * attempt);
                continue;
            }

            const data = await res.json();
            const result = data.movie_results && data.movie_results[0];
            return (result && result.poster_path) || null;
        } catch (e) {
            if (e.message.includes("401")) throw e;
            await sleep(1000 * attempt);
        }
    }

    return undefined;
}

async function resolvePosters() {
    const cache = loadCache();
    const todo = movies.filter(m => !cache[m.id]);

    if (!API_KEY) {
        console.warn("TMDB_API_KEY not set - using cached posters only");
    } else if (todo.length > 0) {
        console.log(`fetching posters: ${todo.length} (cached: ${movies.length - todo.length})`);

        let done = 0;
        let failed = 0;
        let queue = 0;

        async function worker() {
            while (queue < todo.length) {
                const movie = todo[queue++];
                const started = Date.now();

                const poster = await fetchPosterPath(movie.id);

                if (poster === undefined) failed++;
                else cache[movie.id] = poster;

                done++;
                if (done % 500 === 0) {
                    console.log(`  posters: ${done}/${todo.length}`);
                    saveCache(cache); // keep progress if the run gets interrupted
                }

                const elapsed = Date.now() - started;
                if (elapsed < REQUEST_INTERVAL) await sleep(REQUEST_INTERVAL - elapsed);
            }
        }

        await Promise.all(Array.from({ length: CONCURRENCY }, worker));
        saveCache(cache);

        console.log(`posters done (failed: ${failed})`);
    }

    for (const m of movies) {
        m.poster = cache[m.id] || null;
    }
}

// =====================
// STEP 3: BASE JSON
// =====================
function write(name, arr) {
    const output = arr.map(m => ({
        title: m.title,
        year: m.year,
        rating: m.rating,
        poster: m.poster
    }));

    fs.writeFileSync(
        path.join(DIST_DIR, name),
        JSON.stringify(output, null, 2)
    );
}

// The date shown on the page: when the IMDb data was downloaded
function writeMeta() {
    const ratingsFile = path.join(RAW_DIR, "title.ratings.tsv");
    const updated = fs.existsSync(ratingsFile)
        ? fs.statSync(ratingsFile).mtime
        : new Date();

    fs.writeFileSync(
        path.join(DIST_DIR, "meta.json"),
        JSON.stringify({ updated: updated.toISOString().slice(0, 10) }, null, 2)
    );
}

// =====================
// STEP 4: GENRES
// =====================

// EXTEND HERE LATER
const GENRE_MAP = {
    horror: ["Horror"],
    animation: ["Animation"],
    action: ["Action"],
    comedy: ["Comedy"],
    drama: ["Drama"],
    scifi: ["Sci-Fi"],
    thriller: ["Thriller"],
    romance: ["Romance"],
    crime: ["Crime"],
    western: ["Western"]
};

// =====================
// STEP 5: GENRE FILTER
// =====================
function filterByGenres(targetGenres) {
    return movies.filter(m =>
        m.genres.some(g => targetGenres.includes(g))
    );
}

// =====================
// STEP 6: OUTPUTS
// =====================
// The source TSV is already filtered to movies with >= 10000 votes
// (see preprocess.js), so every one of them is written out here.
// No slicing/sampling on top of that - the vote-count filter is the
// only cutoff we want, otherwise the year range gets cut short.
function buildOutputs() {
    // ALL
    write("movies.json", movies);

    // GENRES
    for (const key in GENRE_MAP) {
        const filtered = filterByGenres(GENRE_MAP[key]);

        console.log(key, filtered.length);

        write(`${key}.json`, filtered);
    }

    writeMeta();
}

// =====================
// RUN
// =====================
(async () => {
    fs.mkdirSync(DIST_DIR, { recursive: true });

    await loadTSV();

    if (movies.length < MIN_MOVIES) {
        throw new Error(`only ${movies.length} movies loaded, expected at least ${MIN_MOVIES}`);
    }

    await resolvePosters();
    buildOutputs();

    console.log("build done");
})().catch(e => {
    console.error("build failed:", e.message);
    process.exit(1);
});
