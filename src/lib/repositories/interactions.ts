import "server-only";

import {
  getAuthenticatedContext,
  throwIfDatabaseError,
} from "@/lib/repositories/context";
import type { TablesInsert } from "@/types/database";
import type { ContentItem } from "@/types/media";
import { toContentItemInsert } from "@/lib/repositories/content-items";

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

export async function saveNewRatingInteraction(
  item: ContentItem,
  input: Pick<SaveInteractionInput, "interaction_type" | "source">,
) {
  const { supabase, userId } = await getAuthenticatedContext();
  const { data: content, error: contentError } = await supabase
    .from("content_items")
    .upsert(toContentItemInsert(item), { onConflict: "tmdb_id,media_type" })
    .select("id")
    .single();

  throwIfDatabaseError(contentError);
  if (!content) throw new Error("The title could not be cached.");

  const { data: existing, error: existingError } = await supabase
    .from("user_content_interactions")
    .select("id, interaction_type, source")
    .eq("user_id", userId)
    .eq("content_id", content.id)
    .maybeSingle();

  throwIfDatabaseError(existingError);
  if (existing) {
    if (
      existing.interaction_type !== input.interaction_type ||
      existing.source !== input.source
    ) {
      throw new Error("This title has already been classified.");
    }
    return { id: existing.id, alreadySaved: true };
  }

  const { data, error } = await supabase
    .from("user_content_interactions")
    .insert({
      content_id: content.id,
      interaction_type: input.interaction_type,
      source: input.source,
      user_id: userId,
    })
    .select("id")
    .single();

  throwIfDatabaseError(error);
  if (!data) throw new Error("The interaction could not be saved.");
  return { id: data.id, alreadySaved: false };
}

export async function undoRatingInteraction(interactionId: string) {
  const { supabase, userId } = await getAuthenticatedContext();
  const { data, error } = await supabase
    .from("user_content_interactions")
    .delete()
    .eq("id", interactionId)
    .eq("user_id", userId)
    .select("id")
    .maybeSingle();

  throwIfDatabaseError(error);
  if (!data) throw new Error("The interaction could not be undone.");
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
