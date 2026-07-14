import assert from "node:assert/strict";
import test from "node:test";

import { parseServerEnv } from "@/config/server-env";

test("prefers the explicit TMDB read access token", () => {
  const env = parseServerEnv({
    TMDB_API_KEY: "a3c18bd9707692f9b88b953a4c56fff3",
    TMDB_READ_ACCESS_TOKEN: "header.payload.signature",
  });

  assert.deepEqual(env.tmdbAuth, {
    token: "header.payload.signature",
    type: "bearer",
  });
});

test("supports the short TMDB v3 API key", () => {
  const env = parseServerEnv({
    TMDB_API_KEY: "a3c18bd9707692f9b88b953a4c56fff3",
  });

  assert.deepEqual(env.tmdbAuth, {
    apiKey: "a3c18bd9707692f9b88b953a4c56fff3",
    type: "apiKey",
  });
});

test("keeps TMDB_API_TOKEN as a backward-compatible alias", () => {
  assert.deepEqual(
    parseServerEnv({
      TMDB_API_TOKEN: "header.payload.signature",
    }).tmdbAuth,
    {
      token: "header.payload.signature",
      type: "bearer",
    },
  );
  assert.deepEqual(
    parseServerEnv({
      TMDB_API_TOKEN: "a3c18bd9707692f9b88b953a4c56fff3",
    }).tmdbAuth,
    {
      apiKey: "a3c18bd9707692f9b88b953a4c56fff3",
      type: "apiKey",
    },
  );
});
