import "server-only";

import { getContentItems } from "@/lib/repositories/content-items";
import { listAllCurrentInteractions, listAllInteractionHistory } from "@/lib/repositories/interactions";
import { listAllRecommendationEvents, listAllRecommendationSessions } from "@/lib/repositories/recommendations";
import { listAllWatchProgress } from "@/lib/repositories/watch-progress";

export async function getCurrentLibrary() {
  const [interactions, interactionEvents, recommendationEvents, sessions, progress] = await Promise.all([
    listAllCurrentInteractions(),
    listAllInteractionHistory(),
    listAllRecommendationEvents(),
    listAllRecommendationSessions(),
    listAllWatchProgress(),
  ]);
  const content = await getContentItems([
    ...interactions.map((item) => item.content_id),
    ...interactionEvents.map((item) => item.content_id),
    ...recommendationEvents.map((item) => item.content_id),
    ...progress.map((item) => item.content_id),
  ]);
  return { content, interactions, interactionEvents, progress, recommendationEvents, sessions };
}
