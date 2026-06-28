'use client';

import { useMemo } from "react";
import { buildFileTree } from "@/lib/fileTree";
import { FileTreeNode } from "./FileTreeNode";

interface FileTreeProps {
  files: Record<string, string>;
  selectedPath: string | null;
  onFileSelect: (path: string) => void;
}

export function FileTree({ files, selectedPath, onFileSelect }: FileTreeProps) {
  const tree = useMemo(() => buildFileTree(files), [files]);

  if (Object.keys(files).length === 0) {
    return (
      <div className="h-full border-r border-border bg-card">
        <div className="flex h-10 items-center border-b border-border bg-muted/30 px-4">
          <h3 className="text-xs font-medium text-muted-foreground">FILES</h3>
        </div>
        <div className="flex items-center justify-center p-8">
          <p className="text-xs text-muted-foreground">No files available</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-auto border-r border-border bg-card">
      <div className="flex h-10 items-center border-b border-border bg-muted/30 px-4">
        <h3 className="text-xs font-medium text-muted-foreground">FILES</h3>
      </div>
      <div className="p-2">
        {tree.children?.map((node) => (
          <FileTreeNode
            key={node.path}
            node={node}
            level={0}
            selectedPath={selectedPath}
            onFileSelect={onFileSelect}
          />
        ))}
      </div>
    </div>
  );
}
