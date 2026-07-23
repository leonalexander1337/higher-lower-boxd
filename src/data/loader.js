import { state } from "../core/state.js";
import { applyYearFilter } from "../decades/filter.js";
import { startGame } from "../game/game.js";

export async function loadData(mode = "movies") {
    try {
        const res = await fetch(`data/dist/${mode}.json`);
        state.movies = await res.json();
    } catch (e) {
        console.error("Mode load failed:", mode);
        return;
    }

    applyYearFilter();
    startGame();
}
