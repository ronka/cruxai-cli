import Image from "next/image";
import Link from "next/link";

const tickerItems = [
  "AI-FIRST",
  "ROLE-SCOPED",
  "REAL WORK",
  "ACCEPTANCE-TRACKED",
  "BUILT FOR HIRING",
  "OPEN LIBRARY",
];

export function HeroSection() {
  return (
    <section className="relative isolate overflow-hidden border-b-2 border-foreground/85">
      <Image
        src="/hero-bg.png"
        alt=""
        fill
        className="pointer-events-none object-cover opacity-[0.08] -z-20"
        priority
      />
      <div className="pointer-events-none absolute inset-0 -z-10 bg-grain opacity-[0.06] mix-blend-multiply dark:mix-blend-screen" />

      {/* Masthead strip */}
      <div className="double-rule">
        <div className="container flex items-center justify-between font-sans text-[10px] font-bold uppercase tracking-[0.32em] text-foreground/80 md:text-xs">
          <span>An interview protocol for AI-native engineers</span>
          <span className="hidden md:inline">Vol. I &middot; No. 01</span>
          <span className="md:hidden">№ 01</span>
        </div>
      </div>

      <div className="container pt-14 pb-20 md:pt-20 md:pb-28 lg:pt-24 lg:pb-32">
        <div className="grid grid-cols-12 gap-x-6 gap-y-10">
          {/* Left rail: index + manifesto */}
          <aside className="col-span-12 lg:col-span-3">
            <p className="font-sans text-[10px] font-bold uppercase tracking-[0.32em] text-foreground/60">
              <span className="text-accent">§</span> Index
            </p>
            <ol className="mt-4 space-y-2 font-sans text-sm text-foreground/70">
              <li className="flex items-baseline gap-3">
                <span className="font-mono text-[10px] tabular-nums text-foreground/40">I.</span>
                <span>On the premise</span>
              </li>
              <li className="flex items-baseline gap-3">
                <span className="font-mono text-[10px] tabular-nums text-foreground/40">II.</span>
                <span>What you get</span>
              </li>
              <li className="flex items-baseline gap-3">
                <span className="font-mono text-[10px] tabular-nums text-foreground/40">III.</span>
                <span>The protocol</span>
              </li>
            </ol>

            <div className="mt-10 hidden h-px w-16 bg-foreground/60 lg:block" />
            <p className="mt-6 hidden font-serif text-sm leading-relaxed text-foreground/70 lg:block">
              <span className="float-left mr-2 font-serif text-5xl font-bold leading-[0.8] text-primary">
                A
              </span>
              coding interview built for the way engineers actually work today &mdash;
              one hand on the keyboard, one on the model.
            </p>
          </aside>

          {/* Headline */}
          <div className="col-span-12 lg:col-span-9">
            <h1 className="font-serif font-bold tracking-[-0.035em] text-foreground">
              <span className="block text-[clamp(3.25rem,11vw,9.5rem)] leading-[0.86] rise">
                How
              </span>
              <span
                className="block text-[clamp(3.25rem,11vw,9.5rem)] leading-[0.86] rise"
                style={{ animationDelay: "120ms" }}
              >
                developers
              </span>
              <span
                className="block text-[clamp(3.25rem,11vw,9.5rem)] italic font-medium leading-[0.86] text-accent rise"
                style={{ animationDelay: "240ms" }}
              >
                work with
              </span>
              <span
                className="block text-[clamp(3.25rem,11vw,9.5rem)] leading-[0.86] rise"
                style={{ animationDelay: "360ms" }}
              >
                AI<span className="text-primary">.</span>
              </span>
            </h1>

            <div
              className="mt-14 grid grid-cols-1 gap-x-10 gap-y-8 border-t border-foreground/30 pt-8 md:grid-cols-12 rise"
              style={{ animationDelay: "520ms" }}
            >
              <p className="md:col-span-7 font-serif text-lg leading-snug text-foreground/85 md:text-xl">
                crux is an open library of interview questions designed to test{" "}
                <em className="font-medium text-foreground">judgment with the machine</em>,
                not memorization without it. LeetCode is the wrong proxy for the
                job that engineers do today.
              </p>

              <div className="md:col-span-5 flex flex-col gap-3">
                <Link
                  href="/questions"
                  className="group relative inline-flex h-14 items-center justify-between border-2 border-foreground bg-primary px-6 font-sans text-base font-bold uppercase tracking-wider text-primary-foreground transition-[transform,background-color] duration-200 hover:-translate-x-1 hover:-translate-y-1 hover:bg-accent hover:text-accent-foreground hover:shadow-[6px_6px_0_0_hsl(var(--foreground))]"
                >
                  <span>Open the library</span>
                  <span aria-hidden className="font-serif text-2xl leading-none">
                    &rarr;
                  </span>
                </Link>
                <a
                  href="#how-it-works"
                  className="group inline-flex h-14 items-center justify-between border-2 border-foreground bg-background px-6 font-sans text-base font-bold uppercase tracking-wider text-foreground transition-[transform,background-color] duration-200 hover:-translate-x-1 hover:-translate-y-1 hover:bg-foreground hover:text-background hover:shadow-[6px_6px_0_0_hsl(var(--primary))]"
                >
                  <span>How it works</span>
                  <span aria-hidden className="font-serif text-2xl leading-none">
                    &darr;
                  </span>
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Ticker */}
      <div className="relative border-t-2 border-foreground/85 bg-foreground py-3 text-background">
        <div
          className="marquee font-sans text-xs font-bold uppercase tracking-[0.4em]"
          aria-hidden
        >
          {[0, 1].map((dup) => (
            <ul key={dup} className="flex items-center gap-10 pr-10">
              {tickerItems.map((item, i) => (
                <li key={`${dup}-${i}`} className="flex items-center gap-10">
                  <span>{item}</span>
                  <span className="text-accent">&#x2756;</span>
                </li>
              ))}
            </ul>
          ))}
        </div>
      </div>
    </section>
  );
}
