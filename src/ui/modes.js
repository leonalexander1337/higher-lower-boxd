import { state } from "../core/state.js";
import { loadData } from "../data/loader.js";
import { updateHighscoreDisplay } from "../highscore/highscore.js";

function setMode(mode, el) {
    state.currentMode = mode;
    state.score = 0;

    document.querySelectorAll("#sidebar-left .mode-buttons button").forEach(b =>
        b.classList.remove("active")
    );

    if (el) el.classList.add("active");

    loadData(mode);
    updateHighscoreDisplay();
}

export function initModeButtons() {
    const buttons = document.querySelectorAll("#sidebar-left .mode-buttons button");

    buttons.forEach(btn => {
        btn.addEventListener("click", () => setMode(btn.dataset.mode, btn));
    });

    if (buttons.length > 0) buttons[0].classList.add("active");
}
