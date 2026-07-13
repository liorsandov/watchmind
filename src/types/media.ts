export type MediaType = "movie" | "tv";

export type Reaction =
  | "watched_liked"
  | "watched_disliked"
  | "watched_neutral"
  | "interested"
  | "not_interested"
  | "skipped";

export interface TitleSummary {
  id: string;
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
  titleId: string;
  reaction: Reaction;
  createdAt: string;
  updatedAt: string;
}
