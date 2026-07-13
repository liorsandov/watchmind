import "server-only";

import {
  getAuthenticatedContext,
  throwIfDatabaseError,
} from "@/lib/repositories/context";

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
