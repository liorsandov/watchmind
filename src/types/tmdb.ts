export interface TmdbPaginatedResponse<T> {
  page: number;
  results: T[];
  total_pages: number;
  total_results: number;
}

export interface TmdbGenre {
  id: number;
  name: string;
}

export interface TmdbTitle {
  id: number;
  media_type?: "movie" | "tv" | "person";
  title?: string | null;
  name?: string | null;
  original_title?: string | null;
  original_name?: string | null;
  overview?: string | null;
  poster_path?: string | null;
  backdrop_path?: string | null;
  release_date?: string | null;
  first_air_date?: string | null;
  genre_ids?: number[];
  genres?: TmdbGenre[];
  original_language?: string | null;
  popularity?: number | null;
  vote_average?: number | null;
  vote_count?: number | null;
  runtime?: number | null;
  episode_run_time?: number[] | null;
}
