export type ViewMode = "preview" | "code";

export interface FileNode {
  name: string;
  path: string;
  type: "file" | "folder";
  children?: FileNode[];
}

export interface PreviewPanelProps {
  role?: "frontend" | "backend" | "fullstack";
  isLoading: boolean;
  isReverting?: boolean;
  error?: string | null;
}

