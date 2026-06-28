import type { Metadata } from "next";
import { Providers } from "./providers";
import "./globals.css";
import { Agentation } from "agentation";

export const metadata: Metadata = {
  title: "crux.ai",
  description: "AI-focused interview platform for assessing how developers work with AI tools.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="icon" href="https://fav.farm/🧩" />
      </head>
      <body className="min-h-screen bg-background text-foreground antialiased">
        <Providers>{children}</Providers>
        {process.env.NODE_ENV === "development" && <Agentation />}
      </body>
    </html>
  );
}
