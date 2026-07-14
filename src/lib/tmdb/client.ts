import "server-only";

import { getServerEnv } from "@/config/server-env";
const TMDB_API_BASE_URL = "https://api.themoviedb.org/3";
const DEFAULT_REVALIDATE_SECONDS = 3600;
const REQUEST_TIMEOUT_MS = 10_000;

export class TmdbApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly retryable = status === 429 || status >= 500,
    options?: ErrorOptions,
  ) {
    super(message, options);
    this.name = "TmdbApiError";
  }
}

export interface TmdbRequestOptions {
  params?: Readonly<Record<string, string | number | boolean | undefined>>;
  revalidate?: number;
  tags?: readonly string[];
}

export class TmdbClient {
  async request(path: `/${string}`, options: TmdbRequestOptions = {}) {
    const url = new URL(`${TMDB_API_BASE_URL}${path}`);
    url.searchParams.set("language", "en-US");
    Object.entries(options.params ?? {}).forEach(([key, value]) => {
      if (value !== undefined) url.searchParams.set(key, String(value));
    });
    const tmdbAuth = getServerEnv().tmdbAuth;
    const headers: HeadersInit = { accept: "application/json" };
    if (tmdbAuth.type === "bearer") {
      headers.authorization = `Bearer ${tmdbAuth.token}`;
    } else {
      url.searchParams.set("api_key", tmdbAuth.apiKey);
    }

    let response: Response;
    try {
      response = await fetch(url, {
        cache: "force-cache",
        headers,
        next: {
          revalidate: options.revalidate ?? DEFAULT_REVALIDATE_SECONDS,
          tags: [...(options.tags ?? ["tmdb"])],
        },
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      });
    } catch (error) {
      throw new TmdbApiError(
        "TMDB could not be reached. Please try again.",
        503,
        true,
        { cause: error },
      );
    }

    if (!response.ok) {
      throw new TmdbApiError(
        response.status === 401
          ? "The TMDB API credential was rejected. Check that the read access token or API key is copied from the same TMDB app."
          : response.status === 404
            ? "The requested TMDB title was not found."
            : response.status === 429
              ? "TMDB is rate limiting requests. Please try again shortly."
              : "TMDB could not complete the request.",
        response.status,
      );
    }
    return (await response.json()) as unknown;
  }
}

let tmdbClient: TmdbClient | undefined;

export function getTmdbClient(): TmdbClient {
  tmdbClient ??= new TmdbClient();
  return tmdbClient;
}
