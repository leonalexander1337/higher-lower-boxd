let movies = [];
let current;
let next;
let score = 0;
let highScore = localStorage.getItem("highScore") || 0;
let currentMode = "movies";
let yearMin = 1920;
let yearMax = 2020;

// später absichern (.env + backend)
const API_KEY = "36839bc7dc5de72ef1022a5e6287af91";

// einfacher Poster Cache (sehr wichtig!)
const posterCache = {};

// =====================
// HIGHSCORE (per mode)
// =====================
 
function getHighScore(mode) {
    return parseInt(localStorage.getItem(`highScore_${mode}`)) || 0;
}
 
function setHighScore(mode, value) {
    localStorage.setItem(`highScore_${mode}`, value);
}

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
 
    applyYearFilter();
    startGame();
}

// =====================
// YEAR FILTER
// =====================
 
function applyYearFilter() {
    filteredMovies = movies.filter(m => {
        const decade = Math.floor(m.year / 10) * 10;
        return decade >= yearMin && decade <= yearMax;
    });
 
    // Fallback: if filter is too strict, use all movies
    if (filteredMovies.length < 2) {
        filteredMovies = movies;
    }
}

// =====================
// POSTER
// =====================

async function fetchPoster(title, year) {
    const key = `${title}_${year}`;
 
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
 
    document.querySelectorAll("#sidebar-left .mode-buttons button").forEach(b =>
        b.classList.remove("active")
    );
 
    if (el) el.classList.add("active");
 
    loadData(mode);
    updateHighscoreDisplay();
}

// =====================
// YEAR SLIDER
// =====================
 
const DECADE_MIN = 1920;
const DECADE_MAX = 2020;
const DECADE_STEP = 10;
const DECADES = [];
for (let d = DECADE_MIN; d <= DECADE_MAX; d += DECADE_STEP) DECADES.push(d);
const TOTAL_STEPS = DECADES.length - 1; // 0..10
 
let sliderMinIdx = 0;
let sliderMaxIdx = TOTAL_STEPS;
 
function initSlider() {
    const container = document.getElementById("year-slider-container");
    if (!container) return;
 
    updateSliderUI();
 
    // Mouse/touch events handled via CSS + JS on the thumbs
}
 
function updateSliderUI() {
    const track = document.getElementById("slider-track");
    const thumbMin = document.getElementById("thumb-min");
    const thumbMax = document.getElementById("thumb-max");
    const labelMin = document.getElementById("slider-label-min");
    const labelMax = document.getElementById("slider-label-max");
 
    if (!track) return;
 
    const minPct = (sliderMinIdx / TOTAL_STEPS) * 100;
    const maxPct = (sliderMaxIdx / TOTAL_STEPS) * 100;
 
    thumbMin.style.left = `${minPct}%`;
    thumbMax.style.left = `${maxPct}%`;
 
    document.getElementById("slider-range").style.left = `${minPct}%`;
    document.getElementById("slider-range").style.width = `${maxPct - minPct}%`;
 
    const minDecade = DECADES[sliderMinIdx];
    const maxDecade = DECADES[sliderMaxIdx];
 
    labelMin.textContent = `${minDecade}s`;
    labelMax.textContent = `${maxDecade}s`;
 
    yearMin = minDecade;
    yearMax = maxDecade;
}
 
function makeDraggable(thumbId, isMin) {
    const thumb = document.getElementById(thumbId);
    const track = document.getElementById("slider-track");
 
    let dragging = false;
 
    function startDrag(e) {
        dragging = true;
        e.preventDefault();
    }
 
    function onMove(e) {
        if (!dragging) return;
 
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const rect = track.getBoundingClientRect();
        let pct = (clientX - rect.left) / rect.width;
        pct = Math.max(0, Math.min(1, pct));
 
        let idx = Math.round(pct * TOTAL_STEPS);
 
        if (isMin) {
            idx = Math.min(idx, sliderMaxIdx);
            sliderMinIdx = Math.max(0, idx);
        } else {
            idx = Math.max(idx, sliderMinIdx);
            sliderMaxIdx = Math.min(TOTAL_STEPS, idx);
        }
 
        updateSliderUI();
    }
 
    function endDrag() {
        if (!dragging) return;
        dragging = false;
 
        // Re-filter and restart on drag end
        applyYearFilter();
        startGame();
    }
 
    thumb.addEventListener("mousedown", startDrag);
    thumb.addEventListener("touchstart", startDrag, { passive: false });
    document.addEventListener("mousemove", onMove);
    document.addEventListener("touchmove", onMove, { passive: false });
    document.addEventListener("mouseup", endDrag);
    document.addEventListener("touchend", endDrag);
}

// =====================
// GAME LOGIC
// =====================

function getRandomMovie() {
    return filteredMovies[Math.floor(Math.random() * filteredMovies.length)];
}

function getValidNextMovie(current) {
    let next;
    let attempts = 0;
 
    do {
        next = getRandomMovie();
        attempts++;
    }  while (
        attempts < 100 &&
        next.title === current.title
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
 
        const hs = getHighScore(currentMode);
        if (score > hs) {
            setHighScore(currentMode, score);
        }
 
        current = next;
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
 
function updateHighscoreDisplay() {
    document.getElementById("highscore").innerText =
        `Highscore: ${getHighScore(currentMode)}`;
}
 
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
 
    document.getElementById("score").innerText = `Score: ${score}`;
    updateHighscoreDisplay();
}

// =====================
// MOBILE BURGER
// =====================
 
function initBurger() {
    const hamburger = document.querySelector(".hamburger");
    const sidebar = document.getElementById("sidebar-left");
 
    if (!hamburger || !sidebar) return;
 
    hamburger.addEventListener("click", () => {
        sidebar.classList.toggle("mobile-open");
    });
 
    // Close sidebar when clicking outside
    document.addEventListener("click", (e) => {
        if (
            sidebar.classList.contains("mobile-open") &&
            !sidebar.contains(e.target) &&
            !hamburger.contains(e.target)
        ) {
            sidebar.classList.remove("mobile-open");
        }
    });
}

// =====================
// INIT
// =====================
 
document.addEventListener("DOMContentLoaded", () => {
    initSlider();
    makeDraggable("thumb-min", true);
    makeDraggable("thumb-max", false);
    initBurger();
 
    // Set first mode button active
    const firstBtn = document.querySelector("#sidebar-left .mode-buttons button");
    if (firstBtn) firstBtn.classList.add("active");
 
    loadData();
});