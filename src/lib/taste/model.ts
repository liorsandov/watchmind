import type { InteractionType, MediaType } from "@/types/database";

export type TasteConfidence = "low" | "medium" | "high";
export type TasteSentiment = "positive" | "negative" | "neutral" | "unknown";

export interface TasteProfileSourceItem {
  interactionId: string;
  interactionType: InteractionType;
  rating: number | null;
  title: string;
  mediaType: MediaType;
  genreIds: number[];
  releaseDate: string | null;
  originalLanguage: string | null;
  runtimeMinutes: number | null;
  popularity: number | null;
}

export interface TasteSignal {
  key: string;
  label: string;
  score: number;
  support: number;
  confidence: TasteConfidence;
  sentiment: TasteSentiment;
}

export interface TasteTitleSignal {
  interactionId: string;
  title: string;
  interactionType: InteractionType;
}

export interface TasteProfile {
  algorithmVersion: string;
  sourceFingerprint: string;
  interactionCount: number;
  informativeInteractionCount: number;
  confidence: TasteConfidence;
  dimensions: {
    genres: TasteSignal[];
    mediaTypes: TasteSignal[];
    decades: TasteSignal[];
    languages: TasteSignal[];
    runtimeRanges: TasteSignal[];
    popularity: TasteSignal[];
  };
  strongSignals: {
    positive: TasteTitleSignal[];
    negative: TasteTitleSignal[];
  };
  explanations: string[];
}
