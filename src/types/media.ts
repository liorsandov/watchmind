export type MediaType = "movie" | "tv";

export type Reaction =
  | "watched_liked"
  | "watched_disliked"
  | "watched_neutral"
  | "unwatched_interested"
  | "not_interested"
  | "skipped";

export interface TitleSummary {
  id: number;
  tmdbId: number;
  mediaType: MediaType;
  title: string;
  overview: string;
  posterPath: string | null;
  releaseDate: string | null;
  genreIds: number[];
}

export interface UserInteraction {
  id: string;
  userId: string;
  titleId: number;
  reaction: Reaction;
  createdAt: string;
  updatedAt: string;
}
