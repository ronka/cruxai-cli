/**
 * Integration test for the /api/analysis endpoint.
 * Requires the dev server running: npm run dev
 *
 * Usage:
 *   node scripts/test-analysis.mjs
 *   BASE_URL=http://localhost:3000 node scripts/test-analysis.mjs
 */

import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

// Load .env file manually
function loadEnv() {
  try {
    const envPath = resolve(__dirname, "../.env.local");
    const content = readFileSync(envPath, "utf-8");
    for (const line of content.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const idx = trimmed.indexOf("=");
      if (idx === -1) continue;
      const key = trimmed.slice(0, idx);
      const val = trimmed.slice(idx + 1);
      process.env[key] ??= val;
    }
  } catch {
    // fall through to .env
  }
  try {
    const envPath = resolve(__dirname, "../.env");
    const content = readFileSync(envPath, "utf-8");
    for (const line of content.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const idx = trimmed.indexOf("=");
      if (idx === -1) continue;
      const key = trimmed.slice(0, idx);
      const val = trimmed.slice(idx + 1);
      process.env[key] ??= val;
    }
  } catch {
    // no .env either
  }
}

loadEnv();

const BASE_URL = process.env.BASE_URL || "http://localhost:3000";
const API_KEY = process.env.AI_GATEWAY_API_KEY;

if (!API_KEY) {
  console.error("❌ AI_GATEWAY_API_KEY not found in .env or environment");
  process.exit(1);
}

const payload = {
  "messages": [
    {
      "role": "user",
      "content": "why the board is showing \"loading board...\""
    },
    {
      "role": "assistant",
      "content": "- The board keeps showing \"Loading board...\" because board data is never loaded from the API.\n- The Redux `boardSlice` is missing async thunks to fetch and set board data in state.\n- No code is calling `getBoard()` (in `/src/api/boardApi.ts`) on mount to populate the board.\n- `BoardView` renders loading UI if `board` is `null`, which never changes due to above.\n\nTo fix: Implement and dispatch a thunk in `boardSlice` (e.g. `fetchBoard`) to load board data from `getBoard()` on mount of `BoardView`. Would you like me to implement this?"
    },
    {
      "role": "user",
      "content": "yes implement it"
    },
    {
      "role": "assistant",
      "content": "- Added `fetchBoard` thunk to load board data from the API in `boardSlice`.\n- Hooked thunk into extraReducers to track loading/error/board.\n- Dispatches `fetchBoard` on initial render in `BoardView`.\n- Loading and error UI shown based on state.\n- `BoardView` will now show the actual board. Other board actions are stubbed for now."
    },
    {
      "role": "user",
      "content": "add estimation column"
    },
    {
      "role": "assistant",
      "content": "- Added \"Estimation\" column to header and rows in `GroupSection`.\n- Modified `TaskRow` to show and allow editing of the `estimation` field using a `TextCell`.\n- Users can now view/edit task estimations directly in the board."
    }
  ],
  "systemMessages": [
    {
      "type": "checkpoint-created",
      "timestamp": "2026-03-14T15:49:26.908Z",
      "label": "5:49 PM",
      "afterMessageIndex": 1,
      "isManualEdit": false
    },
    {
      "type": "checkpoint-created",
      "timestamp": "2026-03-14T15:49:49.022Z",
      "label": "5:49 PM",
      "afterMessageIndex": 3,
      "isManualEdit": false
    },
    {
      "type": "checkpoint-created",
      "timestamp": "2026-03-14T15:50:26.538Z",
      "label": "5:50 PM",
      "afterMessageIndex": 5,
      "isManualEdit": false
    }
  ],
  "questionId": "001",
  "timeSpent": "01:56",
  "apiKey": ""
};

console.log(`\nPOST ${BASE_URL}/api/analysis`);
console.log("Payload questionId:", payload.questionId);
console.log("Messages:", payload.messages.length);
console.log("Waiting for response...\n");

const start = Date.now();
let res;
try {
  res = await fetch(`${BASE_URL}/api/analysis`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
} catch (err) {
  console.error(`❌ Could not connect to ${BASE_URL}`);
  console.error("   Is the dev server running? (npm run dev)");
  console.error("  ", err.message);
  process.exit(1);
}

const elapsed = ((Date.now() - start) / 1000).toFixed(1);
const body = await res.json();

if (!res.ok) {
  console.error(`❌ HTTP ${res.status} (${elapsed}s)`);
  console.error(JSON.stringify(body, null, 2));
  process.exit(1);
}

// Validate shape
const errors = [];
if (!Array.isArray(body.skills) || body.skills.length !== 3) errors.push("skills must be array of 3");
if (typeof body.overallScore !== "number") errors.push("overallScore must be a number");
if (!body.levelAssessment || typeof body.levelAssessment.fits !== "boolean") errors.push("levelAssessment.fits must be boolean");
if (!Array.isArray(body.messageInsights)) errors.push("messageInsights must be array");

if (errors.length > 0) {
  console.error(`❌ Response shape invalid (${elapsed}s):`);
  errors.forEach((e) => console.error("  -", e));
  console.error("\nFull response:");
  console.error(JSON.stringify(body, null, 2));
  process.exit(1);
}

console.log(`✅ Success (${elapsed}s)\n`);
console.log("Overall score:", body.overallScore);
console.log("Skills:");
body.skills.forEach((s) => console.log(`  ${s.name}: ${s.score}/100 — ${s.description}`));
console.log("Level fits:", body.levelAssessment.fits, "—", body.levelAssessment.message);
console.log("Message insights:", body.messageInsights.length);
if (body.messageInsights.length > 0) {
  body.messageInsights.forEach((i) =>
    console.log(`  [${i.messageIndex}] ${i.tags.join(", ")} — ${i.reasoning}`)
  );
}
