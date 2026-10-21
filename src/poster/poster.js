import { POSTER_BASE_URL } from "../core/config.js";

// Poster paths are resolved at build time (see data/scripts/build.js),
// so no TMDB API call is needed in the browser
export function posterUrl(movie) {
    return movie.poster ? `${POSTER_BASE_URL}${movie.poster}` : "";
}
