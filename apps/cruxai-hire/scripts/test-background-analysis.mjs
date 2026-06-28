/**
 * End-to-end test for the background analysis flow.
 * Creates a submission, then submits session data to the /session/background
 * endpoint which triggers runBackgroundAnalysis via after().
 *
 * Requires the dev server running: npm run dev
 *
 * Usage:
 *   node scripts/test-background-analysis.mjs
 *   QUESTION_ID=<uuid> node scripts/test-background-analysis.mjs
 */

import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

// Load .env files
function loadEnv() {
  for (const file of [".env"]) {
    try {
      const content = readFileSync(resolve(__dirname, "..", file), "utf-8");
      for (const line of content.split("\n")) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith("#")) continue;
        const idx = trimmed.indexOf("=");
        if (idx === -1) continue;
        process.env[trimmed.slice(0, idx)] ??= trimmed.slice(idx + 1);
      }
    } catch {
      // skip
    }
  }
}

loadEnv();

const BASE_URL = process.env.BASE_URL || "http://localhost:3000";
const ROLE_ID = process.env.ROLE_ID || "1e62a2e8-0282-52b5-8323-6c951a362c89";

// --- Step 0: Find a valid questionId from the role ---
let questionId = process.env.QUESTION_ID;
if (!questionId) {
  console.log(`Fetching questions for role ${ROLE_ID}...\n`);
  const roleRes = await fetch(`${BASE_URL}/api/roles/${ROLE_ID}`).catch(() => null);
  if (!roleRes || !roleRes.ok) {
    console.error(`Failed to fetch role ${ROLE_ID}. Is the dev server running?`);
    process.exit(1);
  }
  const role = await roleRes.json();
  if (!role.questionIds?.length) {
    console.error(`Role "${role.title}" has no questions assigned.`);
    process.exit(1);
  }
  questionId = role.questionIds[0];
  console.log(`Using role: "${role.title}"`);
  console.log(`Using question: ${questionId}\n`);
}

// --- Step 1: Create a submission ---
console.log("Step 1: Creating submission...");
const createRes = await fetch(`${BASE_URL}/api/submissions`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ questionId }),
});

if (!createRes.ok) {
  console.error("Failed to create submission:", await createRes.text());
  process.exit(1);
}

const submission = await createRes.json();
console.log(`  Created submission: ${submission.id} (status: ${submission.status})\n`);

// --- Step 2: Submit session data + trigger background analysis ---
console.log("Step 2: Submitting session to /session/background...");

const sessionPayload = {
  chatMessages: [
    {
      id: "msg-1",
      role: "user",
      parts: [{ type: "text", text: "The board is showing 'loading board...' forever" }],
      createdAt: new Date().toISOString(),
    },
    {
      id: "msg-2",
      role: "assistant",
      parts: [
        {
          type: "text",
          text: "The board keeps showing \"Loading board...\" because board data is never loaded from the API.\n\n- The Redux `boardSlice` is missing async thunks to fetch and set board data.\n- No code calls `getBoard()` on mount.\n\nTo fix: dispatch a `fetchBoard` thunk on mount of `BoardView`. Want me to implement this?",
        },
      ],
      createdAt: new Date().toISOString(),
    },
    {
      id: "msg-3",
      role: "user",
      parts: [{ type: "text", text: "yes implement it" }],
      createdAt: new Date().toISOString(),
    },
    {
      id: "msg-4",
      role: "assistant",
      parts: [
        {
          type: "text",
          text: "Done. Added `fetchBoard` async thunk to `boardSlice` and dispatched it on mount in `BoardView`. The board now loads data from the API.",
        },
      ],
      createdAt: new Date().toISOString(),
    },
  ],
  snapshots: [
    {
      type: "checkpoint-created",
      timestamp: new Date().toISOString(),
      label: "12:00 PM",
      afterMessageIndex: 1,
      isManualEdit: false,
    },
    {
      type: "checkpoint-created",
      timestamp: new Date().toISOString(),
      label: "12:01 PM",
      afterMessageIndex: 3,
      isManualEdit: false,
    },
  ],
  initialFiles: {},
  finalFiles: {},
  timeSpent: "02:30",
  timeExceeded: false,
  messageCount: 4,
};

const bgRes = await fetch(`${BASE_URL}/api/submissions/${submission.id}/session/background`, {
  method: "PUT",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(sessionPayload),
});

if (!bgRes.ok) {
  console.error("Failed to submit session:", await bgRes.text());
  process.exit(1);
}

const updated = await bgRes.json();
console.log(`  Session submitted (status: ${updated.status})`);
console.log(`  Background analysis triggered via after()\n`);

// --- Step 3: Poll for completion ---
console.log("Step 3: Polling for analysis result...");
const maxWait = 120_000; // 2 minutes
const pollInterval = 3_000;
const start = Date.now();

while (Date.now() - start < maxWait) {
  await new Promise((r) => setTimeout(r, pollInterval));
  const pollRes = await fetch(`${BASE_URL}/api/submissions/${submission.id}`);
  if (!pollRes.ok) {
    console.error("  Poll failed:", pollRes.status);
    continue;
  }
  const current = await pollRes.json();
  const elapsed = ((Date.now() - start) / 1000).toFixed(0);
  console.log(`  [${elapsed}s] status: ${current.status}`);

  if (current.status === "reviewed" && current.analysisResult) {
    console.log(`\nAnalysis complete in ${elapsed}s`);
    console.log("Overall score:", current.analysisResult.overallScore);
    console.log("Message insights:", current.analysisResult.messageInsights?.length ?? 0);
    if (current.analysisResult.messageInsights?.length > 0) {
      current.analysisResult.messageInsights.forEach((i) =>
        console.log(`  [msg ${i.messageIndex}] ${i.tags?.join(", ")} - ${i.reasoning}`)
      );
    }
    process.exit(0);
  }

  if (current.status === "submitted") {
    // Reverted to submitted = analysis failed, check server logs
    console.error(`\nAnalysis failed (status reverted to "submitted"). Check server logs for [runBackgroundAnalysis] errors.`);
    process.exit(1);
  }
}

console.error(`\nTimed out after ${maxWait / 1000}s. Check server logs for [runBackgroundAnalysis] output.`);
process.exit(1);
