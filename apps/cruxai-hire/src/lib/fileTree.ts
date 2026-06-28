import type { FileNode } from "@/components/question/preview/types";

export function buildFileTree(files: Record<string, string>): FileNode {
  const root: FileNode = {
    name: "root",
    path: "/",
    type: "folder",
    children: [],
  };

  // Sort paths for consistent ordering
  const paths = Object.keys(files).sort();

  for (const path of paths) {
    const segments = path.split("/").filter((s) => s.length > 0);
    let current = root;

    // Build folder structure
    for (let i = 0; i < segments.length - 1; i++) {
      const segment = segments[i];
      let child = current.children?.find((c) => c.name === segment);

      if (!child) {
        child = {
          name: segment,
          path: "/" + segments.slice(0, i + 1).join("/"),
          type: "folder",
          children: [],
        };
        current.children?.push(child);
      }

      current = child;
    }

    // Add file
    const fileName = segments[segments.length - 1];
    current.children?.push({
      name: fileName,
      path: path,
      type: "file",
    });
  }

  // Sort children (folders first, then files, both alphabetically)
  sortTree(root);

  return root;
}

function sortTree(node: FileNode): void {
  if (!node.children) return;

  node.children.sort((a, b) => {
    if (a.type === b.type) return a.name.localeCompare(b.name);
    return a.type === "folder" ? -1 : 1;
  });

  node.children.forEach(sortTree);
}
