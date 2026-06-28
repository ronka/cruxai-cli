import * as Sentry from "@sentry/nextjs";
import { tool, type UIToolInvocation } from "ai";
import { z } from "zod";
import { Sandbox } from "@vercel/sandbox";
import { normalizeSandboxPath, streamToString } from "@/lib/sandbox";

export function createListFilesTool(currentFiles: Record<string, string>) {
  return tool({
    description: "List all available files in the project. Use this to discover what files exist before reading them.",
    inputSchema: z.object({}),
    execute: async () => {
      console.log("[TOOL: listFiles] Called");
      const fileList = Object.keys(currentFiles);
      console.log("[TOOL: listFiles] Returning", fileList.length, "files");
      return { files: fileList };
    },
  });
}

export function createReadFilesTool(currentFiles: Record<string, string>) {
  return tool({
    description: "Read the contents of one or more files. Use this when you need to see file contents to answer the user's question or make changes.",
    inputSchema: z.object({
      filePaths: z.array(z.string()).describe("Array of file paths to read, e.g., ['/App.tsx', '/styles.css']"),
    }),
    execute: async ({ filePaths }) => {
      console.log("[TOOL: readFiles] Called with paths:", filePaths);
      const contents: Record<string, string> = {};
      for (const path of filePaths) {
        if (currentFiles[path]) {
          contents[path] = currentFiles[path];
          console.log("[TOOL: readFiles] Read file:", path, "- length:", currentFiles[path].length);
        } else {
          contents[path] = "Error: File not found";
          console.log("[TOOL: readFiles] File not found:", path);
        }
      }
      return contents;
    },
  });
}

export function createUpdateCodeTool(sandboxId?: string) {
  return tool({
    description: "Update or create a file in the Sandpack editor. Use this tool to modify code files based on user requests.",
    inputSchema: z.object({
      filePath: z.string().describe("The file path to update, e.g., '/App.tsx', '/styles.css', '/index.tsx'"),
      code: z.string().describe("The complete file content to write. Include all necessary imports, types, and code."),
    }),
    execute: async ({ filePath, code }) => {
      console.log("[TOOL: updateCode] Called with filePath:", filePath, "- code length:", code.length);
      console.log("[TOOL: updateCode] Has sandboxId:", !!sandboxId);
      let previousCode = "";

      // Write file to sandbox if sandboxId is provided
      if (sandboxId) {
        try {
          console.log("[TOOL: updateCode] Getting sandbox:", sandboxId);
          const sandbox = await Sandbox.get({ sandboxId });
          const normalizedPath = normalizeSandboxPath(filePath);

          const existingFile = await sandbox.readFile({ path: normalizedPath });
          previousCode = await streamToString(existingFile);

          console.log("[TOOL: updateCode] Writing to normalized path:", normalizedPath);
          await sandbox.writeFiles([
            {
              path: normalizedPath,
              content: Buffer.from(code, "utf-8"),
            },
          ]);
          console.log("[TOOL: updateCode] File written successfully to sandbox");
        } catch (error) {
          Sentry.captureException(error);
          console.error("[TOOL: updateCode] Failed to write file to sandbox:", error);
          return { filePath, code, previousCode, success: false, error: String(error) };
        }
      }

      // Return the data for client-side store sync
      console.log("[TOOL: updateCode] Returning success");
      return { filePath, code, previousCode, success: true };
    },
  });
}

export type UpdateCodeToolInvocation = UIToolInvocation<ReturnType<typeof createUpdateCodeTool>>;
