/**
 * Rerun analysis for a submission by ID.
 *
 * Usage:
 *   tsx scripts/rerun-analysis.ts <submission-id> [--save] [--model <model-id>]
 *
 * Options:
 *   --save              Persist the analysis result to the database
 *   --model <model-id>  Override the default model (e.g. anthropic/claude-3-7-sonnet)
 */

import "dotenv/config";
import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import { generateText, Output, createGateway } from "ai";

// Load .env.local as well (dotenv/config only loads .env)
const __dirname = dirname(fileURLToPath(import.meta.url));
for (const file of [".env.local"]) {
  try {
    const content = readFileSync(resolve(__dirname, "..", file), "utf-8");
    for (const line of content.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const idx = trimmed.indexOf("=");
      if (idx === -1) continue;
      const key = trimmed.slice(0, idx);
      const val = trimmed.slice(idx + 1);
      if (!(key in process.env)) process.env[key] = val;
    }
  } catch {
    // skip missing files
  }
}

// Dynamic imports after env is loaded
const { getSubmissionById, saveAnalysis } = await import("@/server/services/submissions");
const { getQuestionById } = await import("@/server/services/questions");
const { getAnalysisPrompt } = await import("@/server/prompts");
const { analysisResponseSchema } = await import("@/server/analysisSchema");
const { getDefaultModel, getModelById } = await import("@/lib/models");
const { simplifyMessages, snapshotsToSystemMessages } = await import("@/lib/analysisUtils");

// --- Parse CLI args ---
const args = process.argv.slice(2);
const submissionId = args[0];
const saveFlag = args.includes("--save");
const modelIdx = args.indexOf("--model");
const modelOverride = modelIdx !== -1 ? args[modelIdx + 1] : undefined;

if (!submissionId) {
  console.error("Usage: tsx scripts/rerun-analysis.ts <submission-id> [--save] [--model <model-id>]");
  process.exit(1);
}

// --- Validate env ---
const apiKey = process.env.AI_GATEWAY_API_KEY;
if (!apiKey) {
  console.error("Error: AI_GATEWAY_API_KEY is not set. Check your .env or .env.local file.");
  process.exit(1);
}
if (!process.env.DATABASE_URL) {
  console.error("Error: DATABASE_URL is not set. Check your .env or .env.local file.");
  process.exit(1);
}

// --- Fetch submission ---
console.log(`Fetching submission ${submissionId}...`);
const submission = await getSubmissionById(submissionId).catch(() => null);
if (!submission) {
  console.error(`Error: Submission "${submissionId}" not found.`);
  process.exit(1);
}

const questionId = submission.questionId;
if (!questionId) {
  console.error(`Error: Submission "${submissionId}" has no associated question.`);
  process.exit(1);
}

// --- Fetch question ---
const question = await getQuestionById(questionId).catch(() => null);
if (!question) {
  console.error(`Error: Question "${questionId}" not found.`);
  process.exit(1);
}

console.log(`Question: "${question.title}" (${question.difficulty}, ${question.role})`);
console.log(`Messages: ${submission.chatMessages?.length ?? 0}`);
console.log(`Time spent: ${submission.timeSpent ?? "00:00"}`);
console.log("");

// --- Build prompt ---
const messages = submission.chatMessages ?? [];
const snapshots = (submission.snapshots ?? []).map((s: { timestamp: string | Date }) => ({
  ...s,
  timestamp: new Date(s.timestamp),
}));

const prompt = getAnalysisPrompt({
  questionTitle: question.title,
  questionDifficulty: question.difficulty,
  questionRole: question.role,
  messages: simplifyMessages(messages as Parameters<typeof simplifyMessages>[0]),
  systemMessages: snapshotsToSystemMessages(
    snapshots as Parameters<typeof snapshotsToSystemMessages>[0],
    messages as Parameters<typeof snapshotsToSystemMessages>[1]
  ),
  timeSpent: submission.timeSpent ?? "00:00",
});

// --- Select model ---
const modelId = modelOverride ?? getDefaultModel().id as string;
if (modelOverride) {
  console.log(`Using model override: ${modelId}`);
} else {
  console.log(`Using default model: ${modelId}`);
}
console.log("Running analysis...\n");

// --- Run analysis ---
const gw = createGateway({ apiKey });
const model = gw(modelId);

const { output } = await generateText({
  model,
  output: Output.object({ schema: analysisResponseSchema }),
  prompt,
});

if (!output) {
  console.error("Error: Analysis returned no output.");
  process.exit(1);
}

// --- Print human-readable output ---
const simplifiedMsgs = simplifyMessages(messages as Parameters<typeof simplifyMessages>[0]);

console.log("=".repeat(60));
console.log(`CLASSIFIED MESSAGES: ${output.messageInsights.length}`);
console.log("=".repeat(60));
console.log("");

if (!output.messageInsights || output.messageInsights.length === 0) {
  console.log("No classified messages.");
} else {
  console.log(`MESSAGE CLASSIFICATIONS (${output.messageInsights.length}):`);
  console.log("");
  for (const insight of output.messageInsights) {
    const msg = simplifiedMsgs[insight.messageIndex];
    const role = msg?.role?.toUpperCase() ?? "UNKNOWN";
    const content = msg?.content ?? "";
    const truncated = content.length > 200 ? content.slice(0, 200) + "…" : content;
    const flagStr = insight.flags.length > 0 ? insight.flags.map((f) => {
      if (f === "exemplar") return "⭐ exemplar";
      if (f === "red-flag") return "🚨 red-flag";
      if (f === "teaching-moment") return "🧠 teaching-moment";
      return f;
    }).join(", ") : "none";

    console.log(`[#${insight.messageIndex} ${role}]: ${truncated}`);
    console.log(`  Intent: ${insight.intent}  Quality: ${insight.quality}`);
    console.log(`  Flags: ${flagStr}`);
    console.log(`  Reasoning: ${insight.reasoning}`);
    console.log("");
  }
}

// --- Save if requested ---
if (saveFlag) {
  console.log("Saving analysis to database...");
  await saveAnalysis(submissionId, {
    messageInsights: output.messageInsights ?? [],
  });
  console.log("Saved.");
} else {
  console.log("(Run with --save to persist this result to the database)");
}
