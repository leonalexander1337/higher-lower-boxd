const fs = require("fs");
const readline = require("readline");

const movies = [];

// =====================
// STEP 1: TSV EINLESEN
// =====================
async function loadTSV() {
    const rl = readline.createInterface({
        input: fs.createReadStream("processed/movies.10000.votes.tsv")
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

    console.log("filme geladen:", movies.length);
}

// =====================
// STEP 2: BASIS JSON
// =====================
function write(name, arr) {
    const output = arr.map(m => ({
        title: m.title,
        year: m.year,
        rating: m.rating
    }));

    fs.writeFileSync(
        `${name}`,
        JSON.stringify(output, null, 2)
    );
}

// =====================
// STEP 3: GENRES
// =====================

// HIER ERWEITERST DU SPÄTER
const GENRE_MAP = {
    horror: ["Horror"],
    animation: ["Animation"],
    action: ["Action"],
    comedy:    ["Comedy"],
    drama:     ["Drama"],
    scifi:     ["Sci-Fi"],
    thriller:  ["Thriller"],
    romance:   ["Romance"],
    crime:     ["Crime"],
    western:   ["Western"]

    // Beispiel:
    // comedy: ["Comedy"],
    // drama: ["Drama"],
    // scifi: ["Sci-Fi"]
    // superhero: ["Action", "Sci-Fi"]

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
function buildOutputs() {
    // ALL
    write("movies.json", movies.slice(0, 1000));

    // GENRES
    for (const key in GENRE_MAP) {
        const filtered = filterByGenres(GENRE_MAP[key]);

        console.log(key, filtered.length);

        write(`${key}.json`, filtered.slice(0, 500));
    }
}

// =====================
// RUN
// =====================
(async () => {
    await loadTSV();
    buildOutputs();

    console.log("process fertig");
})();