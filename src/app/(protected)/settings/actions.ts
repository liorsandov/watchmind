"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { updateCurrentProfile } from "@/lib/repositories/profiles";

const displayNameSchema = z
  .string()
  .trim()
  .min(1, "Enter a display name.")
  .max(80, "Display name must be 80 characters or fewer.");

export async function updateProfileAction(formData: FormData) {
  const displayName = displayNameSchema.safeParse(formData.get("displayName"));

  if (!displayName.success) {
    redirect("/settings?error=display-name");
  }

  // The repository resolves and verifies the current user again for this write.
  await updateCurrentProfile({ display_name: displayName.data });
  redirect("/settings?saved=1");
}
