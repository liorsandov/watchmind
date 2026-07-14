"use client";

import {
  Ban,
  ChevronDown,
  ChevronUp,
  CircleHelp,
  Eye,
  EyeOff,
  Heart,
  ImageOff,
  LoaderCircle,
  Meh,
  RotateCcw,
  Sparkles,
  ThumbsDown,
  ThumbsUp,
} from "lucide-react";
import Image from "next/image";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  useTransition,
  type PointerEvent as ReactPointerEvent,
} from "react";
import {
  saveRatingAction,
  undoRatingAction,
} from "@/app/(protected)/rate/actions";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { RatingQueueCard } from "@/lib/rating/queue";
import type { InteractionType } from "@/types/database";

interface RatingFlowProps {
  initialClassifiedCount: number;
  queue: RatingQueueCard[];
}

interface ActionDefinition {
  interactionType: InteractionType;
  label: string;
  shortLabel: string;
  key: string;
  icon: typeof Heart;
  className: string;
}

const actions: ActionDefinition[] = [
  {
    interactionType: "watched_liked",
    label: "Watched and liked",
    shortLabel: "Liked",
    key: "L",
    icon: ThumbsUp,
    className: "border-emerald-500/35 hover:bg-emerald-500/10 hover:text-emerald-600 dark:hover:text-emerald-300",
  },
  {
    interactionType: "watched_neutral",
    label: "Watched and neutral",
    shortLabel: "Neutral",
    key: "N",
    icon: Meh,
    className: "hover:bg-sky-500/10 hover:text-sky-600 dark:hover:text-sky-300",
  },
  {
    interactionType: "watched_disliked",
    label: "Watched and disliked",
    shortLabel: "Disliked",
    key: "D",
    icon: ThumbsDown,
    className: "border-orange-500/35 hover:bg-orange-500/10 hover:text-orange-600 dark:hover:text-orange-300",
  },
  {
    interactionType: "interested",
    label: "Not watched, but interested",
    shortLabel: "Interested",
    key: "I",
    icon: Heart,
    className: "border-primary/40 hover:bg-primary/10 hover:text-primary",
  },
  {
    interactionType: "not_interested",
    label: "Not interested",
    shortLabel: "Not for me",
    key: "X",
    icon: Ban,
    className: "hover:bg-destructive/10 hover:text-destructive",
  },
  {
    interactionType: "skipped",
    label: "Haven’t watched",
    shortLabel: "Haven’t watched",
    key: "S",
    icon: EyeOff,
    className: "hover:bg-muted",
  },
  {
    interactionType: "unsure",
    label: "Unsure about this title",
    shortLabel: "Unsure",
    key: "?",
    icon: CircleHelp,
    className: "hover:bg-muted",
  },
];

const actionByType = new Map(actions.map((action) => [action.interactionType, action]));

export function RatingFlow({ initialClassifiedCount, queue }: RatingFlowProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [isUndoing, setIsUndoing] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [announcement, setAnnouncement] = useState("");
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [drag, setDrag] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStart = useRef<{ x: number; y: number; pointerId: number } | null>(null);
  const [lastAction, setLastAction] = useState<{
    cardIndex: number;
    interactionId: string;
    label: string;
  } | null>(null);
  const currentCard = queue[currentIndex];
  const completed = currentIndex;
  const isBusy = isPending || isSaving || isUndoing;

  useEffect(() => {
    for (const card of queue.slice(currentIndex + 1, currentIndex + 4)) {
      const url = card.item.posterUrl ?? card.item.backdropUrl;
      if (url) {
        const image = new window.Image();
        image.src = url;
      }
    }
  }, [currentIndex, queue]);

  const classify = useCallback(
    (interactionType: InteractionType) => {
      if (!currentCard || isBusy) return;

      const definition = actionByType.get(interactionType);
      if (!definition) return;
      const card = currentCard;
      const cardIndex = currentIndex;
      setIsSaving(true);
      setError(null);
      setAnnouncement(`Saving ${definition.label} for ${card.item.title}.`);

      startTransition(async () => {
        try {
          const result = await saveRatingAction({
            interactionType,
            mediaType: card.item.mediaType,
            source: card.source,
            tmdbId: card.item.tmdbId,
          });

          if (!result.ok) {
            setError(result.message);
            setAnnouncement(result.message);
            setDrag({ x: 0, y: 0 });
            return;
          }

          setLastAction({
            cardIndex,
            interactionId: result.interactionId,
            label: definition.label,
          });
          setAnnouncement(`${definition.label} saved for ${card.item.title}.`);
          setCurrentIndex((index) => index + 1);
          setDetailsOpen(false);
          setDrag({ x: 0, y: 0 });
        } catch {
          const message = "We couldn’t save that answer. Nothing changed—please try again.";
          setError(message);
          setAnnouncement(message);
          setDrag({ x: 0, y: 0 });
        } finally {
          setIsSaving(false);
        }
      });
    },
    [currentCard, currentIndex, isBusy, startTransition],
  );

  const undo = useCallback(() => {
    if (!lastAction || isBusy) return;
    const actionToUndo = lastAction;
    setIsUndoing(true);
    setError(null);
    startTransition(async () => {
      try {
        const result = await undoRatingAction(actionToUndo.interactionId);
        if (!result.ok) {
          setError(result.message);
          setAnnouncement(result.message);
          return;
        }

        setCurrentIndex(actionToUndo.cardIndex);
        setAnnouncement(`${actionToUndo.label} was undone.`);
        setLastAction(null);
        setDetailsOpen(false);
      } catch {
        const message = "We couldn’t undo that answer. Your saved rating is unchanged.";
        setError(message);
        setAnnouncement(message);
      } finally {
        setIsUndoing(false);
      }
    });
  }, [isBusy, lastAction, startTransition]);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      if (event.key.toLowerCase() === "u") {
        event.preventDefault();
        void undo();
        return;
      }
      const definition = actions.find(
        (action) => action.key.toLowerCase() === event.key.toLowerCase(),
      );
      if (definition) {
        event.preventDefault();
        void classify(definition.interactionType);
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [classify, undo]);

  function onPointerDown(event: ReactPointerEvent<HTMLDivElement>) {
    if (event.pointerType === "mouse" || isBusy) return;
    dragStart.current = {
      x: event.clientX,
      y: event.clientY,
      pointerId: event.pointerId,
    };
    setIsDragging(true);
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function onPointerMove(event: ReactPointerEvent<HTMLDivElement>) {
    if (!dragStart.current || dragStart.current.pointerId !== event.pointerId) return;
    setDrag({
      x: event.clientX - dragStart.current.x,
      y: event.clientY - dragStart.current.y,
    });
  }

  function onPointerEnd(event: ReactPointerEvent<HTMLDivElement>) {
    if (!dragStart.current || dragStart.current.pointerId !== event.pointerId) return;
    dragStart.current = null;
    setIsDragging(false);
    const horizontal = Math.abs(drag.x) >= Math.abs(drag.y);
    const distance = horizontal ? Math.abs(drag.x) : Math.abs(drag.y);
    if (distance < 72) {
      setDrag({ x: 0, y: 0 });
      return;
    }
    const interactionType: InteractionType = horizontal
      ? drag.x > 0
        ? "watched_liked"
        : "not_interested"
      : drag.y < 0
        ? "interested"
        : "skipped";
    void classify(interactionType);
  }

  if (!currentCard) {
    return (
      <EmptyQueue
        completed={completed}
        initialClassifiedCount={initialClassifiedCount}
        undoing={isUndoing}
        {...(lastAction ? { onUndo: undo } : {})}
      />
    );
  }

  const swipeAction =
    Math.abs(drag.x) > Math.abs(drag.y)
      ? drag.x > 30
        ? "LIKED"
        : drag.x < -30
          ? "NOT FOR ME"
          : null
      : drag.y < -30
        ? "INTERESTED"
        : drag.y > 30
          ? "HAVEN’T WATCHED"
          : null;
  const progress = queue.length === 0 ? 0 : (completed / queue.length) * 100;

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex items-center gap-4" aria-label={`${completed} of ${queue.length} titles rated this session`}>
        <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-primary transition-[width] duration-300 motion-reduce:transition-none"
            style={{ width: `${progress}%` }}
          />
        </div>
        <span className="font-mono text-xs text-muted-foreground">
          {completed}/{queue.length}
        </span>
      </div>

      {error ? (
        <Alert variant="destructive">
          <AlertTitle>Answer not saved</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <div
          aria-busy={isBusy}
          aria-label={`Rating card for ${currentCard.item.title}`}
          className="relative touch-none overflow-hidden rounded-3xl border bg-card shadow-2xl shadow-black/10 select-none"
          onPointerCancel={onPointerEnd}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerEnd}
          style={{
            transform: `translate3d(${drag.x * 0.35}px, ${drag.y * 0.25}px, 0) rotate(${drag.x * 0.012}deg)`,
            transition: isDragging ? "none" : "transform 220ms ease",
          }}
        >
          <div className="relative min-h-[32rem] sm:min-h-[36rem]">
            {currentCard.item.backdropUrl ?? currentCard.item.posterUrl ? (
              <Image
                alt=""
                className="object-cover"
                fill
                priority
                sizes="(max-width: 1024px) 100vw, 720px"
                src={currentCard.item.backdropUrl ?? currentCard.item.posterUrl ?? ""}
              />
            ) : (
              <div className="absolute inset-0 grid place-items-center bg-linear-to-br from-muted to-background text-muted-foreground">
                <ImageOff aria-hidden="true" className="size-12" />
              </div>
            )}
            <div className="absolute inset-0 bg-linear-to-t from-black via-black/55 to-black/10" />

            {swipeAction ? (
              <div className="absolute inset-0 z-10 grid place-items-center bg-black/20" aria-hidden="true">
                <span className="rotate-[-5deg] rounded-xl border-4 border-white px-5 py-3 text-3xl font-black tracking-wider text-white shadow-lg">
                  {swipeAction}
                </span>
              </div>
            ) : null}

            <div className="absolute inset-x-0 bottom-0 z-20 space-y-4 p-5 text-white sm:p-8">
              <div className="flex flex-wrap gap-2">
                <Badge className="bg-white/15 text-white backdrop-blur" variant="outline">
                  {currentCard.item.mediaType === "tv" ? "TV show" : "Movie"}
                </Badge>
                <Badge className="bg-white/15 text-white backdrop-blur" variant="outline">
                  {currentCard.item.releaseYear ?? "Year unknown"}
                </Badge>
                <Badge className="bg-white/15 text-white capitalize backdrop-blur" variant="outline">
                  {currentCard.source}
                </Badge>
              </div>
              <div>
                <h1 className="text-3xl font-semibold tracking-tight text-balance sm:text-5xl">
                  {currentCard.item.title}
                </h1>
                <p className={cn("mt-3 max-w-2xl text-sm leading-6 text-white/80 sm:text-base", !detailsOpen && "line-clamp-3")}>
                  {currentCard.item.overview ?? "No spoiler-free overview is available yet."}
                </p>
              </div>
              {currentCard.genres.length ? (
                <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-white/70">
                  {currentCard.genres.slice(0, detailsOpen ? 8 : 4).map((genre) => (
                    <span key={genre.id}>{genre.name}</span>
                  ))}
                </div>
              ) : null}
              <button
                aria-expanded={detailsOpen}
                className="inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-lg text-sm font-medium text-white/85 outline-none hover:text-white focus-visible:ring-2 focus-visible:ring-white"
                onClick={() => setDetailsOpen((open) => !open)}
                type="button"
              >
                {detailsOpen ? <ChevronUp aria-hidden="true" className="size-4" /> : <ChevronDown aria-hidden="true" className="size-4" />}
                {detailsOpen ? "Show less" : "More details"}
              </button>
            </div>

            {isSaving ? (
              <div className="absolute inset-0 z-30 grid place-items-center bg-background/65 backdrop-blur-sm">
                <div className="flex items-center gap-3 rounded-xl border bg-card px-5 py-4 text-sm font-medium shadow-xl">
                  <LoaderCircle aria-hidden="true" className="size-5 animate-spin motion-reduce:animate-none" />
                  Saving and loading next title…
                </div>
              </div>
            ) : null}
          </div>
        </div>

        <aside className="space-y-4 lg:sticky lg:top-24">
          <div className="rounded-2xl border bg-card p-4 shadow-sm">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold">What do you think?</p>
                <p className="text-xs text-muted-foreground">Choose the most accurate answer.</p>
              </div>
              <Button
                aria-label="Undo most recent answer (U)"
                className="cursor-pointer"
                disabled={!lastAction || isBusy}
                onClick={() => void undo()}
                size="icon-lg"
                title="Undo (U)"
                variant="ghost"
              >
                {isUndoing ? <LoaderCircle aria-hidden="true" className="animate-spin motion-reduce:animate-none" /> : <RotateCcw aria-hidden="true" />}
              </Button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {actions.map(({ className, icon: Icon, interactionType, key, label, shortLabel }) => (
                <Button
                  aria-label={`${label} (${key})`}
                  className={cn("h-auto min-h-12 cursor-pointer flex-col gap-1 py-2", className, interactionType === "unsure" && "col-span-2")}
                  disabled={isBusy}
                  key={interactionType}
                  onClick={() => void classify(interactionType)}
                  variant="outline"
                >
                  <Icon aria-hidden="true" className="size-4" />
                  <span>{shortLabel}</span>
                  <kbd className="hidden font-mono text-[10px] text-muted-foreground lg:inline">{key}</kbd>
                </Button>
              ))}
            </div>
          </div>

          <div className="hidden rounded-2xl border border-dashed p-4 text-xs leading-5 text-muted-foreground sm:block">
            <p className="font-medium text-foreground">Swipe on touch</p>
            <p>Right: liked · Left: not for me</p>
            <p>Up: interested · Down: haven’t watched</p>
          </div>
        </aside>
      </div>

      <p aria-live="polite" className="sr-only">{announcement}</p>
    </div>
  );
}

function EmptyQueue({
  completed,
  initialClassifiedCount,
  onUndo,
  undoing,
}: {
  completed: number;
  initialClassifiedCount: number;
  onUndo?: () => void;
  undoing: boolean;
}) {
  return (
    <div className="mx-auto grid min-h-[30rem] max-w-2xl place-items-center rounded-3xl border border-dashed bg-card/50 p-8 text-center">
      <div className="space-y-5">
        <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-primary/10 text-primary">
          {completed ? <Sparkles aria-hidden="true" className="size-7" /> : <Eye aria-hidden="true" className="size-7" />}
        </span>
        <div className="space-y-2">
          <h2 className="text-2xl font-semibold tracking-tight">
            {completed ? "Session complete" : "You’re all caught up"}
          </h2>
          <p className="text-sm leading-6 text-muted-foreground">
            {completed
              ? `You classified ${completed} titles this session. Your answers are safely stored.`
              : initialClassifiedCount
                ? `You’ve already classified ${initialClassifiedCount} available titles. Check back when the catalog refreshes.`
                : "No rating cards are available right now. Please try again shortly."}
          </p>
        </div>
        {onUndo ? (
          <Button className="cursor-pointer" disabled={undoing} onClick={onUndo} size="lg" variant="outline">
            {undoing ? <LoaderCircle aria-hidden="true" className="animate-spin motion-reduce:animate-none" /> : <RotateCcw aria-hidden="true" />}
            Undo last answer
          </Button>
        ) : null}
      </div>
    </div>
  );
}
