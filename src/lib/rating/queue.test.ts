import assert from "node:assert/strict";
import test from "node:test";
import { buildBalancedRatingQueue } from "./queue";
import type { ContentItem, MediaType } from "@/types/media";

function item(
  id: number,
  mediaType: MediaType,
  year: number,
  genreId: number,
): ContentItem {
  return {
    externalId: `${mediaType}:${id}`,
    tmdbId: id,
    mediaType,
    title: `Title ${id}`,
    originalTitle: null,
    overview: "Overview",
    posterPath: `/poster-${id}.jpg`,
    posterUrl: `https://image.tmdb.org/t/p/w500/poster-${id}.jpg`,
    backdropPath: null,
    backdropUrl: null,
    releaseDate: `${year}-01-01`,
    releaseYear: year,
    runtimeMinutes: null,
    episodeRuntimeMinutes: null,
    originalLanguage: "en",
    genreIds: [genreId],
    genres: [],
    popularity: 100 - id,
    voteAverage: 7,
    voteCount: 100,
  };
}

test("builds a mixed queue and removes duplicate and classified titles", () => {
  const candidates = Array.from({ length: 16 }, (_, index) => ({
    item: item(
      index + 1,
      index % 2 === 0 ? "movie" : "tv",
      index % 5 === 0 ? 1999 : 2024,
      (index % 4) + 1,
    ),
    source: index % 3 === 0 ? ("trending" as const) : ("popular" as const),
  }));
  candidates.push(candidates[0]!);

  const queue = buildBalancedRatingQueue({
    candidates,
    classifiedExternalIds: new Set(["movie:1"]),
    genres: [
      { id: 1, name: "Drama" },
      { id: 2, name: "Comedy" },
      { id: 3, name: "Crime" },
      { id: 4, name: "Science Fiction" },
    ],
    limit: 12,
  });

  assert.equal(queue.length, 12);
  assert.equal(new Set(queue.map((card) => card.item.externalId)).size, 12);
  assert.ok(queue.every((card) => card.item.externalId !== "movie:1"));
  assert.ok(queue.some((card) => card.item.mediaType === "movie"));
  assert.ok(queue.some((card) => card.item.mediaType === "tv"));
  assert.ok(queue.some((card) => card.source === "trending"));
  assert.ok(queue.some((card) => card.source === "popular"));
  assert.ok(queue.some((card) => (card.item.releaseYear ?? 9999) <= 2005));
  assert.ok(queue.some((card) => card.genres[0]?.name === "Comedy"));
});
