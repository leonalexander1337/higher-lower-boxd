import { state } from "../core/state.js";
import { DECADE_MIN, DECADE_MAX, DECADE_STEP } from "../core/config.js";
import { startGame } from "../game/game.js";

const DECADES = [];
for (let d = DECADE_MIN; d <= DECADE_MAX; d += DECADE_STEP) DECADES.push(d);
const TOTAL_STEPS = DECADES.length - 1;

let sliderMinIdx = 0;
let sliderMaxIdx = TOTAL_STEPS;

export function applyYearFilter() {
    state.filteredMovies = state.movies.filter(m => {
        const decade = Math.floor(m.year / 10) * 10;
        return decade >= state.yearMin && decade <= state.yearMax;
    });
}

export function initYearFilter() {
    const container = document.getElementById("year-slider-container");
    if (!container) return;

    updateSliderUI();
    makeDraggable("thumb-min", true);
    makeDraggable("thumb-max", false);
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

    state.yearMin = minDecade;
    state.yearMax = maxDecade;
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

        // Re-filter and restart the game with the new range
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
