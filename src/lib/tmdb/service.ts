import "server-only";

import { TmdbApiError, getTmdbClient } from "@/lib/tmdb/client";
import {
  normalizeTmdbTitle,
  tmdbGenresSchema,
  tmdbPageSchema,
  tryNormalizeTmdbTitle,
} from "@/lib/tmdb/normalization";
import type { ContentGenre, ContentItem, MediaType } from "@/types/media";

const LIST_REVALIDATE_SECONDS = 1800;
const DETAILS_REVALIDATE_SECONDS = 21600;
const GENRES_REVALIDATE_SECONDS = 86400;

function parsePage(raw: unknown, mediaType: MediaType) {
  const page = tmdbPageSchema.safeParse(raw);
  if (!page.success) {
    throw new TmdbApiError("TMDB returned an unexpected response.", 502, true, {
      cause: page.error,
    });
  }

  return page.data.results
    .map((title) => tryNormalizeTmdbTitle(title, mediaType))
    .filter((title): title is ContentItem => title !== null);
}

export class TmdbService {
  private readonly client = getTmdbClient();

  async getTrendingMovies() {
    const raw = await this.client.request("/trending/movie/week", {
      revalidate: LIST_REVALIDATE_SECONDS,
      tags: ["tmdb", "tmdb-trending-movies"],
    });
    return parsePage(raw, "movie");
  }

  async getTrendingTvShows() {
    const raw = await this.client.request("/trending/tv/week", {
      revalidate: LIST_REVALIDATE_SECONDS,
      tags: ["tmdb", "tmdb-trending-tv"],
    });
    return parsePage(raw, "tv");
  }

  async getPopularMovies(page = 1) {
    const raw = await this.client.request("/movie/popular", {
      params: { page },
      revalidate: LIST_REVALIDATE_SECONDS,
      tags: ["tmdb", "tmdb-popular-movies"],
    });
    return parsePage(raw, "movie");
  }

  async getPopularTvShows(page = 1) {
    const raw = await this.client.request("/tv/popular", {
      params: { page },
      revalidate: LIST_REVALIDATE_SECONDS,
      tags: ["tmdb", "tmdb-popular-tv"],
    });
    return parsePage(raw, "tv");
  }

  async search(query: string, page = 1) {
    const normalizedQuery = query.trim().slice(0, 100);
    if (!normalizedQuery) return [];

    const raw = await this.client.request("/search/multi", {
      params: { include_adult: false, page, query: normalizedQuery },
      revalidate: 900,
      tags: ["tmdb", "tmdb-search"],
    });
    const response = tmdbPageSchema.safeParse(raw);
    if (!response.success) {
      throw new TmdbApiError("TMDB returned an unexpected response.", 502);
    }

    return response.data.results.flatMap((title) => {
      if (!title || typeof title !== "object" || !("media_type" in title)) {
        return [];
      }
      const mediaType = title.media_type;
      if (mediaType !== "movie" && mediaType !== "tv") return [];
      const normalized = tryNormalizeTmdbTitle(title, mediaType);
      return normalized ? [normalized] : [];
    });
  }

  async getMovieDetails(tmdbId: number) {
    const raw = await this.client.request(`/movie/${tmdbId}`, {
      revalidate: DETAILS_REVALIDATE_SECONDS,
      tags: ["tmdb", `tmdb-movie-${tmdbId}`],
    });
    return normalizeTmdbTitle(raw, "movie");
  }

  async getTvDetails(tmdbId: number) {
    const raw = await this.client.request(`/tv/${tmdbId}`, {
      revalidate: DETAILS_REVALIDATE_SECONDS,
      tags: ["tmdb", `tmdb-tv-${tmdbId}`],
    });
    return normalizeTmdbTitle(raw, "tv");
  }

  async getGenres(mediaType: MediaType): Promise<ContentGenre[]> {
    const raw = await this.client.request(`/genre/${mediaType}/list`, {
      revalidate: GENRES_REVALIDATE_SECONDS,
      tags: ["tmdb", `tmdb-genres-${mediaType}`],
    });
    const parsed = tmdbGenresSchema.safeParse(raw);
    if (!parsed.success) {
      throw new TmdbApiError("TMDB returned unexpected genre data.", 502);
    }
    return parsed.data.genres;
  }
}

let tmdbService: TmdbService | undefined;

export function getTmdbService() {
  tmdbService ??= new TmdbService();
  return tmdbService;
}
