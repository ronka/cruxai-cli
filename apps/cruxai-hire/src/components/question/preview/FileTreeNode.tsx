'use client';

import { useState } from "react";
import { File, Folder, FolderOpen, ChevronRight, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from "@/components/ui/collapsible";
import type { FileNode } from "./types";

interface FileTreeNodeProps {
  node: FileNode;
  level: number;
  selectedPath: string | null;
  onFileSelect: (path: string) => void;
}

export function FileTreeNode({ node, level, selectedPath, onFileSelect }: FileTreeNodeProps) {
  const [isOpen, setIsOpen] = useState(true);

  if (node.type === "file") {
    return (
      <button
        onClick={() => onFileSelect(node.path)}
        className={cn(
          "flex w-full items-center gap-1.5 rounded-md px-2 py-1 text-xs transition-colors hover:bg-muted/50",
          selectedPath === node.path && "bg-muted text-foreground font-medium"
        )}
        style={{ paddingLeft: `${level * 16 + 8}px` }}
      >
        <File className="h-3.5 w-3.5 flex-shrink-0 text-muted-foreground" />
        <span className="truncate">{node.name}</span>
      </button>
    );
  }

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <CollapsibleTrigger asChild>
        <button
          className="flex w-full items-center gap-1.5 rounded-md px-2 py-1 text-xs transition-colors hover:bg-muted/50"
          style={{ paddingLeft: `${level * 16 + 8}px` }}
        >
          {isOpen ? (
            <ChevronDown className="h-3.5 w-3.5 flex-shrink-0 text-muted-foreground" />
          ) : (
            <ChevronRight className="h-3.5 w-3.5 flex-shrink-0 text-muted-foreground" />
          )}
          {isOpen ? (
            <FolderOpen className="h-3.5 w-3.5 flex-shrink-0 text-muted-foreground" />
          ) : (
            <Folder className="h-3.5 w-3.5 flex-shrink-0 text-muted-foreground" />
          )}
          <span className="truncate font-medium">{node.name}</span>
        </button>
      </CollapsibleTrigger>
      <CollapsibleContent>
        {node.children?.map((child) => (
          <FileTreeNode
            key={child.path}
            node={child}
            level={level + 1}
            selectedPath={selectedPath}
            onFileSelect={onFileSelect}
          />
        ))}
      </CollapsibleContent>
    </Collapsible>
  );
}
