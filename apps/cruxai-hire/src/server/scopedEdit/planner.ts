import { generateText, Output, gateway } from "ai";
import { plannerOutputSchema } from "./schemas";

export async function planFiles(
  userMessage: string,
  fileNames: string[],
): Promise<string[]> {
  console.log("[Scoped Edit Planner] User message:", userMessage);
  console.log("[Scoped Edit Planner] Available files:", fileNames.length, "files");

  const fileList = fileNames.join("\n");

  const prompt = `Given the user's message and available files,
  select which files need to be edited (minimum 3 files, maximum 10 files).

User Message: "${userMessage}"

Available Files:
${fileList}

Return a JSON array of file paths that need to be edited to fulfill the user's request.
Only include files that will be modified. Minimum 3 files, maximum 10 files.`;

  const { output } = await generateText({
    model: gateway('meta/llama-4-scout'),
    output: Output.object({
      schema: plannerOutputSchema,
    }),
    prompt,
  });

  const selectedFiles = output?.files || [];

  console.log("[Scoped Edit Planner] Selected files:", selectedFiles.length > 0 ? selectedFiles : "None (no edits needed)");

  return selectedFiles;
}
