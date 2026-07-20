import { cn } from "@/lib/utils";

interface SparklineProps {
  data: number[];
  className?: string;
  /** Viewbox dimensions; the line scales to fill its container. */
  width?: number;
  height?: number;
}

/** Minimal dependency-free area sparkline using the accent color. */
export function Sparkline({ data, className, width = 240, height = 56 }: SparklineProps) {
  if (data.length === 0) return null;

  const max = Math.max(...data, 1);
  const stepX = data.length > 1 ? width / (data.length - 1) : 0;
  const points = data.map((v, i) => [i * stepX, height - (v / max) * (height - 4) - 2] as const);

  const line = points.map(([x, y], i) => `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
  const area = `${line} L${width},${height} L0,${height} Z`;

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="none"
      className={cn("h-14 w-full", className)}
      role="img"
      aria-label="Daily activity trend"
    >
      <path d={area} className="fill-primary/15" />
      <path d={line} className="fill-none stroke-primary" strokeWidth={2} vectorEffect="non-scaling-stroke" />
    </svg>
  );
}
