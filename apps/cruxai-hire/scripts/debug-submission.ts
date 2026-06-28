import { neon } from '@neondatabase/serverless';
import { readFileSync } from 'node:fs';

for (const line of readFileSync('/Users/ronkantor/Projects/cruxai/.env', 'utf8').split('\n')) {
  const m = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/);
  if (m) process.env[m[1]] ??= m[2].replace(/^"(.*)"$/, '$1');
}

import { submissionToSession } from '@/server/services/rule-engine-adapter';
import { createRuleEngine } from '@/rule-engine';
import { rules } from '@/rules/rules';
import { scoreFindings } from '@/rule-engine/scoring';

const SUB_ID = '40c9569b-124b-4247-9309-5e9dfc97fd33';

async function main() {
  const sql = neon(process.env.DATABASE_URL!);
  const rows = (await sql`SELECT * FROM submissions WHERE id = ${SUB_ID}`) as any[];
  const row = rows[0];

  const submission: any = {
    id: row.id,
    chatMessages: row.chat_messages ?? [],
  };
  const session = submissionToSession(submission);

  console.log('\n=== adapter output ===');
  for (let i = 0; i < session.requests.length; i++) {
    const r = session.requests[i];
    const aiLoc = r.aiCode.reduce((s, c) => s + c.loc, 0);
    console.log(
      `req[${i}] len=${r.messageLength} canceled=${r.isCanceled} elapsed(ms)=${r.totalElapsed} model="${r.modelId}" aiBlocks=${r.aiCode.length} aiLoc=${aiLoc} text="${r.messageText.slice(0,60).replace(/\n/g,' ')}"`
    );
  }

  const engine = createRuleEngine({ rules });
  const findings = engine.analyze(session);
  const score = scoreFindings(findings, {
    registeredGroups: Array.from(new Set(engine.getRules().map(r => r.group))),
  });

  console.log('\n=== findings:', findings.length, '===');
  for (const f of findings) console.log(' -', f.ruleId, ':', f.description);

  console.log('\n=== score ===');
  console.log('overall:', score.overall, 'grade:', score.grade);

  console.log('\n=== per-rule trace ===');
  for (const rule of rules) {
    const f = engine.analyzeOne(session, rule.id);
    console.log(`${rule.id} -> ${f ? 'FIRED: ' + f.description.slice(0,90) : 'no finding'}`);
  }

  const reqs = session.requests;
  const total = reqs.length;
  const short30 = reqs.filter(r => r.messageLength > 0 && r.messageLength < 30).length;
  const slow = reqs.filter(r => r.totalElapsed != null && r.totalElapsed > 120000).length;
  const canceled = reqs.filter(r => r.isCanceled).length;
  const aiLoc = reqs.reduce((s, r) => s + r.aiCode.reduce((a, b) => a + b.loc, 0), 0);
  const modelCounts: Record<string, number> = {};
  for (const r of reqs) modelCounts[r.modelId || '(empty)'] = (modelCounts[r.modelId || '(empty)'] ?? 0) + 1;

  console.log('\n=== aggregate ===');
  console.log(`total=${total}`);
  console.log(`short(<30)=${short30} (${(short30/total*100).toFixed(1)}%)  lazy-prompting needs > 30%`);
  console.log(`slow(>120s)=${slow}  slow-responses needs > 3`);
  console.log(`canceled=${canceled} (${(canceled/total*100).toFixed(1)}%)  high-cancellation needs > 15%`);
  console.log(`aiLoc total=${aiLoc}  vibe-coding needs aiLoc>=100 AND prompts<=8 (prompts=${total})`);
  console.log('models seen:', modelCounts);
}

main().catch((e) => { console.error(e); process.exit(1); });
