import "server-only";

import {
  getAuthenticatedContext,
  throwIfDatabaseError,
} from "@/lib/repositories/context";
import type { TablesInsert } from "@/types/database";

export type SaveInteractionInput = Pick<
  TablesInsert<"user_content_interactions">,
  "content_id" | "interaction_type" | "rating" | "source"
>;

export async function listCurrentInteractions(limit = 100) {
  const { supabase, userId } = await getAuthenticatedContext();
  const safeLimit = Math.min(Math.max(limit, 1), 500);
  const { data, error } = await supabase
    .from("user_content_interactions")
    .select("*")
    .eq("user_id", userId)
    .order("updated_at", { ascending: false })
    .limit(safeLimit);

  throwIfDatabaseError(error);
  return data ?? [];
}

export async function saveInteraction(input: SaveInteractionInput) {
  const { supabase, userId } = await getAuthenticatedContext();
  const { data, error } = await supabase
    .from("user_content_interactions")
    .upsert(
      { ...input, user_id: userId },
      { onConflict: "user_id,content_id" },
    )
    .select("*")
    .single();

  throwIfDatabaseError(error);
  return data;
}

export async function listInteractionHistory(contentId?: string) {
  const { supabase, userId } = await getAuthenticatedContext();
  let query = supabase
    .from("user_content_interaction_events")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(500);

  if (contentId) query = query.eq("content_id", contentId);

  const { data, error } = await query;
  throwIfDatabaseError(error);
  return data ?? [];
}
