import "server-only";

import {
  getAuthenticatedContext,
  throwIfDatabaseError,
} from "@/lib/repositories/context";
import type { TablesInsert } from "@/types/database";

export type SaveWatchProgressInput = Pick<
  TablesInsert<"user_watch_progress">,
  | "content_id"
  | "progress_percent"
  | "last_season_number"
  | "last_episode_number"
  | "completed"
  | "last_watched_at"
>;

export async function listWatchProgress(limit = 100) {
  const { supabase, userId } = await getAuthenticatedContext();
  const safeLimit = Math.min(Math.max(limit, 1), 500);
  const { data, error } = await supabase
    .from("user_watch_progress")
    .select("*")
    .eq("user_id", userId)
    .order("updated_at", { ascending: false })
    .limit(safeLimit);

  throwIfDatabaseError(error);
  return data ?? [];
}

export async function listAllWatchProgress() {
  const { supabase, userId } = await getAuthenticatedContext();
  const rows: Awaited<ReturnType<typeof listWatchProgress>> = [];
  for (let from = 0; ; from += 500) {
    const { data, error } = await supabase.from("user_watch_progress").select("*").eq("user_id", userId).order("updated_at", { ascending: false }).range(from, from + 499);
    throwIfDatabaseError(error); rows.push(...(data ?? [])); if (!data || data.length < 500) break;
  }
  return rows;
}

export async function saveWatchProgress(input: SaveWatchProgressInput) {
  const { supabase, userId } = await getAuthenticatedContext();
  const { data, error } = await supabase
    .from("user_watch_progress")
    .upsert(
      { ...input, user_id: userId },
      { onConflict: "user_id,content_id" },
    )
    .select("*")
    .single();

  throwIfDatabaseError(error);
  return data;
}

export async function deleteWatchProgress(contentId: string) {
  const { supabase, userId } = await getAuthenticatedContext();
  const { error } = await supabase
    .from("user_watch_progress")
    .delete()
    .eq("content_id", contentId)
    .eq("user_id", userId);
  throwIfDatabaseError(error);
}
