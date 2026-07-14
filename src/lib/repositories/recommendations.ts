import "server-only";

import {
  getAuthenticatedContext,
  throwIfDatabaseError,
} from "@/lib/repositories/context";
import type { TablesInsert, TablesUpdate } from "@/types/database";

export type CreateRecommendationSessionInput = Pick<
  TablesInsert<"recommendation_sessions">,
  "algorithm_version" | "input_snapshot"
>;

export type UpdateRecommendationSessionInput = Pick<
  TablesUpdate<"recommendation_sessions">,
  "status" | "result_snapshot" | "generated_at"
>;

export type RecordRecommendationEventInput = Pick<
  TablesInsert<"recommendation_events">,
  | "recommendation_session_id"
  | "content_id"
  | "event_type"
  | "metadata"
>;

export async function createRecommendationSession(
  input: CreateRecommendationSessionInput,
) {
  const { supabase, userId } = await getAuthenticatedContext();
  const { data, error } = await supabase
    .from("recommendation_sessions")
    .insert({ ...input, user_id: userId })
    .select("*")
    .single();

  throwIfDatabaseError(error);
  return data;
}

export async function updateRecommendationSession(
  sessionId: string,
  input: UpdateRecommendationSessionInput,
) {
  const { supabase, userId } = await getAuthenticatedContext();
  const { data, error } = await supabase
    .from("recommendation_sessions")
    .update(input)
    .eq("id", sessionId)
    .eq("user_id", userId)
    .select("*")
    .single();

  throwIfDatabaseError(error);
  return data;
}

export async function recordRecommendationEvent(
  input: RecordRecommendationEventInput,
) {
  const { supabase, userId } = await getAuthenticatedContext();
  const { data, error } = await supabase
    .from("recommendation_events")
    .insert({ ...input, user_id: userId })
    .select("*")
    .single();

  throwIfDatabaseError(error);
  return data;
}

export async function listRecommendationSessions(limit = 100) {
  const { supabase, userId } = await getAuthenticatedContext();
  const { data, error } = await supabase
    .from("recommendation_sessions")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(Math.min(Math.max(limit, 1), 500));
  throwIfDatabaseError(error);
  return data ?? [];
}

export async function listRecommendationEvents(limit = 500) {
  const { supabase, userId } = await getAuthenticatedContext();
  const { data, error } = await supabase
    .from("recommendation_events")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(Math.min(Math.max(limit, 1), 1000));
  throwIfDatabaseError(error);
  return data ?? [];
}

export async function listAllRecommendationSessions() {
  const { supabase, userId } = await getAuthenticatedContext();
  const rows: Awaited<ReturnType<typeof listRecommendationSessions>> = [];
  for (let from = 0; ; from += 500) {
    const { data, error } = await supabase.from("recommendation_sessions").select("*").eq("user_id", userId).order("created_at", { ascending: false }).range(from, from + 499);
    throwIfDatabaseError(error); rows.push(...(data ?? [])); if (!data || data.length < 500) break;
  }
  return rows;
}

export async function listAllRecommendationEvents() {
  const { supabase, userId } = await getAuthenticatedContext();
  const rows: Awaited<ReturnType<typeof listRecommendationEvents>> = [];
  for (let from = 0; ; from += 500) {
    const { data, error } = await supabase.from("recommendation_events").select("*").eq("user_id", userId).order("created_at", { ascending: false }).range(from, from + 499);
    throwIfDatabaseError(error); rows.push(...(data ?? [])); if (!data || data.length < 500) break;
  }
  return rows;
}
