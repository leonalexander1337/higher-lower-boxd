const fs = require("fs");
const readline = require("readline");

// Output Streams
const allStream = fs.createWriteStream("processed/movies.all.tsv");
const popularStream = fs.createWriteStream("processed/movies.10000.votes.tsv");

// Header schreiben
const HEADER = "tconst\ttitleType\tprimaryTitle\toriginalTitle\tisAdult\tyear\truntimeMinutes\tgenres\taverageRating\tnumVotes\n";

allStream.write(HEADER);
popularStream.write(HEADER);

// Ratings Map
const ratingMap = {};

// =====================
// STEP 1: RATINGS LADEN
// =====================
async function loadRatings() {
    const rl = readline.createInterface({
        input: fs.createReadStream("raw/title.ratings.tsv")
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

    console.log("ratings geladen");
}

// =====================
// STEP 2: BASICS VERARBEITEN
// =====================
async function processBasics() {
    const rl = readline.createInterface({
        input: fs.createReadStream("raw/title.basics.tsv")
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

        // nur echte Filme
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

            // ALLE Filme
            allStream.write(row);

            // nur populäre Filme
            if (rating.votes >= 10000) {
                popularStream.write(row);
            }
        }
    }

    console.log("tsv erstellt");
}

// =====================
// RUN
// =====================
(async () => {
    await loadRatings();
    await processBasics();

    allStream.end();
    popularStream.end();

    console.log("preprocess fertig");
})();