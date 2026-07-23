const fs = require("fs");
const path = require("path");
const readline = require("readline");

const PROCESSED_DIR = path.join(__dirname, "..", "processed");
const DIST_DIR = path.join(__dirname, "..", "dist");

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
// STEP 2: BASE JSON
// =====================
function write(name, arr) {
    const output = arr.map(m => ({
        title: m.title,
        year: m.year,
        rating: m.rating
    }));

    fs.writeFileSync(
        path.join(DIST_DIR, name),
        JSON.stringify(output, null, 2)
    );
}

// =====================
// STEP 3: GENRES
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
// STEP 4: GENRE FILTER
// =====================
function filterByGenres(targetGenres) {
    return movies.filter(m =>
        m.genres.some(g => targetGenres.includes(g))
    );
}

// =====================
// STEP 5: OUTPUTS
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
}

// =====================
// RUN
// =====================
(async () => {
    if (!fs.existsSync(DIST_DIR)) {
        fs.mkdirSync(DIST_DIR, { recursive: true });
    }

    await loadTSV();
    buildOutputs();

    console.log("build done");
})();
