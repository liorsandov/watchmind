import "server-only";

import { getServerEnv } from "@/config/server-env";
import type { TmdbPaginatedResponse, TmdbTitle } from "@/types/tmdb";

const TMDB_API_BASE_URL = "https://api.themoviedb.org/3";

export class TmdbApiError extends Error {
  constructor(message: string, public readonly status: number) {
    super(message);
    this.name = "TmdbApiError";
  }
}

export interface TmdbRequestOptions {
  params?: Readonly<Record<string, string | number | boolean | undefined>>;
  revalidate?: number;
}

export class TmdbClient {
  async request<T>(path: `/${string}`, options: TmdbRequestOptions = {}): Promise<T> {
    const url = new URL(`${TMDB_API_BASE_URL}${path}`);
    Object.entries(options.params ?? {}).forEach(([key, value]) => {
      if (value !== undefined) url.searchParams.set(key, String(value));
    });

    const response = await fetch(url, {
      headers: {
        accept: "application/json",
        authorization: `Bearer ${getServerEnv().TMDB_API_TOKEN}`,
      },
      next: { revalidate: options.revalidate ?? 3600 },
    });

    if (!response.ok) {
      throw new TmdbApiError("TMDB request failed.", response.status);
    }
    return (await response.json()) as T;
  }

  getTrendingTitles() {
    return this.request<TmdbPaginatedResponse<TmdbTitle>>("/trending/all/week", {
      revalidate: 1800,
    });
  }
}

let tmdbClient: TmdbClient | undefined;

export function getTmdbClient(): TmdbClient {
  tmdbClient ??= new TmdbClient();
  return tmdbClient;
}
