import "server-only";

import {
  getAuthenticatedContext,
  throwIfDatabaseError,
} from "@/lib/repositories/context";
import type { ContentItem } from "@/types/media";
import type { TablesInsert } from "@/types/database";

export async function getContentItems(contentIds: readonly string[]) {
  if (contentIds.length === 0) return [];

  const { supabase } = await getAuthenticatedContext();
  const { data, error } = await supabase
    .from("content_items")
    .select("*")
    .in("id", [...contentIds]);

  throwIfDatabaseError(error);
  return data ?? [];
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
    title: item.title,
    tmdb_id: item.tmdbId,
    vote_average: item.voteAverage,
    vote_count: item.voteCount,
  };
}
