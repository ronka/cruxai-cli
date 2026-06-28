import { Eye, Code2, RefreshCw, ArrowRight, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ViewMode } from "./types";
import { useViewModePathInput } from "@/hooks/view-mode-tabs/useViewModePathInput";

interface ViewModeTabsProps {
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  currentPath: string;
  onPathChange: (path: string) => void;
  onRefresh: () => void;
  sandboxUrl: string | null;
}

export function ViewModeTabs({
  viewMode,
  onViewModeChange,
  currentPath,
  onPathChange,
  onRefresh,
  sandboxUrl
}: ViewModeTabsProps) {
  const { inputPath, setInputPath } = useViewModePathInput(currentPath);

  const handleNavigate = () => {
    const path = inputPath.startsWith('/') ? inputPath : `/${inputPath}`;
    onPathChange(path);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleNavigate();
    }
  };

  const handleOpenInNewWindow = () => {
    if (sandboxUrl) {
      window.open(`${sandboxUrl}${currentPath}`, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <div className="flex h-10 items-center justify-between border-b border-border bg-muted/30 px-4">
      <div className="flex items-center gap-1">
        <button
          onClick={() => onViewModeChange("preview")}
          className={cn(
            "flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium transition-colors",
            viewMode === "preview"
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          <Eye className="h-3.5 w-3.5" />
          Preview
        </button>
        <button
          onClick={() => onViewModeChange("code")}
          className={cn(
            "flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium transition-colors",
            viewMode === "code"
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          <Code2 className="h-3.5 w-3.5" />
          Code
        </button>
      </div>

      {viewMode === "preview" && (
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 rounded-md border border-border bg-background px-2 py-1">
            <input
              type="text"
              value={inputPath}
              onChange={(e) => setInputPath(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="/route"
              className="w-32 bg-transparent text-xs text-foreground outline-none placeholder:text-muted-foreground"
            />
            <button
              onClick={handleNavigate}
              className="text-muted-foreground transition-colors hover:text-foreground"
              title="Navigate to route"
            >
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
          <button
            onClick={onRefresh}
            className="rounded-md p-1 text-muted-foreground transition-colors hover:bg-background hover:text-foreground"
            title="Refresh preview"
          >
            <RefreshCw className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={handleOpenInNewWindow}
            disabled={!sandboxUrl}
            className="rounded-md p-1 text-muted-foreground transition-colors hover:bg-background hover:text-foreground disabled:opacity-50 disabled:cursor-not-allowed"
            title="Open in new window"
          >
            <ExternalLink className="h-3.5 w-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}
