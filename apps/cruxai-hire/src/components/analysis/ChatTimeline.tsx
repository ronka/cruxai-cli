'use client';

import { useState, useMemo } from "react";
import { Slider } from "@/components/ui/slider";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Bot, User, Play, Pause, SkipBack, SkipForward, GitBranch, History, Edit3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { StoredMessage } from "@/types/stored-message";
import type { TimelineSnapshot } from "@/types/timeline";
import type { MessageInsight } from "@/server/analysisSchema";
import type { MessageFlag } from "@/types/analysis";
import { extractMessageContent } from "@/lib/analysisUtils";
import {
  flagShortLabel,
  flagSolidBadgeConfig,
  pickFlagDotColor,
  qualityBadgeConfig,
} from "@/lib/analysis/badge-config";

interface ChatMessage {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  timestamp?: string;
  snapshotKind?: TimelineSnapshot["kind"];
}

type TimelineEvent =
  | { id: string; type: "message"; data: StoredMessage }
  | { id: string; type: "snapshot"; timestamp: Date; data: TimelineSnapshot };

interface ChatTimelineProps {
  messages?: StoredMessage[];
  snapshots?: TimelineSnapshot[];
  messageInsights?: MessageInsight[];
  currentIndex?: number;
  onCurrentIndexChange?: (index: number) => void;
}

// Merge messages and snapshots into chronological timeline
// AI snapshots are attached after their target message; standalone snapshots go at end
function mergeTimeline(messages: StoredMessage[], snapshots: TimelineSnapshot[]): TimelineEvent[] {
  const messageEvents: TimelineEvent[] = messages.map((msg, idx) => ({
    id: msg.id || `msg-${idx}`,
    type: "message",
    data: msg,
  }));

  const snapshotEvents: TimelineEvent[] = snapshots
    .filter((snap) => snap.kind !== "snapshot-ai")
    .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime())
    .map((snap) => ({ id: snap.id, type: "snapshot", timestamp: snap.timestamp, data: snap }));

  return [...messageEvents, ...snapshotEvents];
}

const snapshotContent: Record<TimelineSnapshot["kind"], (label: string) => string> = {
  "snapshot-ai": (label) => `Checkpoint created after AI response at ${label}`,
  "snapshot-manual": (label) => `Checkpoint created after manual edit at ${label}`,
  "snapshot-revert": (label) => `Reverted to checkpoint at ${label}`,
};

function convertToDisplayMessage(event: TimelineEvent): ChatMessage {
  if (event.type === "message") {
    const message = event.data;
    const timestamp = message.role === 'user' && message.elapsedSeconds !== undefined
      ? `t+${Math.floor(message.elapsedSeconds / 60)}m`
      : undefined;
    return {
      id: event.id,
      role: message.role,
      content: extractMessageContent(message),
      timestamp,
    };
  }

  const snap = event.data;
  return {
    id: event.id,
    role: "system",
    content: snapshotContent[snap.kind](snap.label),
    snapshotKind: snap.kind,
  };
}

// Helper function to format flag tooltip
function getFlagTooltip(insight?: MessageInsight): string {
  if (!insight) return "";
  const flags = insight.flags ?? [];
  if (flags.length === 0 && insight.intent) {
    return `${insight.intent} · ${insight.quality}`;
  }
  const flagNames = flags.map((f) => flagShortLabel[f]).join(", ");
  return insight.reasoning ? `${flagNames}: ${insight.reasoning}` : flagNames;
}

export function ChatTimeline({
  messages = [],
  snapshots = [],
  messageInsights = [],
  currentIndex: controlledIndex,
  onCurrentIndexChange,
}: ChatTimelineProps) {
  const [internalIndex, setInternalIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  const isControlled = controlledIndex !== undefined;
  const currentIndex = isControlled ? controlledIndex : internalIndex;

  const setCurrentIndex = (idx: number) => {
    if (isControlled) {
      onCurrentIndexChange?.(idx);
    } else {
      setInternalIndex(idx);
    }
  };

  // Create insights map for O(1) lookup
  const insightsMap = useMemo(() => {
    const map = new Map<number, MessageInsight>();
    messageInsights?.forEach((insight) => {
      map.set(insight.messageIndex, insight);
    });
    return map;
  }, [messageInsights]);

  // Merge messages and snapshots into timeline
  const { chatHistory, allEvents } = useMemo(() => {
    const timeline = mergeTimeline(messages, snapshots);
    return {
      chatHistory: timeline.map((event) => convertToDisplayMessage(event)),
      allEvents: timeline,
    };
  }, [messages, snapshots]);

  if (chatHistory.length === 0) {
    return (
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-base">Conversation Timeline</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8 text-sm text-muted-foreground">
            No conversation recorded
          </div>
        </CardContent>
      </Card>
    );
  }

  const currentMessage = chatHistory[currentIndex];

  const handleSliderChange = (value: number[]) => {
    setCurrentIndex(value[0]);
    setIsPlaying(false);
  };

  const handlePrevious = () => {
    setCurrentIndex(Math.max(0, currentIndex - 1));
    setIsPlaying(false);
  };

  const handleNext = () => {
    setCurrentIndex(Math.min(chatHistory.length - 1, currentIndex + 1));
    setIsPlaying(false);
  };

  return (
    <Card>
      <CardHeader className="pb-4">
        <CardTitle className="text-base">Conversation Timeline</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Timeline slider */}
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={handlePrevious}
              disabled={currentIndex === 0}
            >
              <SkipBack className="h-4 w-4" />
            </Button>

            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => setIsPlaying(!isPlaying)}
            >
              {isPlaying ? (
                <Pause className="h-4 w-4" />
              ) : (
                <Play className="h-4 w-4" />
              )}
            </Button>

            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={handleNext}
              disabled={currentIndex === chatHistory.length - 1}
            >
              <SkipForward className="h-4 w-4" />
            </Button>

            <div className="flex-1">
              <Slider
                value={[currentIndex]}
                onValueChange={handleSliderChange}
                max={Math.max(0, chatHistory.length - 1)}
                step={1}
                className="w-full"
              />
            </div>

            <div className="min-w-[4rem] text-right">
              {currentMessage.timestamp && (
                <span className="font-mono text-sm text-muted-foreground">
                  {currentMessage.timestamp}
                </span>
              )}
            </div>
          </div>

          {/* Timeline dots */}
          <div className="flex justify-between px-10">
            {chatHistory.map((msg, idx) => {
              const isUserMessage = msg.role === "user";
              let messageIndex = -1;

              if (isUserMessage && allEvents.length > 0) {
                messageIndex = allEvents.slice(0, idx).filter((e) =>
                  e.type === "message"
                ).length;
              }

              const insight = isUserMessage ? insightsMap.get(messageIndex) : undefined;
              const flags = insight?.flags ?? [];
              const hasFlags = flags.length > 0;
              const hasMultipleFlags = flags.length > 1;

              return (
                <button
                  key={msg.id}
                  onClick={() => {
                    setCurrentIndex(idx);
                    setIsPlaying(false);
                  }}
                  className={cn(
                    "h-2 w-2 rounded-full transition-all",
                    idx === currentIndex && "scale-150",
                    hasFlags
                      ? pickFlagDotColor(flags)
                      : idx === currentIndex
                        ? "bg-primary"
                        : idx < currentIndex
                          ? "bg-primary/50"
                          : "bg-muted-foreground/30",
                    hasMultipleFlags && "ring-2 ring-offset-1 ring-current"
                  )}
                  title={getFlagTooltip(insight)}
                  aria-label={`Event ${idx + 1}`}
                />
              );
            })}
          </div>
        </div>

        {/* Current message and preview */}
        <div className="grid gap-4 lg:grid-cols-2">
          {/* Message */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant="outline" className="gap-1">
                {currentMessage.role === "user" ? (
                  <>
                    <User className="h-3 w-3" />
                    You
                  </>
                ) : currentMessage.role === "assistant" ? (
                  <>
                    <Bot className="h-3 w-3" />
                    AI
                  </>
                ) : (
                  <>
                    {currentMessage.snapshotKind === "snapshot-manual" ? (
                      <Edit3 className="h-3 w-3" />
                    ) : currentMessage.snapshotKind === "snapshot-revert" ? (
                      <History className="h-3 w-3" />
                    ) : (
                      <GitBranch className="h-3 w-3" />
                    )}
                    System
                  </>
                )}
              </Badge>
              <span className="text-xs text-muted-foreground">
                Event {currentIndex + 1} of {chatHistory.length}
              </span>
              {/* Display intent, quality, and flags for current user message */}
              {(() => {
                const isUserMessage = currentMessage.role === "user";
                if (!isUserMessage || allEvents.length === 0) return null;

                const messageIndex = allEvents.slice(0, currentIndex).filter((e) =>
                  e.type === "message"
                ).length;

                const insight = insightsMap.get(messageIndex);
                if (!insight) return null;

                const flags = insight.flags ?? [];

                return (
                  <>
                    {/* Intent + quality badges — only for new-format data */}
                    {insight.intent && (
                      <Badge variant="outline" className="gap-1 capitalize text-xs">
                        {insight.intent}
                      </Badge>
                    )}
                    {insight.quality && (
                      <span className={cn("inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium", qualityBadgeConfig[insight.quality]?.className ?? "")}>
                        {insight.quality}
                      </span>
                    )}
                    {/* Flag badges */}
                    {flags.map((flag: MessageFlag) => {
                      const config = flagSolidBadgeConfig[flag];
                      if (!config) return null;
                      return (
                        <Badge key={flag} className={cn("gap-1", config.className)}>
                          <span>{config.emoji}</span>
                          {config.label}
                        </Badge>
                      );
                    })}
                  </>
                );
              })()}
            </div>
            <div
              className={cn(
                "rounded-lg p-4 text-sm leading-relaxed",
                currentMessage.role === "user"
                  ? "bg-primary/10 text-foreground"
                  : currentMessage.role === "system"
                    ? "border border-border bg-card text-muted-foreground italic"
                    : "bg-muted"
              )}
            >
              {currentMessage.content}
            </div>
            {/* Display reasoning for every classified user message */}
            {(() => {
              const isUserMessage = currentMessage.role === "user";
              if (!isUserMessage || allEvents.length === 0) return null;

              const messageIndex = allEvents.slice(0, currentIndex).filter((e) =>
                e.type === "message"
              ).length;

              const insight = insightsMap.get(messageIndex);
              if (!insight?.reasoning) return null;

              return (
                <div className="rounded-lg border border-border bg-muted/30 p-3 text-xs text-muted-foreground">
                  <div className="font-medium mb-1">Assessment:</div>
                  <div>{insight.reasoning}</div>
                </div>
              );
            })()}
          </div>
        </div>

      </CardContent>
    </Card>
  );
}
