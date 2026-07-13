import type {
  InteractionType,
  MediaType,
} from "@/types/database";

export type { MediaType } from "@/types/database";

export type Reaction = InteractionType;

export interface ContentGenre {
  id: number;
  name: string;
}

export interface ContentItem {
  externalId: `${MediaType}:${number}`;
  tmdbId: number;
  mediaType: MediaType;
  title: string;
  originalTitle: string | null;
  overview: string | null;
  posterPath: string | null;
  posterUrl: string | null;
  backdropPath: string | null;
  backdropUrl: string | null;
  releaseDate: string | null;
  releaseYear: number | null;
  runtimeMinutes: number | null;
  episodeRuntimeMinutes: number | null;
  originalLanguage: string | null;
  genreIds: number[];
  genres: ContentGenre[];
  popularity: number | null;
  voteAverage: number | null;
  voteCount: number | null;
}

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
