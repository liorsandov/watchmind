import "server-only";

import { z } from "zod";

const serverEnvSchema = z.object({
  TMDB_API_TOKEN: z.string().min(1),
});

export type ServerEnv = z.infer<typeof serverEnvSchema>;

let cachedServerEnv: ServerEnv | undefined;

export function getServerEnv(): ServerEnv {
  cachedServerEnv ??= serverEnvSchema.parse({
    TMDB_API_TOKEN: process.env.TMDB_API_TOKEN,
  });
  return cachedServerEnv;
}
