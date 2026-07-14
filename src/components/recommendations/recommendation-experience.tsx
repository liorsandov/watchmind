"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import { Ban, Check, Eye, Heart, LoaderCircle, RefreshCw, Search, Sparkles } from "lucide-react";
import {
  generateRecommendationsAction,
  recommendationAction,
  replaceRecommendationAction,
} from "@/app/(protected)/recommendations/actions";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import type { RecommendationResult, RecommendationSessionInput } from "@/lib/recommendations/model";
import { getTmdbImageUrl } from "@/lib/tmdb/images";

type DisplayedRecommendation = RecommendationResult & { sessionId: string };

const slots = ["Best Match", "Alternative", "Wildcard"] as const;
const selectClass = "h-9 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring";

export function RecommendationExperience({
  genres,
  informativeCount,
}: {
  genres: Array<{ id: number; name: string }>;
  informativeCount: number;
}) {
  const [input, setInput] = useState<RecommendationSessionInput>({});
  const [items, setItems] = useState<DisplayedRecommendation[]>([]);
  const [rejected, setRejected] = useState<string[]>([]);
  const [saved, setSaved] = useState<Record<string, string>>({});
  const [details, setDetails] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [hasGenerated, setHasGenerated] = useState(false);
  const [isPending, startTransition] = useTransition();

  function generate() {
    setError(null);
    startTransition(async () => {
      try {
        const result = await generateRecommendationsAction(input);
        setItems(result.recommendations.map((item) => ({ ...item, sessionId: result.session!.id })));
        setRejected([]);
        setHasGenerated(true);
      } catch {
        setError("Recommendations could not be generated. Check the TMDB connection and try again.");
      }
    });
  }

  function act(item: DisplayedRecommendation, action: "watchlist" | "not_interested" | "watched" | "opened" | "similar") {
    if (!item.item.contentId) return;
    setError(null);
    startTransition(async () => {
      try {
        await recommendationAction({ contentId: item.item.contentId!, sessionId: item.sessionId, action });
        if (action === "opened") setDetails((value) => value === item.item.contentId ? null : item.item.contentId);
        else if (action === "similar") await replace(item, input.genreId ?? item.item.genreIds[0]);
        else setSaved((value) => ({ ...value, [item.item.contentId!]: action }));
      } catch {
        setError("That action was not saved. Please try again.");
      }
    });
  }

  async function replace(item: DisplayedRecommendation, genreId = input.genreId) {
    if (!item.item.contentId) return;
    try {
      const nextInput = genreId ? { ...input, genreId } : input;
      const result = await replaceRecommendationAction({
        contentId: item.item.contentId,
        sessionId: item.sessionId,
        rejectedContentIds: rejected,
        sessionInput: nextInput,
      });
      const replacement = result.recommendations.find((candidate) =>
        candidate.item.contentId && !items.some((current) => current.item.contentId === candidate.item.contentId));
      setRejected((value) => [...new Set([...value, item.item.contentId!])]);
      if (replacement) {
        setItems((value) => value.map((current) => current === item
          ? { ...replacement, sessionId: result.session!.id }
          : current));
      } else {
        setError("No unused match is available for that slot. Try broader session choices.");
      }
    } catch {
      setError("A replacement could not be generated. The title was not marked as disliked.");
    }
  }

  return (
    <div className="space-y-8">
      <Card className="border-primary/20 bg-linear-to-br from-primary/10 via-card to-card">
        <CardHeader>
          <CardTitle className="text-xl">What fits right now?</CardTitle>
          <p className="text-sm text-muted-foreground">Everything is optional. Leave it blank for your strongest overall matches.</p>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <Choice label="Format" value={input.mediaType ?? ""} onChange={(value) => setInput({ ...input, mediaType: value ? value as "movie" | "tv" : undefined })} options={[["", "No preference"], ["movie", "Movie"], ["tv", "TV show"]]} />
          <Choice label="Available time" value={input.availableMinutes?.toString() ?? ""} onChange={(value) => setInput({ ...input, availableMinutes: value ? Number(value) : undefined })} options={[["", "Any length"], ["30", "About 30 min"], ["60", "Up to 1 hour"], ["120", "Up to 2 hours"], ["180", "Up to 3 hours"]]} />
          <Choice label="Mood" value={input.mood ?? ""} onChange={(value) => setInput({ ...input, mood: value ? value as RecommendationSessionInput["mood"] : undefined })} options={[["", "Any mood"], ["light", "Light"], ["tense", "Tense"], ["thoughtful", "Thoughtful"], ["comfort", "Comforting"]]} />
          <Choice label="Discovery" value={input.discovery ?? ""} onChange={(value) => setInput({ ...input, discovery: value ? value as RecommendationSessionInput["discovery"] : undefined })} options={[["", "Either"], ["familiar", "Familiar"], ["adventurous", "Adventurous"]]} />
          <Choice label="Genre" value={input.genreId?.toString() ?? ""} onChange={(value) => setInput({ ...input, genreId: value ? Number(value) : undefined })} options={[["", "Any genre"], ...genres.map((genre) => [String(genre.id), genre.name])]} />
          <div className="sm:col-span-2 lg:col-span-5">
            <Button className="w-full sm:w-auto" disabled={isPending} onClick={generate} size="lg">
              {isPending ? <LoaderCircle className="animate-spin motion-reduce:animate-none" /> : <Sparkles />} Get three recommendations
            </Button>
          </div>
        </CardContent>
      </Card>

      {informativeCount < 5 ? (
        <Alert><Sparkles /><AlertTitle>Your profile is still learning</AlertTitle><AlertDescription>These matches use broad quality signals. Rate a few more titles for more personal results.</AlertDescription></Alert>
      ) : null}
      {error ? <Alert variant="destructive"><AlertTitle>Something needs attention</AlertTitle><AlertDescription>{error}</AlertDescription></Alert> : null}

      {hasGenerated ? (
        <section aria-busy={isPending} aria-labelledby="recommendation-results" className="space-y-4">
          <h2 className="text-xl font-semibold" id="recommendation-results">Your three picks</h2>
          <div className="grid gap-5 lg:grid-cols-3">
            {slots.map((slot, index) => {
              const item = items[index];
              return item ? (
                <RecommendationCard
                  actionLabel={item.item.contentId ? saved[item.item.contentId] : undefined}
                  detailsOpen={details === item.item.contentId}
                  disabled={isPending}
                  genreNames={item.item.genreIds.map((id) => genres.find((genre) => genre.id === id)?.name).filter(Boolean) as string[]}
                  item={item}
                  key={`${slot}:${item.item.contentId}`}
                  onAction={(action) => act(item, action)}
                  onReplace={() => startTransition(() => replace(item))}
                  slot={slot}
                />
              ) : <EmptySlot key={slot} slot={slot} />;
            })}
          </div>
        </section>
      ) : (
        <div className="rounded-2xl border border-dashed p-10 text-center text-muted-foreground">
          <Search className="mx-auto mb-3 size-7" /><p className="font-medium text-foreground">Your shortlist will appear here</p><p className="mt-1 text-sm">One best match, one alternative, and one wildcard.</p>
        </div>
      )}
      <p className="sr-only" aria-live="polite">{isPending ? "Saving your request." : error ?? "Ready."}</p>
    </div>
  );
}

function Choice({ label, onChange, options, value }: { label: string; onChange: (value: string) => void; options: string[][]; value: string }) {
  const id = `recommendation-${label.toLowerCase().replaceAll(" ", "-")}`;
  return <div className="space-y-2"><Label htmlFor={id}>{label}</Label><select className={selectClass} id={id} onChange={(event) => onChange(event.target.value)} value={value}>{options.map(([optionValue, text]) => <option key={optionValue} value={optionValue}>{text}</option>)}</select></div>;
}

function RecommendationCard({ actionLabel, detailsOpen, disabled, genreNames, item, onAction, onReplace, slot }: {
  actionLabel?: string | undefined; detailsOpen: boolean; disabled: boolean; genreNames: string[]; item: DisplayedRecommendation;
  onAction: (action: "watchlist" | "not_interested" | "watched" | "opened" | "similar") => void; onReplace: () => void; slot: string;
}) {
  const poster = getTmdbImageUrl(item.item.posterPath, "w500");
  const year = item.item.releaseDate?.slice(0, 4);
  return <Card className="relative">
    <div className="relative aspect-2/3 bg-muted">{poster ? <Image alt={`Poster for ${item.item.title}`} className="object-cover" fill sizes="(max-width: 1024px) 100vw, 33vw" src={poster} /> : <div className="grid h-full place-items-center text-muted-foreground"><Eye className="size-10" /></div>}<Badge className="absolute left-3 top-3">{slot}</Badge></div>
    <CardHeader><div className="flex items-start justify-between gap-3"><CardTitle className="text-lg">{item.item.title}</CardTitle><Badge variant="outline">{item.confidence}</Badge></div><p className="text-xs text-muted-foreground">{[year, item.item.mediaType === "movie" ? "Movie" : "TV", item.item.runtimeMinutes ? `${item.item.runtimeMinutes} min` : null].filter(Boolean).join(" · ")}</p><div className="flex flex-wrap gap-1">{genreNames.slice(0, 3).map((genre) => <Badge key={genre} variant="secondary">{genre}</Badge>)}</div></CardHeader>
    <CardContent className="space-y-4"><p className="line-clamp-4 text-sm leading-6 text-muted-foreground">{item.item.overview || "Description unavailable."}</p><div className="rounded-lg bg-primary/8 p-3"><p className="text-xs font-semibold uppercase tracking-wide text-primary">Why this</p><p className="mt-1 text-sm">{item.reasons.slice(0, 2).join(" ")}</p></div>{detailsOpen ? <dl className="grid grid-cols-2 gap-2 rounded-lg border p-3 text-xs"><dt className="text-muted-foreground">TMDB ID</dt><dd className="text-right font-mono">{item.item.tmdbId}</dd><dt className="text-muted-foreground">Match score</dt><dd className="text-right font-mono">{item.score.toFixed(1)}</dd></dl> : null}<div className="grid grid-cols-2 gap-2"><Button disabled={disabled} onClick={() => onAction("watchlist")} variant="outline"><Heart /> Watchlist</Button><Button disabled={disabled} onClick={() => onAction("watched")} variant="outline"><Check /> Watched</Button><Button disabled={disabled} onClick={() => onAction("not_interested")} variant="ghost"><Ban /> Not interested</Button><Button disabled={disabled} onClick={() => onAction("similar")} variant="ghost"><Sparkles /> Similar</Button><Button disabled={disabled} onClick={onReplace} variant="ghost"><RefreshCw /> Replace</Button><Button disabled={disabled} onClick={() => onAction("opened")} variant="ghost"><Eye /> Details</Button></div>{actionLabel ? <p className="text-xs text-emerald-600" role="status">Saved: {actionLabel.replaceAll("_", " ")}</p> : null}</CardContent>
  </Card>;
}

function EmptySlot({ slot }: { slot: string }) { return <Card className="min-h-80 border-dashed"><CardContent className="grid flex-1 place-items-center text-center text-sm text-muted-foreground"><div><Search className="mx-auto mb-3" /><p className="font-medium text-foreground">No {slot.toLowerCase()} found</p><p className="mt-1">Broaden your choices and try again.</p></div></CardContent></Card>; }
