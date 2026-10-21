# 🎬 Higher Lower Boxd

Guess which movie has the higher IMDb rating, across all movies or by genre and decade.

**▶ Play:** https://leonalexander1337.github.io/higher-lower-boxd/

---

## 🚀 Run locally

```bash
npx serve
```

Then open the URL it prints (stop with `CTRL + C`).

## 📦 Data

Movie data comes from the **IMDb Non-Commercial Datasets**. Only personal, non-commercial use is allowed.

- Download: https://datasets.imdbws.com/
- Docs: https://developer.imdb.com/non-commercial-datasets/

Refresh everything in one go (download, preprocess, build):

```bash
node data/scripts/update.js
```

| Step | Script | Output |
|---|---|---|
| Download + unzip | `download.js` | `data/raw/*.tsv` |
| Filter (≥ 10k votes) | `preprocess.js` | `data/processed/*.tsv` |
| Build game data + posters | `build.js` | `data/dist/*.json` |

> Close the `.tsv` files in your editor first, otherwise Windows can't replace them.

## 🖼️ Posters

Posters come from the [TMDB API](https://developer.themoviedb.org/docs/faq). They're resolved at build time, so the key never reaches the browser.

```bash
cp .env.example .env   # then add your TMDB key
```

Results are cached in `data/cache/posters.json`, so only new movies hit the API.

## 🗂️ Structure

```
data/
  scripts/    download, preprocess, build, update
  raw/        IMDb dumps          (gitignored)
  processed/  filtered TSVs       (gitignored)
  cache/      TMDB poster cache
  dist/       JSON used by the game
src/
  core/       config, state
  data/       loader
  decades/    year filter
  game/       game logic, render
  highscore/  highscore
  poster/     TMDB posters
  ui/         modes, menu, controls, updated date
  main.js     entry point
```
