import { z } from "zod";

// Planner output: just a list of file paths
export const plannerOutputSchema = z.object({
  files: z.array(z.string()).max(10).describe("File paths to edit (minimum 3, maximum 10)"),
});

// Editor output: updated files with their new content
export const editorOutputSchema = z
  .object({
    files: z
      .array(
        z.object({
          path: z.string(),
          content: z.string(),
        })
      )
      .describe("Updated files with complete content"),
  })
  .describe("Object containing a list of updated files and their content");

export type PlannerOutput = z.infer<typeof plannerOutputSchema>;
export type EditorOutput = z.infer<typeof editorOutputSchema>;
