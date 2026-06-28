'use client';

import { useState } from "react";
import { ApiTestingPanel } from "./ApiTestingPanel";
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable";
import { ViewModeTabs } from "./preview/ViewModeTabs";
import { TestCasesPanel } from "./preview/TestCasesPanel";
import { CodeView } from "./preview/CodeView";
import type { ViewMode, PreviewPanelProps } from "./preview/types";
import { Loader2 } from "lucide-react";
import { useSandboxStore } from "@/stores/sandboxStore";

export function PreviewPanel({
  role = "frontend",
  isLoading,
  isReverting,
  error,
}: PreviewPanelProps) {
  // Get sandbox state from store
  const sandboxUrl = useSandboxStore((state) => state.sandboxUrl);
  const previewKey = useSandboxStore((state) => state.previewKey);
  const bumpPreviewKey = useSandboxStore((state) => state.bumpPreviewKey);

  const [viewMode, setViewMode] = useState<ViewMode>("preview");
  const [currentPath, setCurrentPath] = useState<string>("/");

  // For backend questions, show API testing panel
  if (role === "backend") {
    return <ApiTestingPanel />;
  }

  return (
    <ResizablePanelGroup direction="vertical" className="h-full bg-background">
      <ResizablePanel defaultSize={60} minSize={30}>
        <div className="flex h-full flex-col">
          <ViewModeTabs
            viewMode={viewMode}
            onViewModeChange={setViewMode}
            currentPath={currentPath}
            onPathChange={setCurrentPath}
            onRefresh={bumpPreviewKey}
            sandboxUrl={sandboxUrl}
          />
          <div className="relative flex-1 overflow-hidden">
            {isLoading && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-card">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                <p className="mt-4 text-sm text-muted-foreground">Creating sandbox environment...</p>
              </div>
            )}

            {isReverting && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-card/80 backdrop-blur-sm z-10">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                <p className="mt-4 text-sm text-muted-foreground">Reverting to checkpoint...</p>
              </div>
            )}

            {error && !isLoading && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-card p-8">
                <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-center">
                  <p className="text-sm font-medium text-destructive">Failed to create sandbox</p>
                  <p className="mt-1 text-xs text-muted-foreground">{error}</p>
                </div>
              </div>
            )}

            {sandboxUrl && !isLoading && !error && viewMode === "preview" && (
              <iframe
                key={`${sandboxUrl}-${currentPath}-${previewKey}`}
                src={`${sandboxUrl}${currentPath}`}
                className="h-full w-full border-0"
                title="Sandbox Preview"
                allow="accelerometer; camera; encrypted-media; geolocation; gyroscope; microphone; midi"
                sandbox="allow-forms allow-modals allow-popups allow-presentation allow-same-origin allow-scripts allow-downloads"
              />
            )}

            {sandboxUrl && !isLoading && !error && viewMode === "code" && (
              <CodeView />
            )}

            {!sandboxUrl && !isLoading && !error && (
              <div className="absolute inset-0 flex items-center justify-center bg-card">
                <p className="text-sm text-muted-foreground">Click "Start Challenge" to begin</p>
              </div>
            )}
          </div>
        </div>
      </ResizablePanel>

      <ResizableHandle withHandle />

      <ResizablePanel defaultSize={40} minSize={20}>
        <TestCasesPanel />
      </ResizablePanel>
    </ResizablePanelGroup>
  );
}
