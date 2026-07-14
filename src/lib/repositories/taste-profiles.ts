import "server-only";

import {
  getAuthenticatedContext,
  throwIfDatabaseError,
} from "@/lib/repositories/context";
import type { TasteProfile } from "@/lib/taste/model";
import type { Json } from "@/types/database";

export async function getLatestTasteProfileSnapshot() {
  const { supabase, userId } = await getAuthenticatedContext();
  const { data, error } = await supabase
    .from("taste_profile_snapshots")
    .select("*")
    .eq("user_id", userId)
    .order("calculated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  throwIfDatabaseError(error);
  return data;
}

/**
 * Persists an immutable derived snapshot. A repeated recalculation with the
 * same source fingerprint returns the existing row instead of creating or
 * updating data, making persistence idempotent.
 */
export async function saveTasteProfileSnapshot(profile: TasteProfile) {
  const { supabase, userId } = await getAuthenticatedContext();
  const { data: existing, error: existingError } = await supabase
    .from("taste_profile_snapshots")
    .select("*")
    .eq("user_id", userId)
    .eq("source_fingerprint", profile.sourceFingerprint)
    .maybeSingle();

  throwIfDatabaseError(existingError);
  if (existing) return existing;

  const { data, error } = await supabase
    .from("taste_profile_snapshots")
    .upsert(
      {
        algorithm_version: profile.algorithmVersion,
        confidence: profile.confidence,
        profile_snapshot: profile as unknown as Json,
        source_fingerprint: profile.sourceFingerprint,
        source_interaction_count: profile.interactionCount,
        user_id: userId,
      },
      {
        ignoreDuplicates: true,
        onConflict: "user_id,source_fingerprint",
      },
    )
    .select("*")
    .maybeSingle();

  throwIfDatabaseError(error);
  if (data) return data;

  // A concurrent recalculation may have inserted the same immutable snapshot.
  const { data: concurrent, error: concurrentError } = await supabase
    .from("taste_profile_snapshots")
    .select("*")
    .eq("user_id", userId)
    .eq("source_fingerprint", profile.sourceFingerprint)
    .single();
  throwIfDatabaseError(concurrentError);
  if (!concurrent) throw new Error("The taste profile snapshot could not be saved.");
  return concurrent;
}
