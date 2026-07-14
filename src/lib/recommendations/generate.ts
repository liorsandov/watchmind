import "server-only";

import {
  getContentItems,
  listRecommendationCandidateContentItems,
  upsertContentItem,
} from "@/lib/repositories/content-items";
import { listAllCurrentInteractions } from "@/lib/repositories/interactions";
import {
  createRecommendationSession,
  recordRecommendationEvent,
  updateRecommendationSession,
} from "@/lib/repositories/recommendations";
import { recalculateCurrentTasteProfile } from "@/lib/taste/recalculate";
import { getTmdbService } from "@/lib/tmdb/service";
import type {
  RecommendationInteractionItem,
  RecommendationResult,
  RecommendationSessionInput,
  RecommendationSourceItem,
} from "@/lib/recommendations/model";
import { generateRecommendations } from "@/lib/recommendations/scoring";
import type { TasteProfile } from "@/lib/taste/model";
import type { Json, Tables } from "@/types/database";
import type { ContentItem, MediaType } from "@/types/media";

interface CandidatePool {
  candidates: RecommendationSourceItem[];
  tmdbItems: Map<string, ContentItem>;
}

function candidateKey(item: Pick<RecommendationSourceItem, "mediaType" | "tmdbId">) {
  return `${item.mediaType}:${item.tmdbId}`;
}

function toJson(value: unknown): Json {
  return value as Json;
}

function rowToCandidate(
  row: Tables<"content_items">,
): RecommendationSourceItem {
  return {
    contentId: row.id,
    tmdbId: row.tmdb_id,
    mediaType: row.media_type,
    title: row.title,
    overview: row.overview,
    posterPath: row.poster_path,
    genreIds: row.genre_ids,
    releaseDate: row.release_date,
    originalLanguage: row.original_language,
    runtimeMinutes: row.runtime_minutes,
    popularity: row.popularity,
    voteAverage: row.vote_average,
    voteCount: row.vote_count,
  };
}

function tmdbToCandidate(item: ContentItem): RecommendationSourceItem {
  return {
    contentId: null,
    tmdbId: item.tmdbId,
    mediaType: item.mediaType,
    title: item.title,
    overview: item.overview,
    posterPath: item.posterPath,
    genreIds: item.genreIds,
    releaseDate: item.releaseDate,
    originalLanguage: item.originalLanguage,
    runtimeMinutes:
      item.mediaType === "movie"
        ? item.runtimeMinutes
        : item.episodeRuntimeMinutes,
    popularity: item.popularity,
    voteAverage: item.voteAverage,
    voteCount: item.voteCount,
  };
}

function interactionToSource(
  interaction: Tables<"user_content_interactions">,
  content: Tables<"content_items">,
): RecommendationInteractionItem {
  return {
    contentId: content.id,
    tmdbId: content.tmdb_id,
    mediaType: content.media_type,
    title: content.title,
    interactionType: interaction.interaction_type,
    genreIds: content.genre_ids,
    releaseDate: content.release_date,
    originalLanguage: content.original_language,
  };
}

function topPositiveGenreIds(profile: TasteProfile) {
  return profile.dimensions.genres
    .filter((signal) => signal.score > 0)
    .sort((a, b) => b.score - a.score || b.support - a.support)
    .slice(0, 5)
    .map((signal) => Number(signal.key))
    .filter(Number.isFinite);
}

function preferredMediaTypes(profile: TasteProfile): MediaType[] {
  const signaled = profile.dimensions.mediaTypes
    .filter((signal) => signal.score > 0)
    .sort((a, b) => b.score - a.score)
    .map((signal) => signal.key)
    .filter((key): key is MediaType => key === "movie" || key === "tv");
  return signaled.length > 0 ? signaled : ["movie", "tv"];
}

async function withDetails(items: readonly ContentItem[]) {
  const service = getTmdbService();
  const detailed = await Promise.all(
    items.slice(0, 30).map(async (item) => {
      try {
        return item.mediaType === "movie"
          ? await service.getMovieDetails(item.tmdbId)
          : await service.getTvDetails(item.tmdbId);
      } catch {
        return item;
      }
    }),
  );
  return detailed;
}

async function collectCandidatePool(
  profile: TasteProfile,
  input: RecommendationSessionInput,
): Promise<CandidatePool> {
  const service = getTmdbService();
  const localRows = await listRecommendationCandidateContentItems();
  const genres = input.genreId
    ? [input.genreId, ...topPositiveGenreIds(profile).filter((id) => id !== input.genreId)]
    : topPositiveGenreIds(profile);
  const mediaTypes = input.mediaType
    ? [input.mediaType]
    : preferredMediaTypes(profile);
  const discovered = await Promise.all(
    mediaTypes.flatMap((mediaType) => [
      service.discover({
        mediaType,
        genreIds: genres.slice(0, 3),
        page: 1,
      }),
      service.discover({ mediaType, page: 2 }),
    ]),
  );
  const popular = await Promise.all([
    service.getPopularMovies(1),
    service.getPopularTvShows(1),
    service.getTrendingMovies(),
    service.getTrendingTvShows(),
  ]);
  const tmdbItems = new Map<string, ContentItem>();

  for (const item of await withDetails([...discovered, ...popular].flat())) {
    tmdbItems.set(candidateKey(tmdbToCandidate(item)), item);
  }

  return {
    candidates: [
      ...localRows.map(rowToCandidate),
      ...[...tmdbItems.values()].map(tmdbToCandidate),
    ],
    tmdbItems,
  };
}

function resultSnapshot(results: readonly RecommendationResult[]) {
  return results.map((result) => ({
    item: result.item,
    category: result.category,
    confidence: result.confidence,
    score: result.score,
    reasons: result.reasons,
    signals: result.signals,
  }));
}

export async function generateCurrentRecommendations(
  input: RecommendationSessionInput = {},
  rejectedContentIds: readonly string[] = [],
) {
  const { profile } = await recalculateCurrentTasteProfile();
  const interactions = await listAllCurrentInteractions();
  const contentRows = await getContentItems(
    interactions.map((interaction) => interaction.content_id),
  );
  const contentById = new Map(contentRows.map((content) => [content.id, content]));
  const interactionItems = interactions.flatMap((interaction) => {
    const content = contentById.get(interaction.content_id);
    return content ? [interactionToSource(interaction, content)] : [];
  });
  const candidatePool = await collectCandidatePool(profile, input);
  const baseCandidates = candidatePool.candidates.filter((candidate) => {
    if (input.mediaType && candidate.mediaType !== input.mediaType) return false;
    if (input.genreId && !candidate.genreIds.includes(input.genreId)) return false;
    if (
      input.availableMinutes &&
      candidate.runtimeMinutes &&
      candidate.runtimeMinutes > input.availableMinutes
    ) return false;
    return true;
  });
  const moodGenres: Record<NonNullable<RecommendationSessionInput["mood"]>, number[]> = {
    light: [16, 35, 10751],
    tense: [27, 53, 80, 9648],
    thoughtful: [18, 36, 99],
    comfort: [35, 10749, 10751],
  };
  const contextualCandidates = baseCandidates.filter((candidate) => {
    if (input.mood && !candidate.genreIds.some((id) => moodGenres[input.mood!].includes(id))) return false;
    if (input.discovery === "familiar" && (candidate.voteCount ?? 0) < 500) return false;
    if (input.discovery === "adventurous" && (candidate.popularity ?? 0) > 60) return false;
    return true;
  });
  const candidates = contextualCandidates.length >= 6 ? contextualCandidates : baseCandidates;
  const output = generateRecommendations({
    tasteProfile: profile,
    interactions: interactionItems,
    candidates,
    rejectedContentIds,
  });
  const session = await createRecommendationSession({
    algorithm_version: output.algorithmVersion,
    input_snapshot: toJson({
      tasteProfileFingerprint: profile.sourceFingerprint,
      tasteProfileConfidence: profile.confidence,
      interactionCount: interactions.length,
      candidateCount: candidatePool.candidates.length,
      sessionInput: input,
      rejectedContentIds,
      excluded: output.excluded,
    }),
  });
  if (!session) throw new Error("The recommendation session could not be created.");

  try {
    const storedResults: RecommendationResult[] = [];
    for (const result of output.recommendations) {
      const source = candidatePool.tmdbItems.get(candidateKey(result.item));
      let content = result.item;
      if (!content.contentId && source) {
        const cached = await upsertContentItem(source);
        if (!cached) throw new Error("The recommended title could not be cached.");
        content = rowToCandidate(cached);
      }
      if (!content.contentId) continue;

      const storedResult = { ...result, item: content };
      storedResults.push(storedResult);
      await recordRecommendationEvent({
        recommendation_session_id: session.id,
        content_id: content.contentId,
        event_type: "impression",
        metadata: toJson({
          category: storedResult.category,
          confidence: storedResult.confidence,
          score: storedResult.score,
          reasons: storedResult.reasons,
          signals: storedResult.signals,
        }),
      });
    }

    const updatedSession = await updateRecommendationSession(session.id, {
      status: "ready",
      generated_at: new Date().toISOString(),
      result_snapshot: toJson({
        algorithmVersion: output.algorithmVersion,
        recommendations: resultSnapshot(storedResults),
        excluded: output.excluded,
      }),
    });

    return {
      session: updatedSession,
      recommendations: storedResults,
      excluded: output.excluded,
    };
  } catch (error) {
    await updateRecommendationSession(session.id, {
      status: "failed",
      result_snapshot: toJson({
        message:
          error instanceof Error
            ? error.message
            : "Recommendation generation failed.",
      }),
    });
    throw error;
  }
}
