import Link from "next/link";
import { Clock3, Download } from "lucide-react";
import { LibraryFilters } from "@/components/library/library-filters";
import { LibraryItemCard } from "@/components/library/library-item-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getCurrentLibrary } from "@/lib/library";
import type { Tables } from "@/types/database";

export const metadata = { title: "History · WatchMind" };
const views = [["ratings", "Ratings & interactions"], ["watched", "Watched"], ["recommendations", "Recommendations"], ["events", "Change history"]] as const;

export default async function HistoryPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const params = await searchParams;
  const view = views.some(([value]) => value === params.view) ? params.view! : "ratings";
  const library = await getCurrentLibrary();
  const byId = new Map(library.content.map((item) => [item.id, item]));
  const currentByContent = new Map(library.interactions.map((item) => [item.content_id, item]));
  let entries: Array<{ content: Tables<"content_items">; interaction?: Tables<"user_content_interactions"> | undefined; date: string; note?: string | undefined }>;
  if (view === "recommendations") entries = library.recommendationEvents.filter((event) => event.event_type === "impression").flatMap((event) => { const content = byId.get(event.content_id); const metadata = event.metadata as { reasons?: string[] }; return content ? [{ content, interaction: currentByContent.get(content.id), date: event.created_at, note: `Recommended ${new Date(event.created_at).toLocaleDateString()}. ${metadata.reasons?.join(" ") ?? "Reason unavailable."}` }] : []; });
  else if (view === "events") entries = library.interactionEvents.flatMap((event) => { const content = byId.get(event.content_id); return content ? [{ content, interaction: currentByContent.get(content.id), date: event.created_at, note: `${event.action} · ${event.interaction_type.replaceAll("_", " ")}${event.rating ? ` · ${event.rating}/10` : ""}` }] : []; });
  else entries = library.interactions.filter((item) => view !== "watched" || item.interaction_type.startsWith("watched_")).flatMap((interaction) => { const content = byId.get(interaction.content_id); return content ? [{ content, interaction, date: interaction.updated_at }] : []; });
  const genre = Number(params.genre) || null;
  entries = entries.filter(({ content, interaction }) => (!params.q || content.title.toLowerCase().includes(params.q.toLowerCase())) && (!params.media || content.media_type === params.media) && (!genre || content.genre_ids.includes(genre)) && (!params.interaction || (params.interaction === "watched" ? interaction?.interaction_type.startsWith("watched_") : interaction?.interaction_type === params.interaction)));
  entries.sort((a, b) => params.sort === "title" ? a.content.title.localeCompare(b.content.title) : params.sort === "rating" ? (b.interaction?.rating ?? 0) - (a.interaction?.rating ?? 0) : b.date.localeCompare(a.date));
  const page = Math.max(Number(params.page) || 1, 1), pageSize = 24, totalPages = Math.ceil(entries.length / pageSize);
  const pageItems = entries.slice((page - 1) * pageSize, page * pageSize);
  const genres = [...new Set(library.content.flatMap((item) => item.genre_ids))].sort((a, b) => a - b);
  return <div className="space-y-7"><header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div className="space-y-3"><Badge variant="secondary"><Clock3 /> Your activity</Badge><h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Library history</h1><p className="text-muted-foreground">Review, correct, and export the private signals WatchMind remembers.</p></div><Button asChild variant="outline"><a href="/api/export"><Download /> Export JSON</a></Button></header><nav aria-label="History views" className="flex gap-2 overflow-x-auto pb-1">{views.map(([value, label]) => <Button asChild key={value} variant={view === value ? "default" : "outline"}><Link href={`/history?view=${value}`}>{label}</Link></Button>)}</nav><LibraryFilters genres={genres} values={{ ...params, view }} />{pageItems.length ? <div className="grid gap-4 xl:grid-cols-2">{pageItems.map((entry, index) => <LibraryItemCard content={entry.content} interaction={entry.interaction} key={`${entry.content.id}:${entry.date}:${index}`} note={entry.note} />)}</div> : <div className="rounded-xl border border-dashed p-10 text-center text-sm text-muted-foreground">No history matches these filters.</div>}{totalPages > 1 ? <nav aria-label="History pages" className="flex items-center justify-between"><PageLink disabled={page <= 1} label="Previous" page={page - 1} params={params} /><span className="text-sm text-muted-foreground">Page {page} of {totalPages}</span><PageLink disabled={page >= totalPages} label="Next" page={page + 1} params={params} /></nav> : null}</div>;
}

function PageLink({ disabled, label, page, params }: { disabled: boolean; label: string; page: number; params: Record<string, string | undefined> }) { const href = `?${new URLSearchParams({ ...Object.fromEntries(Object.entries(params).filter(([, value]) => value)), page: String(page) })}`; return <Button asChild={!disabled} disabled={disabled} variant="outline">{disabled ? <span>{label}</span> : <Link href={href}>{label}</Link>}</Button>; }
