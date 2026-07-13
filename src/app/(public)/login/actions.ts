"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { getRequestOrigin } from "@/lib/auth/origin";
import { getSafeNextPath } from "@/lib/auth/redirect";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const emailSchema = z.email("Enter a valid email address.");

export interface MagicLinkState {
  error?: string;
  success?: string;
}

export async function signInWithGoogle(formData: FormData) {
  const supabase = await createSupabaseServerClient();
  const origin = await getRequestOrigin();
  const next = getSafeNextPath(formData.get("next")?.toString());
  const callback = new URL("/auth/callback", origin);
  callback.searchParams.set("next", next);

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo: callback.toString() },
  });

  if (error || !data.url) {
    redirect("/login?error=google");
  }

  redirect(data.url);
}

export async function sendMagicLink(
  _previousState: MagicLinkState,
  formData: FormData,
): Promise<MagicLinkState> {
  const parsedEmail = emailSchema.safeParse(formData.get("email"));

  if (!parsedEmail.success) {
    return {
      error:
        parsedEmail.error.issues[0]?.message ?? "Enter a valid email address.",
    };
  }

  const supabase = await createSupabaseServerClient();
  const origin = await getRequestOrigin();
  const next = getSafeNextPath(formData.get("next")?.toString());
  const callback = new URL("/auth/callback", origin);
  callback.searchParams.set("next", next);

  const { error } = await supabase.auth.signInWithOtp({
    email: parsedEmail.data,
    options: {
      emailRedirectTo: callback.toString(),
      shouldCreateUser: true,
    },
  });

  if (error) {
    return {
      error:
        error.status === 429
          ? "Please wait a moment before requesting another link."
          : "We could not send the sign-in link. Please try again.",
    };
  }

  return {
    success: `Check ${parsedEmail.data} for your private sign-in link.`,
  };
}
