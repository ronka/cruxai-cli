import { auth } from '@/lib/auth';
import { NextResponse } from 'next/server';
import { headers } from 'next/headers';

export type SessionUser = {
  id: string;
  name: string;
  email: string;
  role: string;
};

type AuthGuardResult =
  | { ok: true; user: SessionUser }
  | { ok: false; response: NextResponse };

export async function requireSession(): Promise<AuthGuardResult> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) {
    return {
      ok: false,
      response: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }),
    };
  }
  return { ok: true, user: session.user as SessionUser };
}

export async function requireRecruiter(): Promise<AuthGuardResult> {
  const result = await requireSession();
  if (!result.ok) return result;
  if (result.user.role !== 'recruiter') {
    return {
      ok: false,
      response: NextResponse.json({ error: 'Forbidden' }, { status: 403 }),
    };
  }
  return result;
}
