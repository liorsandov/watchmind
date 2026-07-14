import {
  ArrowDown,
  ArrowUp,
  BrainCircuit,
  CircleHelp,
  Gauge,
  LockKeyhole,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { TasteProfile, TasteSignal } from "@/lib/taste/model";
import { recalculateCurrentTasteProfile } from "@/lib/taste/recalculate";
import { cn } from "@/lib/utils";

export const metadata = {
  title: "Your taste so far · WatchMind",
  description: "Understand the private preference signals behind your recommendations.",
};

interface TastePageProps {
  searchParams: Promise<{ debug?: string }>;
}

const confidenceCopy = {
  low: "Early read",
  medium: "Useful picture",
  high: "Strong picture",
} as const;

const dimensionCopy: Array<{
  key: keyof TasteProfile["dimensions"];
  title: string;
  description: string;
}> = [
  { key: "genres", title: "Genres", description: "Stories and themes you respond to" },
  { key: "mediaTypes", title: "Movies or TV", description: "Your format preference" },
  { key: "decades", title: "Release eras", description: "The decades that resonate" },
  { key: "languages", title: "Languages", description: "Original-language patterns" },
  { key: "runtimeRanges", title: "Runtime", description: "Your preferred viewing length" },
  { key: "popularity", title: "Popularity", description: "Mainstream and hidden-gem signals" },
];

export default async function TastePage({ searchParams }: TastePageProps) {
  const [{ profile, snapshot }, params] = await Promise.all([
    recalculateCurrentTasteProfile(),
    searchParams,
  ]);
  const debugEnabled = process.env.TASTE_PROFILE_DEBUG === "true" && params.debug === "1";

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <header className="space-y-5">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="secondary">
            <BrainCircuit aria-hidden="true" /> Deterministic profile
          </Badge>
          <Badge variant="outline">
            <LockKeyhole aria-hidden="true" /> Private
          </Badge>
        </div>
        <div className="space-y-3">
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            Your taste so far
          </h1>
          <p className="max-w-3xl text-base leading-7 text-muted-foreground">
            A transparent summary built only from your saved reactions. It gets
            more dependable as you classify more titles.
          </p>
        </div>
      </header>

      <section className="grid gap-4 lg:grid-cols-[minmax(0,1.4fr)_minmax(18rem,0.6fr)]">
        <Card className="border-primary/20 bg-gradient-to-br from-primary/10 via-card to-card">
          <CardHeader>
            <CardDescription>What WatchMind understands</CardDescription>
            <CardTitle className="text-2xl">A {profile.confidence}-confidence profile</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3" aria-label="Taste profile explanations">
              {profile.explanations.map((explanation) => (
                <li className="flex gap-3 text-sm leading-6" key={explanation}>
                  <span className="mt-2 size-1.5 shrink-0 rounded-full bg-primary" />
                  {explanation}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between gap-4">
              <div className="space-y-1.5">
                <CardDescription>Profile confidence</CardDescription>
                <CardTitle>{confidenceCopy[profile.confidence]}</CardTitle>
              </div>
              <span className="grid size-11 place-items-center rounded-full bg-primary/10 text-primary">
                <Gauge aria-hidden="true" className="size-5" />
              </span>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="h-2 overflow-hidden rounded-full bg-muted">
              <div
                className={cn(
                  "h-full rounded-full bg-primary",
                  profile.confidence === "low" && "w-1/3",
                  profile.confidence === "medium" && "w-2/3",
                  profile.confidence === "high" && "w-full",
                )}
              />
            </div>
            <p className="text-sm leading-6 text-muted-foreground">
              Based on {profile.informativeInteractionCount} informative reaction
              {profile.informativeInteractionCount === 1 ? "" : "s"}. Skips and
              unsure answers do not steer your profile.
            </p>
          </CardContent>
        </Card>
      </section>

      <section aria-labelledby="signals-heading" className="space-y-4">
        <div>
          <h2 className="text-xl font-semibold" id="signals-heading">Preference signals</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Only patterns with enough evidence are presented as likes or dislikes.
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {dimensionCopy.map(({ description, key, title }) => (
            <SignalCard
              description={description}
              key={key}
              signals={profile.dimensions[key]}
              title={title}
            />
          ))}
        </div>
      </section>

      {(profile.strongSignals.positive.length > 0 || profile.strongSignals.negative.length > 0) ? (
        <section className="grid gap-4 md:grid-cols-2" aria-label="Strong title signals">
          <TitleSignals positive titles={profile.strongSignals.positive.map((signal) => signal.title)} />
          <TitleSignals titles={profile.strongSignals.negative.map((signal) => signal.title)} />
        </section>
      ) : null}

      <p className="text-xs leading-5 text-muted-foreground">
        Snapshot {snapshot.source_fingerprint.slice(-8)} · Algorithm {profile.algorithmVersion}.
        Raw reactions remain the source of truth and this snapshot can be rebuilt at any time.
      </p>

      {debugEnabled ? (
        <Card className="border-dashed">
          <CardHeader>
            <CardTitle>Debug values</CardTitle>
            <CardDescription>
              Visible only when server debug mode and the debug query are both enabled.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <pre className="max-h-96 overflow-auto rounded-lg bg-muted p-4 font-mono text-xs">
              {JSON.stringify(profile, null, 2)}
            </pre>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}

function SignalCard({ description, signals, title }: {
  description: string;
  signals: TasteSignal[];
  title: string;
}) {
  const visible = signals
    .filter((signal) => signal.sentiment === "positive" || signal.sentiment === "negative")
    .slice(0, 3);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        {visible.length > 0 ? (
          <ul className="space-y-2">
            {visible.map((signal) => {
              const positive = signal.sentiment === "positive";
              const Icon = positive ? ArrowUp : ArrowDown;
              return (
                <li className="flex items-center justify-between gap-3 text-sm" key={signal.key}>
                  <span className="truncate">{signal.label}</span>
                  <Badge variant={positive ? "default" : "outline"}>
                    <Icon aria-hidden="true" /> {positive ? "Like" : "Not for you"}
                  </Badge>
                </li>
              );
            })}
          </ul>
        ) : (
          <div className="flex items-start gap-2 text-sm leading-6 text-muted-foreground">
            <CircleHelp aria-hidden="true" className="mt-1 size-4 shrink-0" />
            <p>Not enough evidence for a reliable pattern yet.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function TitleSignals({ positive = false, titles }: { positive?: boolean; titles: string[] }) {
  const Icon = positive ? ArrowUp : ArrowDown;
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Icon aria-hidden="true" className="size-4" />
          Strong {positive ? "positive" : "negative"} signals
        </CardTitle>
        <CardDescription>
          Titles you explicitly watched and {positive ? "liked" : "disliked"}.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {titles.length > 0 ? (
          <ul className="space-y-2 text-sm">
            {titles.slice(0, 5).map((title, index) => (
              <li className="truncate" key={`${title}-${index}`}>{title}</li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted-foreground">No strong signals yet.</p>
        )}
      </CardContent>
    </Card>
  );
}
