import { state } from "../core/state.js";
import { fetchPoster } from "../poster/poster.js";
import { updateHighscoreDisplay } from "../highscore/highscore.js";

export async function render() {
    const posterA = await fetchPoster(state.current.title, state.current.year);
    const posterB = await fetchPoster(state.next.title, state.next.year);

    document.getElementById("movieA").innerHTML = `
        <div class="card" style="background-image:url('${posterA || ""}');background-size:cover;">
            <h2>${state.current.title}</h2>
            <p>${state.current.year}</p>
            <p>⭐ ${state.current.rating}</p>
        </div>
    `;

    document.getElementById("movieB").innerHTML = `
        <div class="card" style="background-image:url('${posterB || ""}');background-size:cover;">
            <h2>${state.next.title}</h2>
            <p>${state.next.year}</p>
            <p>⭐ ?.?</p>
        </div>
    `;

    document.getElementById("score").innerText = `Score: ${state.score}`;
    updateHighscoreDisplay();
}

export function renderEmptyState() {
    document.getElementById("movieA").innerHTML = `
        <div class="card">
            <h2>No movies in this range</h2>
            <p>Widen the year filter to keep playing.</p>
        </div>
    `;
    document.getElementById("movieB").innerHTML = "";
    document.getElementById("score").innerText = `Score: ${state.score}`;
    updateHighscoreDisplay();
}
