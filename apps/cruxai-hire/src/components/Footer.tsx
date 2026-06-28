import Link from "next/link";
import { Sparkles } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t border-border/40 bg-muted/30">
      <div className="container py-12">
        <div className="flex flex-col items-center justify-between gap-6 md:flex-row">
          <div className="flex items-center gap-2">
            <span className="text-lg font-semibold">crux.ai</span>
          </div>

          <nav className="flex gap-8">
            <Link href="/questions" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
              Questions
            </Link>
            <a
              href="#features"
              className="text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              Features
            </a>
            <a
              href="#how-it-works"
              className="text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              How It Works
            </a>
          </nav>

          <p className="text-sm text-muted-foreground">
            © 2024 crux.ai. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
