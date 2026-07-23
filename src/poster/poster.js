import { API_KEY } from "../core/config.js";

const posterCache = {};

export async function fetchPoster(title, year) {
    const key = `${title}_${year}`;

    if (posterCache[key]) return posterCache[key];

    try {
        const res = await fetch(
            `https://api.themoviedb.org/3/search/movie?api_key=${API_KEY}&query=${encodeURIComponent(title)}&year=${year}`
        );

        const data = await res.json();

        if (data.results && data.results.length > 0) {
            const posterPath = data.results[0].poster_path;

            if (posterPath) {
                const url = `https://image.tmdb.org/t/p/w500${posterPath}`;
                posterCache[key] = url;
                return url;
            }
        }
    } catch (e) {
        console.error("Poster fetch error:", e);
    }

    posterCache[key] = null;
    return null;
}
