import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Crux Dashboard',
  description: 'AI coding analytics dashboard powered by @crux/core',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
