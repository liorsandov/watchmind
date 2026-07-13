import "server-only";

import {
  getAuthenticatedContext,
  throwIfDatabaseError,
} from "@/lib/repositories/context";
import type { TablesUpdate } from "@/types/database";

type PreferencesUpdate = Pick<
  TablesUpdate<"user_preferences">,
  | "preferred_media_types"
  | "preferred_languages"
  | "preferred_genre_ids"
  | "excluded_genre_ids"
  | "include_adult"
  | "minimum_release_year"
>;

export async function getCurrentPreferences() {
  const { supabase, userId } = await getAuthenticatedContext();
  const { data, error } = await supabase
    .from("user_preferences")
    .select("*")
    .eq("user_id", userId)
    .single();

  throwIfDatabaseError(error);
  return data;
}

export async function updateCurrentPreferences(values: PreferencesUpdate) {
  const { supabase, userId } = await getAuthenticatedContext();
  const { data, error } = await supabase
    .from("user_preferences")
    .update(values)
    .eq("user_id", userId)
    .select("*")
    .single();

  throwIfDatabaseError(error);
  return data;
}
