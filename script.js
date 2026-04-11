let movies = [];
let current;
let next;
let score = 0;
let highScore = localStorage.getItem("highScore") || 0;
let currentMode = "movies";

// später absichern (.env + backend)
const API_KEY = "36839bc7dc5de72ef1022a5e6287af91";

// einfacher Poster Cache (sehr wichtig!)
const posterCache = {};

// =====================
// DATA
// =====================

async function loadData(mode = "movies") {
    try {
        const res = await fetch(`data/${mode}.json`);
        movies = await res.json();
    } catch (e) {
        console.error("Mode load failed:", mode);
        return;
    }

    startGame();
}

// =====================
// POSTER
// =====================

async function fetchPoster(title, year) {
    const key = `${title}_${year}`;

    // Cache nutzen
    if (posterCache[key]) return posterCache[key];

    try {
        const res = await fetch(
            `https://api.themoviedb.org/3/search/movie?api_key=${API_KEY}&query=${encodeURIComponent(title)}&year=${year}`
        );

        const data = await res.json();

        if (data.results && data.results.length > 0) {
            const posterPath = data.results[0].poster_path;

            if (posterPath) {
                const url = `https://image.tmdb.org/t/p/w500${posterPath}`;
                posterCache[key] = url;
                return url;
            }
        }
    } catch (e) {
        console.error("Poster fetch error:", e);
    }

    posterCache[key] = null;
    return null;
}

// =====================
// SIDEBAR
// =====================

function setMode(mode, el) {
    currentMode = mode;
    score = 0;

    document.querySelectorAll("#sidebar button").forEach(b =>
        b.classList.remove("active")
    );

    if (el) el.classList.add("active");

    loadData(mode);
}

// =====================
// GAME LOGIC
// =====================

function getRandomMovie() {
    return movies[Math.floor(Math.random() * movies.length)];
}

function getValidNextMovie(current) {
    let next;

    do {
        next = getRandomMovie();
    } while (
        next.title === current.title ||
        Math.abs(next.rating - current.rating) < 0.2
    );

    return next;
}

function startGame() {
    score = 0;
    current = getRandomMovie();
    next = getValidNextMovie(current);
    render();
}

function guess(choice) {
    const correct =
        (choice === "higher" && next.rating >= current.rating) ||
        (choice === "lower" && next.rating < current.rating);

    if (correct) {
        score++;

        if (score > highScore) {
            highScore = score;
            localStorage.setItem("highScore", highScore);
        }

        const oldNext = next;

        current = oldNext;

        next = getValidNextMovie(current);

    } else {
        score = 0;

        current = getRandomMovie();
        next = getValidNextMovie(current);
    }

    render();
}

// =====================
// RENDER
// =====================

async function render() {
    const posterA = await fetchPoster(current.title, current.year);
    const posterB = await fetchPoster(next.title, next.year);

    document.getElementById("movieA").innerHTML = `
        <div class="card" style="background-image:url('${posterA || ""}');background-size:cover;">
            <h2>${current.title}</h2>
            <p>${current.year}</p>
            <p>⭐ ${current.rating}</p>
        </div>
    `;

    document.getElementById("movieB").innerHTML = `
        <div class="card" style="background-image:url('${posterB || ""}');background-size:cover;">
            <h2>${next.title}</h2>
            <p>${next.year}</p>
            <p>⭐ ?.?</p>
        </div>
    `;

    document.getElementById("score").innerText =
        `Score: ${score}`;

    document.getElementById("highscore").innerText =
        `Highscore: ${highScore}`;
}

// =====================
// INIT
// =====================

loadData();