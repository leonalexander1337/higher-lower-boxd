import { DECADE_MIN, DECADE_MAX } from "./config.js";

export const state = {
    movies: [],
    filteredMovies: [],
    current: null,
    next: null,
    score: 0,
    currentMode: "movies",
    yearMin: DECADE_MIN,
    yearMax: DECADE_MAX
};
