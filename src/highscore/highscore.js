import { state } from "../core/state.js";

export function getHighScore(mode) {
    return parseInt(localStorage.getItem(`highScore_${mode}`)) || 0;
}

export function setHighScore(mode, value) {
    localStorage.setItem(`highScore_${mode}`, value);
}

export function updateHighscoreDisplay() {
    document.getElementById("highscore").innerText =
        `Highscore: ${getHighScore(state.currentMode)}`;
}
