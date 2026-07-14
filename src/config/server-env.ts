import "server-only";

import { z } from "zod";

type TmdbAuth =
  | { type: "apiKey"; apiKey: string }
  | { type: "bearer"; token: string };

const nonEmptyString = z
  .string()
  .trim()
  .optional()
  .transform((value) => (value ? value : undefined));

const tmdbRawEnvSchema = z.object({
  TMDB_API_KEY: nonEmptyString,
  TMDB_API_TOKEN: nonEmptyString,
  TMDB_READ_ACCESS_TOKEN: nonEmptyString,
});

function looksLikeTmdbApiKey(value: string) {
  return /^[a-f0-9]{32}$/i.test(value);
}

const serverEnvSchema = tmdbRawEnvSchema
  .transform(({ TMDB_API_KEY, TMDB_API_TOKEN, TMDB_READ_ACCESS_TOKEN }, ctx) => {
    const legacyToken = TMDB_API_TOKEN;
    const legacyTokenIsApiKey =
      legacyToken !== undefined && looksLikeTmdbApiKey(legacyToken);
    const readAccessToken =
      TMDB_READ_ACCESS_TOKEN ??
      (!TMDB_API_KEY && legacyToken && !legacyTokenIsApiKey
        ? legacyToken
        : undefined);
    const apiKey =
      TMDB_API_KEY ??
      (!TMDB_READ_ACCESS_TOKEN && legacyTokenIsApiKey ? legacyToken : undefined);
    const tmdbAuth: TmdbAuth | undefined =
      readAccessToken
        ? { type: "bearer", token: readAccessToken }
        : apiKey
          ? { apiKey, type: "apiKey" }
          : undefined;

    if (!tmdbAuth) {
      ctx.addIssue({
        code: "custom",
        message:
          "Set TMDB_READ_ACCESS_TOKEN to the long TMDB read access token or TMDB_API_KEY to the short v3 API key.",
      });
      return z.NEVER;
    }

    return { tmdbAuth };
  });

export type ServerEnv = z.infer<typeof serverEnvSchema>;

let cachedServerEnv: ServerEnv | undefined;

export function parseServerEnv(
  env: Readonly<Record<string, string | undefined>>,
): ServerEnv {
  return serverEnvSchema.parse({
    TMDB_API_KEY: env.TMDB_API_KEY,
    TMDB_API_TOKEN: env.TMDB_API_TOKEN,
    TMDB_READ_ACCESS_TOKEN: env.TMDB_READ_ACCESS_TOKEN,
  });
}

export function getServerEnv(): ServerEnv {
  cachedServerEnv ??= parseServerEnv(process.env);
  return cachedServerEnv;
}
