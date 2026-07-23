import { guess } from "../game/game.js";

export function initGameControls() {
    document.getElementById("btn-higher").addEventListener("click", () => guess("higher"));
    document.getElementById("btn-lower").addEventListener("click", () => guess("lower"));
}
