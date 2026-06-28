import { db, schema } from '@/server/db';
import { eq, and } from 'drizzle-orm';
import type { Candidate } from '@/types/recruiter';

function toCandidate(row: typeof schema.candidates.$inferSelect): Candidate {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    notes: row.notes ?? undefined,
    createdAt: row.createdAt.toISOString(),
  };
}

export async function listCandidates({ ownerId }: { ownerId: string }): Promise<Candidate[]> {
  const rows = await db.select().from(schema.candidates).where(eq(schema.candidates.ownerId, ownerId));
  return rows.map(toCandidate);
}

export async function getCandidateById(id: string, { ownerId }: { ownerId: string }): Promise<Candidate | null> {
  const rows = await db.select().from(schema.candidates)
    .where(and(eq(schema.candidates.id, id), eq(schema.candidates.ownerId, ownerId)))
    .limit(1);
  return rows[0] ? toCandidate(rows[0]) : null;
}

export async function getCandidateByEmail(email: string, { ownerId }: { ownerId: string }): Promise<Candidate | null> {
  const rows = await db.select().from(schema.candidates)
    .where(and(eq(schema.candidates.email, email), eq(schema.candidates.ownerId, ownerId)))
    .limit(1);
  return rows[0] ? toCandidate(rows[0]) : null;
}

// Invite-flow lookup: access is gated by knowledge of the invite code, not recruiter ownership.
// Returns only candidate-safe fields (id, name) — never notes or other recruiter-private data.
export async function getPublicCandidatePreview(id: string): Promise<Pick<Candidate, 'id' | 'name'> | null> {
  const rows = await db.select({ id: schema.candidates.id, name: schema.candidates.name })
    .from(schema.candidates)
    .where(eq(schema.candidates.id, id))
    .limit(1);
  return rows[0] ?? null;
}

export async function createCandidate(data: {
  name: string;
  email: string;
  notes?: string;
  ownerId: string;
}): Promise<Candidate> {
  const rows = await db.insert(schema.candidates).values({
    name: data.name,
    email: data.email,
    notes: data.notes ?? null,
    ownerId: data.ownerId,
  }).returning();
  return toCandidate(rows[0]);
}

export async function upsertCandidateByEmail(data: {
  name: string;
  email: string;
  notes?: string;
  ownerId: string;
}): Promise<{ candidate: Candidate; created: boolean }> {
  // Insert-first to avoid TOCTOU: the composite unique on (owner_id, email) catches conflicts.
  try {
    const candidate = await createCandidate(data);
    return { candidate, created: true };
  } catch {
    const existing = await getCandidateByEmail(data.email, { ownerId: data.ownerId });
    if (existing) return { candidate: existing, created: false };
    throw new Error(`upsertCandidateByEmail: unexpected conflict without an existing row for ${data.email}`);
  }
}

export async function updateCandidate(
  id: string,
  updates: Partial<{ name: string; email: string; notes: string }>,
  { ownerId }: { ownerId: string }
): Promise<Candidate | null> {
  const rows = await db.update(schema.candidates)
    .set(updates)
    .where(and(eq(schema.candidates.id, id), eq(schema.candidates.ownerId, ownerId)))
    .returning();
  return rows[0] ? toCandidate(rows[0]) : null;
}

export async function deleteCandidate(id: string, { ownerId }: { ownerId: string }): Promise<boolean> {
  const rows = await db.delete(schema.candidates)
    .where(and(eq(schema.candidates.id, id), eq(schema.candidates.ownerId, ownerId)))
    .returning({ id: schema.candidates.id });
  return rows.length > 0;
}
