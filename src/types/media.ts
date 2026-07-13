import type {
  InteractionType,
  MediaType,
} from "@/types/database";

export type { MediaType } from "@/types/database";

export type Reaction = InteractionType;

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
