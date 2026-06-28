import * as Sentry from "@sentry/nextjs";
import { Sandbox } from "@vercel/sandbox";

const SANDBOX_ROOT = "/vercel/sandbox";

// Helper to convert ReadableStream/NodeJS stream to string
export async function streamToString(
  stream: ReadableStream<Uint8Array> | NodeJS.ReadableStream | null,
): Promise<string> {
  if (!stream) return "";

  if ("getReader" in stream) {
    const reader = stream.getReader();
    const chunks: Uint8Array[] = [];

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      chunks.push(value);
    }

    const totalLength = chunks.reduce((acc, chunk) => acc + chunk.length, 0);
    const result = new Uint8Array(totalLength);
    let offset = 0;
    for (const chunk of chunks) {
      result.set(chunk, offset);
      offset += chunk.length;
    }

    return new TextDecoder().decode(result);
  }

  const chunks: Buffer[] = [];
  for await (const chunk of stream as AsyncIterable<Buffer>) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk as Uint8Array));
  }
  return Buffer.concat(chunks).toString("utf-8");
}

export function normalizeSandboxPath(path: string): string {
  return path
    .replace(/^\/vercel\/sandbox\//, "")
    .replace(/^\.\//, "")
    .replace(/^\//, "");
}

export async function readSandboxFiles(
  sandbox: Sandbox,
): Promise<Record<string, string>> {
  const findResult = await sandbox.runCommand({
    cmd: "find",
    args: [
      ".",
      "-type",
      "f",
      "(",
      "-name",
      "*.tsx",
      "-o",
      "-name",
      "*.ts",
      "-o",
      "-name",
      "*.jsx",
      "-o",
      "-name",
      "*.js",
      "-o",
      "-name",
      "*.css",
      "-o",
      "-name",
      "*.json",
      "-o",
      "-name",
      "*.html",
      ")",
      "-not",
      "-path",
      "*/node_modules/*",
      "-not",
      "-path",
      "*/.git/*",
      "-not",
      "-path",
      "*/dist/*",
      "-not",
      "-path",
      "*/.next/*",
    ],
    cwd: SANDBOX_ROOT,
  });

  if (findResult.exitCode !== 0) {
    console.error("Failed to list files in sandbox");
    return {};
  }

  const stdout = await findResult.stdout();
  const filePaths = stdout
    .trim()
    .split("\n")
    .filter((path) => path.length > 0);

  const files: Record<string, string> = {};

  for (const fullPath of filePaths) {
    try {
      const relativePath = normalizeSandboxPath(fullPath);
      const stream = await sandbox.readFile({
        path: relativePath,
        cwd: SANDBOX_ROOT,
      });
      const content = await streamToString(stream);
      files[`/${relativePath}`] = content;
    } catch (error) {
      Sentry.captureException(error);
      console.warn(`Could not read file: ${fullPath}`, error);
    }
  }

  return files;
}
