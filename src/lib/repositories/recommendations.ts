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
