import assert from "node:assert/strict";
import test from "node:test";
import {
  normalizeTmdbTitle,
  tryNormalizeTmdbTitle,
} from "@/lib/tmdb/normalization";

test("normalizes movie and TV details into one content model", () => {
  const movie = normalizeTmdbTitle(
    {
      genre_ids: [18],
      id: 550,
      original_language: "en",
      poster_path: "/poster.jpg",
      release_date: "1999-10-15",
      runtime: 139,
      title: "Fight Club",
      vote_average: 8.4,
    },
    "movie",
  );
  const tv = normalizeTmdbTitle(
    {
      episode_run_time: [60],
      first_air_date: "2011-04-17",
      genres: [{ id: 18, name: "Drama" }],
      id: 1399,
      name: "Game of Thrones",
    },
    "tv",
  );

  assert.equal(movie.externalId, "movie:550");
  assert.equal(movie.releaseYear, 1999);
  assert.equal(movie.runtimeMinutes, 139);
  assert.match(movie.posterUrl ?? "", /^https:\/\/image\.tmdb\.org/);
  assert.equal(tv.externalId, "tv:1399");
  assert.equal(tv.episodeRuntimeMinutes, 60);
});

test("uses safe fallbacks for missing and invalid metadata", () => {
  const missing = normalizeTmdbTitle({ id: 999 }, "movie");

  assert.equal(missing.title, "Untitled");
  assert.equal(missing.posterUrl, null);
  assert.equal(missing.releaseYear, null);
  assert.equal(tryNormalizeTmdbTitle({ id: -1 }, "movie"), null);
});
