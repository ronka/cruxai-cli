const blocks = [
  {
    num: "01",
    label: "AI-FIRST",
    title: "Tests for the workflow that exists.",
    body:
      "Every question is designed to be solved with an AI assistant in the loop. The skill being measured is judgment, prompting, and review — not recall.",
    bg: "bg-primary",
    fg: "text-primary-foreground",
    ruleColor: "bg-primary-foreground/40",
    accent: "text-background",
  },
  {
    num: "02",
    label: "ROLE-SCOPED",
    title: "Frontend, backend, fullstack.",
    body:
      "Filter the library to the shape of the role you are hiring for. Each question carries the role, difficulty, and the stack it was written against.",
    bg: "bg-accent",
    fg: "text-accent-foreground",
    ruleColor: "bg-accent-foreground/40",
    accent: "text-background",
  },
  {
    num: "03",
    label: "REAL WORK",
    title: "Code, not riddles.",
    body:
      "Problems pulled from how production code actually gets written this year — ambiguous specs, half-broken libraries, and the editor right next to the model.",
    bg: "bg-foreground",
    fg: "text-background",
    ruleColor: "bg-background/40",
    accent: "text-primary",
  },
];

export function FeaturesSection() {
  return (
    <section
      id="features"
      className="relative border-b-2 border-foreground/85"
    >
      {/* Section masthead */}
      <div className="double-rule">
        <div className="container flex items-center justify-between font-sans text-[10px] font-bold uppercase tracking-[0.32em] text-foreground/80 md:text-xs">
          <span>
            <span className="text-accent">&sect;</span> II &middot; What you get
          </span>
          <span className="hidden font-serif italic text-foreground/60 md:inline">
            Filed under: capabilities
          </span>
        </div>
      </div>

      {/* Section title row */}
      <div className="container py-16 md:py-24">
        <div className="grid grid-cols-12 items-end gap-6">
          <h2 className="col-span-12 font-serif text-[clamp(2.5rem,6vw,5rem)] font-bold leading-[0.95] tracking-tight md:col-span-9">
            Three things, and{" "}
            <em className="font-medium text-accent">nothing</em> a generic
            coding test does.
          </h2>
          <p className="col-span-12 font-sans text-sm leading-relaxed text-foreground/70 md:col-span-3">
            <span className="block text-[10px] font-bold uppercase tracking-[0.32em] text-foreground/50">
              At a glance
            </span>
            <span className="mt-2 block">
              No multiple choice. No reverse-a-linked-list. No surveillance.
              Just the work, and a record of how a candidate did it.
            </span>
          </p>
        </div>
      </div>

      {/* Color blocks: full-bleed, hard rules */}
      <div className="grid grid-cols-1 border-t-2 border-foreground/85 md:grid-cols-3">
        {blocks.map((b, i) => (
          <article
            key={b.num}
            className={`${b.bg} ${b.fg} group relative flex min-h-[420px] flex-col justify-between p-8 transition-colors duration-300 md:min-h-[520px] md:p-10 ${
              i < blocks.length - 1
                ? "border-b-2 border-foreground/85 md:border-b-0 md:border-r-2"
                : ""
            }`}
          >
            {/* Top: numeral + label */}
            <div>
              <div className="flex items-start justify-between">
                <span className="font-serif text-[clamp(4.5rem,9vw,8rem)] font-bold leading-[0.85] tracking-tight">
                  {b.num}
                </span>
                <span className="mt-3 font-sans text-[10px] font-bold uppercase tracking-[0.32em] opacity-80">
                  / {b.label}
                </span>
              </div>
              <div className={`mt-6 h-px w-16 ${b.ruleColor}`} />
            </div>

            {/* Bottom: title + body */}
            <div>
              <h3 className="font-serif text-2xl font-bold leading-[1.05] tracking-tight md:text-3xl">
                {b.title}
              </h3>
              <p className="mt-4 max-w-prose font-sans text-[15px] leading-relaxed opacity-90">
                {b.body}
              </p>
            </div>

            {/* Hover tell: a thick block in the corner */}
            <span
              aria-hidden
              className={`pointer-events-none absolute bottom-0 right-0 h-2 w-0 ${b.accent.replace(
                "text-",
                "bg-",
              )} transition-[width] duration-500 group-hover:w-full`}
            />
          </article>
        ))}
      </div>
    </section>
  );
}
