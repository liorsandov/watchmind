import Link from "next/link";
import { BrainCircuit, Heart, History, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getCurrentLibrary } from "@/lib/library";
import { getCurrentProfile } from "@/lib/repositories/profiles";
import { recalculateCurrentTasteProfile } from "@/lib/taste/recalculate";

export const metadata = { title: "Welcome back · WatchMind" };

export default async function DiscoverPage() {
  const [library, currentProfile, taste] = await Promise.all([
    getCurrentLibrary(),
    getCurrentProfile(),
    recalculateCurrentTasteProfile(),
  ]);
  const saved = library.interactions.filter((item) => item.interaction_type === "interested").length;
  const rated = library.interactions.filter((item) => item.interaction_type.startsWith("watched_")).length;
  const displayName = currentProfile?.display_name?.split(" ")[0];
  return <div className="mx-auto max-w-6xl space-y-8"><header className="space-y-5"><Badge variant="secondary">Private home</Badge><div><h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Welcome back{displayName ? `, ${displayName}` : ""}</h1><p className="mt-2 max-w-2xl leading-7 text-muted-foreground">Your progress is exactly where you left it. Continue shaping your profile or get a fresh shortlist.</p></div><div className="flex flex-wrap gap-3"><Button asChild size="lg"><Link href="/recommendations"><Sparkles /> Get updated recommendations</Link></Button><Button asChild size="lg" variant="outline"><Link href="/rate">Continue rating</Link></Button></div></header><section aria-label="Account summary" className="grid gap-4 sm:grid-cols-3"><Metric icon={Heart} label="Saved titles" value={saved} /><Metric icon={History} label="Rated titles" value={rated} /><Metric icon={BrainCircuit} label="Taste confidence" value={taste.profile.confidence} /></section><Card><CardHeader><CardTitle>Your next useful step</CardTitle></CardHeader><CardContent className="grid gap-3 sm:grid-cols-3"><NextStep href="/rate" label="Rate titles" text="Add clearer preference signals." /><NextStep href="/taste" label="View your taste" text="See what WatchMind has learned." /><NextStep href="/recommendations" label="Get recommendations" text="Turn those signals into three picks." /></CardContent></Card><p className="text-xs text-muted-foreground">Onboarding progress: step {currentProfile?.onboarding_step ?? 0}. It is never reset when you return.</p></div>;
}

function Metric({ icon: Icon, label, value }: { icon: typeof Heart; label: string; value: number | string }) { return <Card><CardContent className="flex items-center gap-4"><span className="grid size-11 place-items-center rounded-full bg-primary/10 text-primary"><Icon /></span><div><p className="text-2xl font-semibold capitalize">{value}</p><p className="text-sm text-muted-foreground">{label}</p></div></CardContent></Card>; }
function NextStep({ href, label, text }: { href: string; label: string; text: string }) { return <Link className="rounded-xl border p-4 transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" href={href}><p className="font-medium">{label}</p><p className="mt-1 text-sm text-muted-foreground">{text}</p></Link>; }
