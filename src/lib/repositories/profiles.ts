import "server-only";

import {
  getAuthenticatedContext,
  throwIfDatabaseError,
} from "@/lib/repositories/context";
import type { TablesUpdate } from "@/types/database";

type ProfileUpdate = Pick<
  TablesUpdate<"profiles">,
  "display_name" | "onboarding_step" | "onboarding_completed_at"
>;

export async function getCurrentProfile() {
  const { supabase, userId } = await getAuthenticatedContext();
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single();

  throwIfDatabaseError(error);
  return data;
}

export async function updateCurrentProfile(values: ProfileUpdate) {
  const { supabase, userId } = await getAuthenticatedContext();
  const { data, error } = await supabase
    .from("profiles")
    .update(values)
    .eq("id", userId)
    .select("*")
    .single();

  throwIfDatabaseError(error);
  return data;
}
