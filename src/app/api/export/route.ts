import { getCurrentLibrary } from "@/lib/library";
import { getCurrentPreferences } from "@/lib/repositories/preferences";
import { getCurrentProfile } from "@/lib/repositories/profiles";
import { getLatestTasteProfileSnapshot } from "@/lib/repositories/taste-profiles";

export async function GET() {
  const [profile, preferences, tasteProfile, library] = await Promise.all([
    getCurrentProfile(),
    getCurrentPreferences(),
    getLatestTasteProfileSnapshot(),
    getCurrentLibrary(),
  ]);
  const exportedAt = new Date().toISOString();
  const body = JSON.stringify({
    schemaVersion: 1,
    exportedAt,
    profile,
    preferences,
    tasteProfile,
    interactions: library.interactions,
    interactionHistory: library.interactionEvents,
    watchHistory: library.progress,
    watchlist: library.interactions.filter((item) => item.interaction_type === "interested"),
    recommendationHistory: { sessions: library.sessions, events: library.recommendationEvents },
    content: library.content,
  }, null, 2);
  return new Response(body, {
    headers: {
      "Cache-Control": "private, no-store",
      "Content-Disposition": `attachment; filename="watchmind-export-${exportedAt.slice(0, 10)}.json"`,
      "Content-Type": "application/json; charset=utf-8",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
