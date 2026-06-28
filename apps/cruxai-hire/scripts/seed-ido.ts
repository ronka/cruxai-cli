import 'dotenv/config';
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { eq } from 'drizzle-orm';
import { v5 as uuidv5 } from 'uuid';
import * as schema from '../src/server/db/schema';
import { user as authUser } from '../src/lib/auth-schema';
import { auth } from '../src/lib/auth';

const SEED_NAMESPACE = '6ba7b810-9dad-11d1-80b4-00c04fd430c8';
const toUuid = (legacyId: string) => uuidv5(legacyId, SEED_NAMESPACE);

const sql = neon(process.env.DATABASE_URL!);
const db = drizzle(sql, { schema });

const IDO = { name: 'Ido Pelles', email: 'ido@pelles.ai', password: 'ido123crux' };

async function main() {
  let userId: string | undefined;
  try {
    const result = await auth.api.signUpEmail({ body: IDO });
    userId = result.user?.id;
    console.log(`✓ Created user: ${IDO.email}`, userId);
  } catch (e) {
    console.warn(`User may already exist, looking up by email…`, (e as Error).message);
  }

  if (!userId) {
    const existing = await db.select({ id: authUser.id }).from(authUser).where(eq(authUser.email, IDO.email)).limit(1);
    userId = existing[0]?.id;
  }

  if (!userId) {
    console.error('Could not resolve user id for', IDO.email);
    process.exit(1);
  }

  const questionId = toUuid(`q-monday-${IDO.email}`);
  await db.insert(schema.questions).values({
    id: questionId,
    title: 'Extend Monday board to add estimations column with shorthand normalization',
    description: 'Extend an existing Monday.com-style board by adding an estimations column that accepts and normalizes shorthand time notation.',
    role: 'frontend',
    difficulty: 'medium',
    status: 'published',
    repositoryUrl: 'https://github.com/ronka/cruxai-monday-question.git',
    startingBranch: 'main',
    targetBranch: 'solution',
    timeLimitValue: 60,
    timeLimitUnit: 'minutes',
    hardStop: false,
    allowedModels: [],
    ownerId: userId,
    isPublic: false,
  }).onConflictDoNothing();

  console.log(`✓ Seeded Monday question (${questionId}) owned by ${IDO.email}`);

  const roleId = toUuid(`role-monday-${IDO.email}`);
  await db.insert(schema.jobRoles).values({
    id: roleId,
    title: 'Frontend Engineer - Monday Board',
    description: '',
    ownerId: userId,
    status: 'open',
  }).onConflictDoNothing();

  await db.insert(schema.roleQuestionAssignments).values({
    roleId,
    questionId,
    position: 0,
  }).onConflictDoNothing();

  console.log(`✓ Seeded role (${roleId}) with question attached`);
  process.exit(0);
}

main().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
