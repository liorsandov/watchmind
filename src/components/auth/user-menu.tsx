"use client";

import { LogOut, Settings } from "lucide-react";
import Link from "next/link";
import { logoutAction } from "@/app/(protected)/actions";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface UserMenuProps {
  displayName: string | null;
  email: string;
}

export function UserMenu({ displayName, email }: UserMenuProps) {
  const label = displayName || email;
  const initials = label
    .split(/\s|@/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          aria-label="Open account menu"
          className="h-10 gap-2 px-2 sm:px-3"
          variant="ghost"
        >
          <Avatar className="size-7">
            <AvatarFallback>{initials || "U"}</AvatarFallback>
          </Avatar>
          <span className="hidden max-w-40 truncate text-sm sm:block">
            {displayName || email}
          </span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuLabel className="space-y-0.5">
          <span className="block truncate text-sm text-foreground">
            {displayName || "Your account"}
          </span>
          <span className="block truncate font-normal">{email}</span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/settings">
            <Settings aria-hidden="true" />
            Account settings
          </Link>
        </DropdownMenuItem>
        <form action={logoutAction}>
          <DropdownMenuItem asChild variant="destructive">
            <button className="w-full" type="submit">
              <LogOut aria-hidden="true" />
              Sign out
            </button>
          </DropdownMenuItem>
        </form>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
