import { generateText, Output, type LanguageModel } from "ai";
import { editorOutputSchema } from "./schemas";

export async function editFiles(
  userMessage: string,
  selectedFiles: Record<string, string>,
  model: LanguageModel
): Promise<Record<string, string>> {
  console.log("[Scoped Edit Editor] Selected files:", Object.keys(selectedFiles).length > 0 ? Object.keys(selectedFiles) : "None (no edits needed)");

  const filesContent = Object.entries(selectedFiles)
    .map(([path, content]) => `## ${path}\n\`\`\`\n${content}\n\`\`\``)
    .join("\n\n");

  const prompt = `Edit the following files to fulfill the user's request. Return the complete updated content for each file.

User Message: "${userMessage}"

Files to Edit:
${filesContent}

Return a JSON object with a "files" array. Each item should have "path" and "content" fields for the updated file.`;

  console.log("[Scoped Edit Editor] Prompt:", prompt.slice(0, 100) + "...");

  const { output } = await generateText({
    model,
    output: Output.object({
      schema: editorOutputSchema,
    }),
    prompt,
  });

  console.log("[Scoped Edit Editor] Output:", output?.files.length > 0 ? output?.files : "None (no edits needed)");

  if (!output?.files) {
    return {};
  }

  return Object.fromEntries(
    output.files.map((file) => [file.path, file.content])
  );
}
