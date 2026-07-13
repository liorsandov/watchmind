import "server-only";

import { createSupabaseServerClient } from "@/lib/supabase/server";

export class AuthenticationRequiredError extends Error {
  constructor() {
    super("An authenticated user is required for this operation.");
    this.name = "AuthenticationRequiredError";
  }
}

export async function getAuthenticatedContext() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    throw new AuthenticationRequiredError();
  }

  return { supabase, userId: user.id };
}

export function throwIfDatabaseError(error: { message: string } | null) {
  if (error) {
    throw new Error(`Database operation failed: ${error.message}`);
  }
}
