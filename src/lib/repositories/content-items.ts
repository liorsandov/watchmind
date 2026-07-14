import "server-only";

import {
  getAuthenticatedContext,
  throwIfDatabaseError,
} from "@/lib/repositories/context";
import type { ContentItem } from "@/types/media";
import type { TablesInsert } from "@/types/database";

export async function listRecommendationCandidateContentItems(limit = 250) {
  const { supabase } = await getAuthenticatedContext();
  const safeLimit = Math.min(Math.max(limit, 1), 500);
  const { data, error } = await supabase
    .from("content_items")
    .select("*")
    .not("overview", "is", null)
    .not("release_date", "is", null)
    .not("original_language", "is", null)
    .not("vote_average", "is", null)
    .order("popularity", { ascending: false, nullsFirst: false })
    .limit(safeLimit);

  throwIfDatabaseError(error);
  return data ?? [];
}

export async function getContentItems(contentIds: readonly string[]) {
  if (contentIds.length === 0) return [];

  const { supabase } = await getAuthenticatedContext();
  const uniqueIds = [...new Set(contentIds)];
  const chunks = Array.from(
    { length: Math.ceil(uniqueIds.length / 200) },
    (_, index) => uniqueIds.slice(index * 200, (index + 1) * 200),
  );
  const results = await Promise.all(
    chunks.map((ids) =>
      supabase.from("content_items").select("*").in("id", ids),
    ),
  );

  for (const result of results) throwIfDatabaseError(result.error);
  return results.flatMap((result) => result.data ?? []);
}

export async function getContentItemByExternalIdentity(
  tmdbId: number,
  mediaType: ContentItem["mediaType"],
) {
  const { supabase } = await getAuthenticatedContext();
  const { data, error } = await supabase
    .from("content_items")
    .select("*")
    .eq("tmdb_id", tmdbId)
    .eq("media_type", mediaType)
    .maybeSingle();

  throwIfDatabaseError(error);
  return data;
}

export async function upsertContentItem(item: ContentItem) {
  const { supabase } = await getAuthenticatedContext();
  const input = toContentItemInsert(item);
  const { data, error } = await supabase.rpc("upsert_content_item", {
    p_backdrop_path: input.backdrop_path ?? null,
    p_genre_ids: input.genre_ids ?? [],
    p_media_type: input.media_type,
    p_original_language: input.original_language ?? null,
    p_original_title: input.original_title ?? null,
    p_overview: input.overview ?? null,
    p_popularity: input.popularity ?? null,
    p_poster_path: input.poster_path ?? null,
    p_release_date: input.release_date ?? null,
    p_runtime_minutes: input.runtime_minutes ?? null,
    p_title: input.title,
    p_tmdb_id: input.tmdb_id,
    p_vote_average: input.vote_average ?? null,
    p_vote_count: input.vote_count ?? null,
  });

  throwIfDatabaseError(error);
  return data;
}

/**
 * Maps a TMDB title into the deliberately small database cache shape. This
 * mapper does not write: future interaction/recommendation transactions are
 * the only workflows allowed to persist these rows.
 */
export function toContentItemInsert(
  item: ContentItem,
): TablesInsert<"content_items"> {
  return {
    backdrop_path: item.backdropPath,
    genre_ids: item.genreIds,
    media_type: item.mediaType,
    original_language: item.originalLanguage,
    original_title: item.originalTitle,
    overview: item.overview,
    popularity: item.popularity,
    poster_path: item.posterPath,
    release_date: item.releaseDate,
    runtime_minutes:
      item.mediaType === "movie"
        ? item.runtimeMinutes
        : item.episodeRuntimeMinutes,
    title: item.title,
    tmdb_id: item.tmdbId,
    vote_average: item.voteAverage,
    vote_count: item.voteCount,
  };
}
