import { state } from "../core/state.js";
import { getHighScore, setHighScore } from "../highscore/highscore.js";
import { render, renderEmptyState } from "./render.js";

export function getRandomMovie() {
    return state.filteredMovies[Math.floor(Math.random() * state.filteredMovies.length)];
}

export function getValidNextMovie(current) {
    let next;
    let attempts = 0;

    do {
        next = getRandomMovie();
        attempts++;
    } while (
        attempts < 100 &&
        next.title === current.title
    );

    return next;
}

export function startGame() {
    state.score = 0;

    if (state.filteredMovies.length < 2) {
        renderEmptyState();
        return;
    }

    state.current = getRandomMovie();
    state.next = getValidNextMovie(state.current);
    render();
}

export function guess(choice) {
    const correct =
        (choice === "higher" && state.next.rating >= state.current.rating) ||
        (choice === "lower" && state.next.rating < state.current.rating);

    if (correct) {
        state.score++;

        const hs = getHighScore(state.currentMode);
        if (state.score > hs) {
            setHighScore(state.currentMode, state.score);
        }

        state.current = state.next;
        state.next = getValidNextMovie(state.current);
    } else {
        state.score = 0;
        state.current = getRandomMovie();
        state.next = getValidNextMovie(state.current);
    }

    render();
}
