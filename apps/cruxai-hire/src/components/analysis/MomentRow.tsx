'use client';

import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronRight, Target } from "lucide-react";
import { InsightBadges } from "@/components/analysis/InsightBadges";
import { extractMessageContent } from "@/lib/analysisUtils";
import type { StoredMessage } from "@/types/stored-message";
import type { MessageInsight } from "@/server/analysisSchema";

interface MomentRowProps {
  insight: MessageInsight;
  message: StoredMessage | undefined;
  isExpanded: boolean;
  onToggle: () => void;
  onJumpToMessage?: () => void;
}

function formatElapsed(elapsedSeconds?: number): string {
  if (elapsedSeconds === undefined) return "";
  const m = Math.floor(elapsedSeconds / 60);
  const s = elapsedSeconds % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

export function MomentRow({ insight, message, isExpanded, onToggle, onJumpToMessage }: MomentRowProps) {
  const text = message ? extractMessageContent(message) : "";
  const preview = text.length > 120 ? text.slice(0, 120) + "…" : text;
  const elapsed = message?.role === "user" ? formatElapsed(message.elapsedSeconds) : "";

  return (
    <div className="rounded-md border border-border overflow-hidden">
      <div className="flex items-start hover:bg-muted/50 transition-colors">
        <button className="flex-1 flex items-start gap-3 p-3 text-left" onClick={onToggle}>
          <span className="mt-0.5 shrink-0 text-muted-foreground">
            {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          </span>
          <div className="flex-1 min-w-0 space-y-1.5">
            <div className="flex items-center gap-1.5 flex-wrap">
              <InsightBadges insight={insight} />
              {elapsed && <span className="text-xs text-muted-foreground font-mono">{elapsed}</span>}
            </div>
            <p className="text-sm text-foreground truncate">{preview}</p>
          </div>
        </button>
        {onJumpToMessage && (
          <div className="p-3 pl-0 flex items-start">
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 shrink-0 text-muted-foreground hover:text-foreground"
              onClick={onJumpToMessage}
              title="Jump to timeline"
            >
              <Target className="h-3.5 w-3.5" />
            </Button>
          </div>
        )}
      </div>
      {isExpanded && (
        <div className="px-4 pb-3 space-y-2 border-t border-border bg-muted/20">
          <p className="text-sm text-foreground pt-3 whitespace-pre-wrap">{text}</p>
          {insight.reasoning && (
            <div className="rounded-md bg-muted/40 p-2.5 text-xs text-muted-foreground">
              <span className="font-medium">Assessment: </span>
              {insight.reasoning}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
