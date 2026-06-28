import { auth } from '@/lib/auth';
import { headers } from 'next/headers';

export async function createTRPCContext() {
  const hdrs = await headers();
  const requestId = crypto.randomUUID();

  return {
    headers: hdrs,
    requestId,
    getSession: () => auth.api.getSession({ headers: hdrs }),
  };
}

export type TRPCContext = Awaited<ReturnType<typeof createTRPCContext>>;
