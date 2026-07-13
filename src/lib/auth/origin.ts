import "server-only";

import { headers } from "next/headers";

export async function getRequestOrigin() {
  const headerStore = await headers();
  const host = headerStore.get("x-forwarded-host") ?? headerStore.get("host");
  const protocol = headerStore.get("x-forwarded-proto") ?? "http";

  if (!host) {
    throw new Error("Unable to determine the application URL.");
  }

  return `${protocol}://${host}`;
}
