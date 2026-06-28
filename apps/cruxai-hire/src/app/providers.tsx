'use client';

import { useState, useEffect, type ReactNode } from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { createTRPCClient, httpBatchLink } from "@trpc/client";
import superjson from "superjson";
import { NuqsAdapter } from "nuqs/adapters/next/app";
import { ThemeProvider } from "@/components/ThemeProvider";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TRPCProvider } from "@/lib/trpc/trpc";
import { getQueryClient } from "@/lib/trpc/query-client";
import type { AppRouter } from "@/server/trpc/routers/_app";

const STALE_STORAGE_KEYS = [
  'cruxai-questions',
  'cruxai-recruiter-roles',
  'cruxai-recruiter-candidates',
  'cruxai-recruiter-submissions',
  'cruxai-candidate',
];

export function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(() => getQueryClient());
  const [trpcClient] = useState(() =>
    createTRPCClient<AppRouter>({
      links: [
        httpBatchLink({
          url: '/api/trpc',
          transformer: superjson,
        }),
      ],
    })
  );

  useEffect(() => {
    STALE_STORAGE_KEYS.forEach((key) => localStorage.removeItem(key));
  }, []);

  return (
    <NuqsAdapter>
      <QueryClientProvider client={queryClient}>
        <TRPCProvider trpcClient={trpcClient} queryClient={queryClient}>
          <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
            <TooltipProvider>
              {children}
              <Toaster />
              <Sonner />
            </TooltipProvider>
          </ThemeProvider>
        </TRPCProvider>
      </QueryClientProvider>
    </NuqsAdapter>
  );
}
