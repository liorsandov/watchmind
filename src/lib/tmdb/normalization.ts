import { z } from "zod";
import { getContentImageUrls } from "@/lib/tmdb/images";
import type { ContentItem, MediaType } from "@/types/media";

const genreSchema = z.object({
  id: z.number().int().positive(),
  name: z.string().trim().min(1),
});

export const tmdbTitleSchema = z
  .object({
    id: z.number().int().positive(),
    media_type: z.enum(["movie", "tv", "person"]).optional(),
    title: z.string().nullable().optional(),
    name: z.string().nullable().optional(),
    original_title: z.string().nullable().optional(),
    original_name: z.string().nullable().optional(),
    overview: z.string().nullable().optional(),
    poster_path: z.string().nullable().optional(),
    backdrop_path: z.string().nullable().optional(),
    release_date: z.string().nullable().optional(),
    first_air_date: z.string().nullable().optional(),
    genre_ids: z.array(z.number().int().positive()).optional(),
    genres: z.array(genreSchema).optional(),
    original_language: z.string().nullable().optional(),
    popularity: z.number().nonnegative().nullable().optional(),
    vote_average: z.number().min(0).max(10).nullable().optional(),
    vote_count: z.number().int().nonnegative().nullable().optional(),
    runtime: z.number().int().positive().nullable().optional(),
    episode_run_time: z.array(z.number().int().positive()).nullable().optional(),
  })
  .passthrough();

export const tmdbPageSchema = z
  .object({
    page: z.number().int().positive(),
    results: z.array(z.unknown()),
    total_pages: z.number().int().nonnegative(),
    total_results: z.number().int().nonnegative(),
  })
  .passthrough();

export const tmdbGenresSchema = z
  .object({ genres: z.array(genreSchema) })
  .passthrough();

function cleanText(value: string | null | undefined) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

function releaseYear(value: string | null) {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const year = Number(value.slice(0, 4));
  return year >= 1870 && year <= 2200 ? year : null;
}

export function normalizeTmdbTitle(
  input: unknown,
  mediaType: MediaType,
): ContentItem {
  const title = tmdbTitleSchema.parse(input);
  const displayTitle = cleanText(mediaType === "movie" ? title.title : title.name);
  const originalTitle = cleanText(
    mediaType === "movie" ? title.original_title : title.original_name,
  );
  const releaseDate = cleanText(
    mediaType === "movie" ? title.release_date : title.first_air_date,
  );
  const posterPath = cleanText(title.poster_path);
  const backdropPath = cleanText(title.backdrop_path);
  const genres = title.genres ?? [];
  const genreIds = title.genre_ids ?? genres.map((genre) => genre.id);
  const { posterUrl, backdropUrl } = getContentImageUrls(
    posterPath,
    backdropPath,
  );

  return {
    externalId: `${mediaType}:${title.id}`,
    tmdbId: title.id,
    mediaType,
    title: displayTitle ?? originalTitle ?? "Untitled",
    originalTitle,
    overview: cleanText(title.overview),
    posterPath,
    posterUrl,
    backdropPath,
    backdropUrl,
    releaseDate,
    releaseYear: releaseYear(releaseDate),
    runtimeMinutes: mediaType === "movie" ? (title.runtime ?? null) : null,
    episodeRuntimeMinutes:
      mediaType === "tv" ? (title.episode_run_time?.[0] ?? null) : null,
    originalLanguage: cleanText(title.original_language),
    genreIds,
    genres,
    popularity: title.popularity ?? null,
    voteAverage: title.vote_average ?? null,
    voteCount: title.vote_count ?? null,
  };
}

export function tryNormalizeTmdbTitle(
  input: unknown,
  mediaType: MediaType,
) {
  const parsed = tmdbTitleSchema.safeParse(input);
  return parsed.success ? normalizeTmdbTitle(parsed.data, mediaType) : null;
}
