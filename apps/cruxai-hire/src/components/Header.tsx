'use client';

import Link from "next/link";

import { ProfileDropdown } from "./ProfileDropdown";
import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";
import { Sparkles } from "lucide-react";

export function Header() {
  const { data: session, isPending } = authClient.useSession();

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/80 backdrop-blur-lg">
      <div className="container flex h-16 items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <span className="text-xl font-semibold tracking-tight">crux.ai</span>
        </Link>

        <nav className="flex items-center gap-6">
          {session && (
            <Link
              href="/recruiters"
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              Dashboard
            </Link>
          )}
          {!isPending && (
            session ? (
              <ProfileDropdown />
            ) : (
              <Button size="sm" asChild>
                <Link href="/login">Sign in</Link>
              </Button>
            )
          )}
        </nav>
      </div>
    </header>
  );
}
