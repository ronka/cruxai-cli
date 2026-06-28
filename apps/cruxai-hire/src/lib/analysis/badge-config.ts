import type { MessageFlag, MessageQuality } from "@/types/analysis";

export interface BadgeConfig {
  label: string;
  className: string;
}

export const flagBadgeConfig: Record<MessageFlag, BadgeConfig> = {
  exemplar: {
    label: "⭐ Exemplar",
    className: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400",
  },
  "red-flag": {
    label: "🚨 Red Flag",
    className: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
  },
  "teaching-moment": {
    label: "🧠 Teaching Moment",
    className: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  },
};

export const flagSolidBadgeConfig: Record<MessageFlag, { label: string; emoji: string; className: string }> = {
  exemplar: {
    label: "Exemplar",
    emoji: "⭐",
    className: "bg-amber-500 hover:bg-amber-600 text-white border-0",
  },
  "red-flag": {
    label: "Red Flag",
    emoji: "🚨",
    className: "bg-red-500 hover:bg-red-600 text-white border-0",
  },
  "teaching-moment": {
    label: "Teaching Moment",
    emoji: "🧠",
    className: "bg-blue-500 hover:bg-blue-600 text-white border-0",
  },
};

export const flagDotColor: Record<MessageFlag, string> = {
  "red-flag": "bg-red-500",
  exemplar: "bg-amber-500",
  "teaching-moment": "bg-blue-500",
};

export const flagShortLabel: Record<MessageFlag, string> = {
  exemplar: "⭐ Exemplar",
  "red-flag": "🚨 Red Flag",
  "teaching-moment": "🧠 Teaching Moment",
};

export const flagCounterEmoji: Record<MessageFlag, string> = {
  exemplar: "⭐",
  "red-flag": "🚨",
  "teaching-moment": "🧠",
};

export const qualityBadgeConfig: Record<MessageQuality, BadgeConfig> = {
  strong: {
    label: "strong",
    className: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  },
  adequate: {
    label: "adequate",
    className: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
  },
  weak: {
    label: "weak",
    className: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
  },
};

// Order used when picking a single dot color from a list of flags
export const flagDotPriority: MessageFlag[] = ["red-flag", "exemplar", "teaching-moment"];

export function pickFlagDotColor(flags: MessageFlag[]): string {
  for (const f of flagDotPriority) {
    if (flags.includes(f)) return flagDotColor[f];
  }
  return "";
}
