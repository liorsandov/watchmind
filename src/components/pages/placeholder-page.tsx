import { ArrowUpRight, LockKeyhole } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface PlaceholderPageProps { eyebrow: string; title: string; description: string; }

export function PlaceholderPage({ eyebrow, title, description }: PlaceholderPageProps) {
  return (
    <section className="mx-auto flex max-w-4xl flex-col gap-8">
      <div className="space-y-4">
        <Badge className="border-primary/20 bg-primary/10 text-primary" variant="outline">
          {eyebrow}
        </Badge>
        <div className="space-y-3">
          <h1 className="max-w-3xl text-3xl font-semibold tracking-tight sm:text-4xl md:text-5xl">
            {title}
          </h1>
          <p className="max-w-2xl text-base leading-7 text-muted-foreground sm:text-lg">
            {description}
          </p>
        </div>
      </div>

      <Card className="overflow-hidden border-primary/15 bg-card/80 shadow-2xl shadow-black/15">
        <CardHeader className="border-b bg-muted/20 sm:px-7 sm:py-6">
          <div className="flex items-center justify-between gap-4">
            <div className="space-y-1.5">
              <CardTitle className="text-xl">Foundation ready</CardTitle>
              <CardDescription>
                This route is prepared for its focused product phase.
              </CardDescription>
            </div>
            <span className="grid size-10 shrink-0 place-items-center rounded-full bg-primary/10 text-primary">
              <ArrowUpRight aria-hidden="true" className="size-5" />
            </span>
          </div>
        </CardHeader>
        <CardContent className="flex items-start gap-3 px-6 py-5 text-sm text-muted-foreground sm:px-7">
          <LockKeyhole aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-primary" />
          <p className="leading-6">
            Supabase will remain the source of truth, with each account isolated
            by authentication and Row Level Security.
          </p>
        </CardContent>
      </Card>
    </section>
  );
}
