import { loadData } from "./data/loader.js";
import { initYearFilter } from "./decades/filter.js";
import { initModeButtons } from "./ui/modes.js";
import { initMobileMenu } from "./ui/menu.js";
import { initGameControls } from "./ui/controls.js";
import { initUpdatedDate } from "./ui/updated.js";

document.addEventListener("DOMContentLoaded", () => {
    initYearFilter();
    initModeButtons();
    initMobileMenu();
    initGameControls();
    initUpdatedDate();

    loadData();
});
