import type { TasteProfile, TasteSignal } from "@/lib/taste/model";
import type { InteractionType, MediaType } from "@/types/database";

export const RECOMMENDATION_ALGORITHM_VERSION = "deterministic-recs-v1";

export type RecommendationCategory =
  | "Safe Match"
  | "Worth Exploring"
  | "Something Different";

export type RecommendationConfidence = "low" | "medium" | "high";

export interface RecommendationSourceItem {
  contentId: string | null;
  tmdbId: number;
  mediaType: MediaType;
  title: string;
  overview: string | null;
  posterPath?: string | null;
  genreIds: number[];
  releaseDate: string | null;
  originalLanguage: string | null;
  runtimeMinutes: number | null;
  popularity: number | null;
  voteAverage: number | null;
  voteCount: number | null;
}

export interface RecommendationInteractionItem {
  contentId: string;
  tmdbId: number;
  mediaType: MediaType;
  title: string;
  interactionType: InteractionType;
  genreIds: number[];
  releaseDate: string | null;
  originalLanguage: string | null;
}

export interface RecommendationSignalContribution {
  key: string;
  label: string;
  score: number;
  weight: number;
  value: string;
}

export interface RecommendationResult {
  item: RecommendationSourceItem;
  category: RecommendationCategory;
  confidence: RecommendationConfidence;
  score: number;
  reasons: string[];
  signals: RecommendationSignalContribution[];
}

export interface RecommendationEngineInput {
  tasteProfile: TasteProfile;
  interactions: readonly RecommendationInteractionItem[];
  candidates: readonly RecommendationSourceItem[];
  rejectedContentIds?: readonly string[];
  limit?: number;
}

export interface RecommendationEngineOutput {
  algorithmVersion: string;
  recommendations: RecommendationResult[];
  excluded: {
    watched: number;
    notInterested: number;
    rejectedInSession: number;
    duplicate: number;
    missingMetadata: number;
  };
}

export interface RecommendationSessionInput {
  mediaType?: MediaType | undefined;
  availableMinutes?: number | undefined;
  mood?: "light" | "tense" | "thoughtful" | "comfort" | undefined;
  discovery?: "familiar" | "adventurous" | undefined;
  genreId?: number | undefined;
}

export type SignalLookup = ReadonlyMap<string, TasteSignal>;
