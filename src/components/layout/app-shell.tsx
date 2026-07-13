"use client";

import {
  Clock3,
  Compass,
  Heart,
  Menu,
  Settings,
  Sparkles,
  Star,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

interface NavigationItem {
  href: string;
  icon: LucideIcon;
  label: string;
}

const navigation: NavigationItem[] = [
  { href: "/discover", icon: Compass, label: "Discover" },
  { href: "/rate", icon: Sparkles, label: "Rate titles" },
  { href: "/recommendations", icon: Star, label: "Recommendations" },
  { href: "/watchlist", icon: Heart, label: "Watchlist" },
  { href: "/history", icon: Clock3, label: "History" },
  { href: "/settings", icon: Settings, label: "Settings" },
];

function Brand() {
  return (
    <Link
      className="flex items-center gap-3 font-semibold tracking-tight"
      href="/"
      aria-label="WatchMind home"
    >
      <span className="grid size-9 place-items-center rounded-xl bg-primary text-sm font-bold text-primary-foreground shadow-[0_0_28px_color-mix(in_oklch,var(--primary)_28%,transparent)]">
        W
      </span>
      <span className="text-lg">WatchMind</span>
    </Link>
  );
}

function Navigation({
  pathname,
  closeOnNavigate = false,
}: {
  pathname: string;
  closeOnNavigate?: boolean;
}) {
  return (
    <nav aria-label="Primary navigation" className="flex flex-col gap-1">
      {navigation.map(({ href, icon: Icon, label }) => {
        const active = pathname === href || pathname.startsWith(`${href}/`);

        const link = (
          <Link
            href={href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex min-h-10 items-center gap-3 rounded-lg px-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              active && "bg-accent text-accent-foreground",
            )}
          >
            <Icon aria-hidden="true" className="size-4.5" />
            {label}
          </Link>
        );

        return closeOnNavigate ? (
          <SheetClose asChild key={href}>
            {link}
          </SheetClose>
        ) : (
          <div key={href}>{link}</div>
        );
      })}
    </nav>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="min-h-dvh bg-background">
      <aside className="fixed inset-y-0 start-0 z-30 hidden w-64 border-e bg-sidebar/95 px-4 py-5 backdrop-blur md:flex md:flex-col">
        <div className="px-2">
          <Brand />
        </div>
        <Separator className="my-5" />
        <Navigation pathname={pathname} />
        <p className="mt-auto px-3 text-xs leading-5 text-muted-foreground">
          Your private taste profile. Your activity is never shared with other
          users.
        </p>
      </aside>

      <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b bg-background/85 px-4 backdrop-blur md:ms-64 md:px-8">
        <div className="md:hidden">
          <Sheet>
            <SheetTrigger asChild>
              <Button aria-label="Open navigation" size="icon" variant="ghost">
                <Menu aria-hidden="true" />
              </Button>
            </SheetTrigger>
            <SheetContent className="w-72" side="left">
              <SheetHeader className="border-b p-5">
                <SheetTitle asChild>
                  <Brand />
                </SheetTitle>
                <SheetDescription className="sr-only">
                  WatchMind primary navigation
                </SheetDescription>
              </SheetHeader>
              <div className="px-3">
                <Navigation closeOnNavigate pathname={pathname} />
              </div>
            </SheetContent>
          </Sheet>
        </div>
        <div className="md:hidden">
          <Brand />
        </div>
        <p className="text-xs text-muted-foreground sm:text-sm">
          Private by design
        </p>
      </header>

      <main className="md:ms-64">
        <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 md:px-8 md:py-12">
          {children}
        </div>
      </main>
    </div>
  );
}
