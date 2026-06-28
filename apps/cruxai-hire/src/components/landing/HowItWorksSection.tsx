import Link from "next/link";

const steps = [
  {
    num: "I",
    verb: "Browse",
    title: "Pick a question from the library.",
    body:
      "Search by role, difficulty, or stack. Every entry shows acceptance rate, runtime, and the kind of AI behavior it was written to probe.",
    meta: "~ 2 minutes",
  },
  {
    num: "II",
    verb: "Run",
    title: "Send it to the candidate.",
    body:
      "They get a sandboxed editor with the model of their choice. You get a recording of the session — keystrokes, prompts, model responses, the lot.",
    meta: "60–90 minutes",
  },
  {
    num: "III",
    verb: "Read",
    title: "Open the report.",
    body:
      "A written analysis lands on your dashboard: what they tried, where they leaned on the model, where they pushed back, and a hire / no-hire signal.",
    meta: "~ 5 minutes",
  },
];

export function HowItWorksSection() {
  return (
    <section id="how-it-works" className="relative">
      {/* Masthead */}
      <div className="double-rule">
        <div className="container flex items-center justify-between font-sans text-[10px] font-bold uppercase tracking-[0.32em] text-foreground/80 md:text-xs">
          <span>
            <span className="text-accent">&sect;</span> III &middot; The protocol
          </span>
          <span className="hidden font-serif italic text-foreground/60 md:inline">
            Three steps, in order.
          </span>
        </div>
      </div>

      {/* Section header */}
      <div className="container pt-16 md:pt-24">
        <div className="grid grid-cols-12 items-end gap-6">
          <h2 className="col-span-12 font-serif text-[clamp(2.5rem,6vw,5rem)] font-bold leading-[0.95] tracking-tight md:col-span-9">
            From{" "}
            <em className="font-medium text-accent">a question</em> to a
            hire&nbsp;signal.
          </h2>
          <p className="col-span-12 font-sans text-sm leading-relaxed text-foreground/70 md:col-span-3">
            <span className="block text-[10px] font-bold uppercase tracking-[0.32em] text-foreground/50">
              Run time
            </span>
            <span className="mt-2 block">
              About ninety minutes start to finish, including the report you
              read at the end.
            </span>
          </p>
        </div>
      </div>

      {/* Steps as a table */}
      <div className="container mt-12 border-y-2 border-foreground/85 md:mt-16">
        {steps.map((s, i) => (
          <article
            key={s.num}
            className={`group grid grid-cols-12 items-start gap-x-6 gap-y-4 py-10 md:gap-x-10 md:py-14 ${
              i < steps.length - 1 ? "border-b border-foreground/30" : ""
            }`}
          >
            {/* Numeral */}
            <div className="col-span-12 md:col-span-3">
              <span className="block font-serif text-[clamp(5rem,10vw,9rem)] italic font-medium leading-[0.85] tracking-tight text-primary transition-colors duration-300 group-hover:text-accent">
                {s.num}
              </span>
              <span className="mt-2 block font-sans text-[10px] font-bold uppercase tracking-[0.32em] text-foreground/50">
                Step / {s.verb}
              </span>
            </div>

            {/* Title + body */}
            <div className="col-span-12 md:col-span-7">
              <h3 className="font-serif text-2xl font-bold leading-[1.1] tracking-tight md:text-4xl">
                {s.title}
              </h3>
              <p className="mt-4 max-w-prose font-sans text-base leading-relaxed text-foreground/80">
                {s.body}
              </p>
            </div>

            {/* Right meta column */}
            <aside className="col-span-12 md:col-span-2 md:pt-3">
              <div className="h-px w-10 bg-foreground/60 md:ml-auto" />
              <p className="mt-3 font-mono text-xs uppercase tracking-wider text-foreground/60 md:text-right">
                {s.meta}
              </p>
            </aside>
          </article>
        ))}
      </div>

      {/* Closing CTA — colophon style */}
      <div className="container py-20 md:py-28">
        <div className="grid grid-cols-12 items-end gap-y-10 gap-x-6">
          <div className="col-span-12 md:col-span-8">
            <p className="font-sans text-[10px] font-bold uppercase tracking-[0.32em] text-foreground/50">
              <span className="text-accent">&para;</span> Colophon
            </p>
            <p className="mt-6 font-serif text-[clamp(1.75rem,3.6vw,3rem)] font-medium leading-[1.05] tracking-tight">
              Stop testing for{" "}
              <em className="text-accent">1999&apos;s job</em>. Start interviewing
              for the one your team is actually doing.
            </p>
          </div>
          <div className="col-span-12 md:col-span-4 md:flex md:justify-end">
            <Link
              href="/questions"
              className="group inline-flex h-16 items-center justify-between gap-6 border-2 border-foreground bg-foreground px-7 font-sans text-base font-bold uppercase tracking-wider text-background transition-[transform,box-shadow] duration-200 hover:-translate-x-1 hover:-translate-y-1 hover:shadow-[8px_8px_0_0_hsl(var(--primary))]"
            >
              <span>Open the library</span>
              <span aria-hidden className="font-serif text-3xl leading-none">
                &rarr;
              </span>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
