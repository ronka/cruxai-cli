/**
 * Generates a unique 12-character alphanumeric invite code
 */
export function generateInviteCode(): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let code = '';
  for (let i = 0; i < 12; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

/**
 * Builds the full invite URL from an invite code
 */
export function buildInviteUrl(inviteCode: string): string {
  const path = `/invite/${inviteCode}`;
  if (typeof window !== 'undefined') {
    return `${window.location.origin}${path}`;
  }
  // Fallback for SSR
  return path;
}
