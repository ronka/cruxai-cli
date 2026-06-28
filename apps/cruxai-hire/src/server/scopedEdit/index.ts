import type { LanguageModel } from "ai";
import { planFiles } from "./planner";
import { editFiles } from "./editor";

export async function performScopedEdit(
  userMessage: string,
  currentFiles: Record<string, string>,
  model: LanguageModel
): Promise<Record<string, string>> {
  // Pass 1: Get list of files to edit
  const filesToEdit = await planFiles(
    userMessage,
    Object.keys(currentFiles),
  );

  // If no files selected, return original files
  if (filesToEdit.length === 0) {
    return currentFiles;
  }

  // Extract selected files
  const selectedFiles: Record<string, string> = {};
  for (const filePath of filesToEdit) {
    if (currentFiles[filePath]) {
      selectedFiles[filePath] = currentFiles[filePath];
    }
  }

  // Pass 2: Edit the selected files
  const updatedFiles = await editFiles(userMessage, selectedFiles, model);

  // Combine updated files with unchanged files
  return {
    ...currentFiles,
    ...updatedFiles,
  };
}
