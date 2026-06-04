/**
 * Promote a user to the single coach role.
 *
 * Usage: npx tsx scripts/seed-coach.ts coach@example.com
 *
 * ORDER-OF-OPERATIONS GATE: the trainer's profiles.role must be 'coach' BEFORE
 * any client redeems an invite — redeem_invite() inserts a coach_clients FK row
 * that points at the coach. Run this once after the coach signs up.
 *
 * Uses SUPABASE_SERVICE_ROLE_KEY (loaded from .env.local, NEVER bundled). The
 * service-role key bypasses RLS and the role-escalation guard, so it is the
 * only context allowed to change profiles.role.
 */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { createClient } from '@supabase/supabase-js';

function loadEnvLocal(): Record<string, string> {
  const env: Record<string, string> = {};
  try {
    const raw = readFileSync(resolve(process.cwd(), '.env.local'), 'utf8');
    for (const line of raw.split('\n')) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const eq = trimmed.indexOf('=');
      if (eq === -1) continue;
      env[trimmed.slice(0, eq).trim()] = trimmed.slice(eq + 1).trim();
    }
  } catch {
    // .env.local is optional when the vars are already exported.
  }
  return env;
}

async function main(): Promise<void> {
  const email = process.argv[2];
  if (!email) {
    console.error('Usage: npx tsx scripts/seed-coach.ts <coach-email>');
    process.exit(1);
  }

  const fileEnv = loadEnvLocal();
  const url = process.env.EXPO_PUBLIC_SUPABASE_URL ?? fileEnv.EXPO_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? fileEnv.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    console.error('Missing EXPO_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY (.env.local).');
    process.exit(1);
  }

  const supabase = createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data, error } = await supabase.auth.admin.listUsers();
  if (error) {
    console.error('Failed to list users:', error.message);
    process.exit(1);
  }

  const user = data.users.find((u) => u.email?.toLowerCase() === email.toLowerCase());
  if (!user) {
    console.error(`No auth user found with email ${email}. Have they signed up yet?`);
    process.exit(1);
  }

  const { error: updateError } = await supabase
    .from('profiles')
    .update({ role: 'coach' })
    .eq('id', user.id);

  if (updateError) {
    console.error('Failed to set role:', updateError.message);
    process.exit(1);
  }

  console.log(`✅ ${email} (${user.id}) is now a coach.`);
}

void main();
