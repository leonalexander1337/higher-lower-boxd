const fs = require("fs");
const path = require("path");
const readline = require("readline");

const RAW_DIR = path.join(__dirname, "..", "raw");
const PROCESSED_DIR = path.join(__dirname, "..", "processed");

const MIN_VOTES = 10000;

// processed/ is gitignored, so it doesn't exist on a fresh checkout (CI)
fs.mkdirSync(PROCESSED_DIR, { recursive: true });

// Output streams
const allStream = fs.createWriteStream(path.join(PROCESSED_DIR, "movies.all.tsv"));
const popularStream = fs.createWriteStream(path.join(PROCESSED_DIR, "movies.10000.votes.tsv"));

const HEADER = "tconst\ttitleType\tprimaryTitle\toriginalTitle\tisAdult\tyear\truntimeMinutes\tgenres\taverageRating\tnumVotes\n";

allStream.write(HEADER);
popularStream.write(HEADER);

const ratingMap = {};

// =====================
// STEP 1: LOAD RATINGS
// =====================
async function loadRatings() {
    const rl = readline.createInterface({
        input: fs.createReadStream(path.join(RAW_DIR, "title.ratings.tsv"))
    });

    let first = true;

    for await (const line of rl) {
        if (first) {
            first = false;
            continue;
        }

        const [tconst, rating, votes] = line.split("\t");

        if (rating !== "\\N" && votes !== "\\N") {
            ratingMap[tconst] = {
                rating,
                votes: parseInt(votes)
            };
        }
    }

    console.log("ratings loaded");
}

// =====================
// STEP 2: PROCESS BASICS
// =====================
async function processBasics() {
    const rl = readline.createInterface({
        input: fs.createReadStream(path.join(RAW_DIR, "title.basics.tsv"))
    });

    let first = true;

    for await (const line of rl) {
        if (first) {
            first = false;
            continue;
        }

        const cols = line.split("\t");

        const tconst = cols[0];
        const type = cols[1];
        const primaryTitle = cols[2];
        const originalTitle = cols[3];
        const isAdult = cols[4];
        const year = cols[5];
        const runtime = cols[7];
        const genres = cols[8];

        // movies only
        if (
            type === "movie" &&
            year !== "\\N" &&
            ratingMap[tconst]
        ) {
            const rating = ratingMap[tconst];

            const row = [
                tconst,
                type,
                primaryTitle,
                originalTitle,
                isAdult,
                year,
                runtime,
                genres,
                rating.rating,
                rating.votes
            ].join("\t") + "\n";

            // every movie
            allStream.write(row);

            // popular movies only
            if (rating.votes >= MIN_VOTES) {
                popularStream.write(row);
            }
        }
    }

    console.log("tsv files created");
}

// =====================
// RUN
// =====================
(async () => {
    await loadRatings();
    await processBasics();

    allStream.end();
    popularStream.end();

    console.log("preprocess done");
})();
