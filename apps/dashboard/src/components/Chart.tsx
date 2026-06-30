'use client';

import { useEffect, useRef, useState } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  LineController,
  BarElement,
  BarController,
  Filler,
  Tooltip,
  type ChartData,
  type ChartOptions,
  type ChartType,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  LineController,
  BarElement,
  BarController,
  Filler,
  Tooltip,
);

export interface ChartDataset {
  label: string;
  data: number[];
  color?: string;
}

interface ChartProps {
  labels: string[];
  datasets: ChartDataset[];
  type?: 'line' | 'bar';
  height?: number;
  fill?: boolean;
}

function getCssVar(name: string): string {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

function hsl(cssVar: string, alpha = 1): string {
  const raw = getCssVar(cssVar);
  return alpha < 1 ? `hsla(${raw}, ${alpha})` : `hsl(${raw})`;
}

export function Chart({ labels, datasets, type = 'line', height = 220, fill = true }: ChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const chartRef = useRef<ChartJS | null>(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    const accent = hsl('--accent');
    const accentFade = hsl('--accent', 0.15);
    const mutedFg = hsl('--muted-foreground');
    const border = hsl('--border');

    const builtDatasets = datasets.map((ds, i) => ({
      label: ds.label,
      data: ds.data,
      borderColor: ds.color ?? (i === 0 ? accent : hsl('--tertiary')),
      backgroundColor: fill && type === 'line'
        ? (ds.color ? ds.color.replace('hsl', 'hsla').replace(')', ', 0.12)') : accentFade)
        : (ds.color ?? accent),
      borderWidth: 2,
      pointRadius: labels.length > 30 ? 0 : 3,
      pointHoverRadius: 5,
      tension: 0.35,
      fill: fill && type === 'line',
    }));

    const options: ChartOptions<ChartType> = {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: 'index', intersect: false },
      plugins: { legend: { display: false }, tooltip: { displayColors: false } },
      scales: {
        x: {
          grid: { color: border },
          ticks: { color: mutedFg, font: { family: 'monospace', size: 10 }, maxTicksLimit: 10 },
        },
        y: {
          grid: { color: border },
          ticks: { color: mutedFg, font: { family: 'monospace', size: 10 } },
          beginAtZero: true,
        },
      },
    };

    if (chartRef.current) {
      chartRef.current.destroy();
    }

    chartRef.current = new ChartJS(canvasRef.current, {
      type: type as ChartType,
      data: { labels, datasets: builtDatasets } as ChartData<ChartType>,
      options,
    });

    return () => {
      chartRef.current?.destroy();
      chartRef.current = null;
    };
  }, [labels, datasets, type, fill, height]);

  return (
    <div style={{ height }}>
      <canvas ref={canvasRef} />
    </div>
  );
}

export type MetricTab = { key: string; label: string; data: number[] };

interface TabbedChartProps {
  labels: string[];
  tabs: MetricTab[];
  type?: 'line' | 'bar';
  height?: number;
}

export function TabbedChart({ labels, tabs, type = 'line', height = 220 }: TabbedChartProps) {
  const [active, setActive] = useState(0);
  const tab = tabs[active];

  return (
    <div>
      <div className="mb-4 flex gap-2 flex-wrap">
        {tabs.map((t, i) => (
          <button
            key={t.key}
            onClick={() => setActive(i)}
            className={[
              'font-mono text-[0.65rem] uppercase tracking-[0.12em] px-2.5 py-1 rounded-full transition-colors',
              i === active
                ? 'bg-accent text-accent-foreground'
                : 'text-muted-foreground hover:text-foreground',
            ].join(' ')}
          >
            {t.label}
          </button>
        ))}
      </div>
      {tab && (
        <Chart
          labels={labels}
          datasets={[{ label: tab.label, data: tab.data }]}
          type={type}
          height={height}
        />
      )}
    </div>
  );
}
