/**
 * Seed rich sample content for EVERY existing coach and client account, not
 * just a hardcoded demo pair. For each coach: 12 exercises, 4 workouts, a
 * 4-week plan, 6 tips, and 2 invite codes (unique per coach). For each client
 * linked to a coach via an active `coach_clients` row: the coach's plan
 * assigned + 10 logged training sessions with realistic set/rep/weight data.
 *
 * Run:  node scripts/seed-all-accounts.mjs
 * (Plain .mjs so it runs on bare `node` — no tsx, no npm/npx shim, which the
 *  `&` in this project's path breaks.)
 *
 * Needs SUPABASE_SERVICE_ROLE_KEY in .env.local (bypasses RLS).
 *
 * Idempotent per coach: re-running resets that coach's plans/workouts/
 * exercises/tips/invites (cascades clear old assignments/logs too) and
 * rebuilds them, then reassigns + re-logs progress for every client linked to
 * that coach. Clients with no coach link are reported and left untouched.
 */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { createClient } from '@supabase/supabase-js';

const DAY_MS = 86_400_000;

function loadEnvLocal() {
  const env = {};
  for (const file of ['.env.local', '.env']) {
    try {
      const raw = readFileSync(resolve(process.cwd(), file), 'utf8');
      for (const line of raw.split('\n')) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#')) continue;
        const eq = trimmed.indexOf('=');
        if (eq === -1) continue;
        const key = trimmed.slice(0, eq).trim();
        if (!(key in env)) env[key] = trimmed.slice(eq + 1).trim();
      }
    } catch {
      // file optional
    }
  }
  return env;
}

function die(msg) {
  console.error(`\n❌ ${msg}\n`);
  process.exit(1);
}

const fileEnv = loadEnvLocal();
const url = process.env.EXPO_PUBLIC_SUPABASE_URL ?? fileEnv.EXPO_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? fileEnv.SUPABASE_SERVICE_ROLE_KEY;

if (!url) die('Missing EXPO_PUBLIC_SUPABASE_URL.');
if (!serviceKey) {
  die(
    'Missing SUPABASE_SERVICE_ROLE_KEY.\n' +
      '   Add it to .env.local (Supabase Dashboard → Project Settings → API →\n' +
      '   "service_role" / secret key, looks like sb_secret_...). NEVER commit it.',
  );
}

const supabase = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

function check(error, what) {
  if (error) die(`${what}: ${error.message}`);
}

async function insertReturning(table, rows, columns = 'id') {
  const { data, error } = await supabase.from(table).insert(rows).select(columns);
  check(error, `insert ${table}`);
  return data;
}

const EXERCISE_DEFS = [
  ['Back Squat', 'Barbell back squat — full depth, brace your core.', 'Legs', 'Barbell', 'ultWZbUMPL8'],
  ['Bench Press', 'Flat barbell bench press, controlled tempo.', 'Chest', 'Barbell', 'rT7DgCr-3pg'],
  ['Deadlift', 'Conventional deadlift from the floor.', 'Back', 'Barbell', 'op9kVnSso6Q'],
  ['Overhead Press', 'Standing strict barbell press.', 'Shoulders', 'Barbell', '2yjwXTZQDDI'],
  ['Pull-Up', 'Dead-hang pull-up, full range.', 'Back', 'Bodyweight', 'eGo4IYlbE5g'],
  ['Barbell Row', 'Bent-over barbell row to the lower ribs.', 'Back', 'Barbell', 'kBWAon7ItDw'],
  ['Dumbbell Lunge', 'Walking lunge with dumbbells.', 'Legs', 'Dumbbell', 'D7KaRcUTQeE'],
  ['Romanian Deadlift', 'Hip-hinge RDL, soft knees, feel the hamstrings.', 'Hamstrings', 'Barbell', 'JCXUYuzwNrM'],
  ['Incline Dumbbell Press', 'Incline press for upper chest.', 'Chest', 'Dumbbell', '8iPEnn-ltC8'],
  ['Lat Pulldown', 'Wide-grip lat pulldown to the collarbone.', 'Back', 'Cable', 'CAwf7n6Luuc'],
  ['Plank', 'Front plank — straight line, glutes tight.', 'Core', 'Bodyweight', 'pSHjTRCQxIw'],
  ['Bicep Curl', 'Standing dumbbell curl, no swinging.', 'Arms', 'Dumbbell', 'ykJmrZ5v0Oo'],
];

const WORKOUT_DEFS = [
  {
    name: 'Upper Body A',
    notes: 'Push/pull upper-body session.',
    items: [
      ['Bench Press', 4, 6, 120, '60–70 kg'],
      ['Overhead Press', 3, 8, 90, '35–45 kg'],
      ['Barbell Row', 4, 8, 90, '50–60 kg'],
      ['Incline Dumbbell Press', 3, 10, 75, '18–24 kg'],
      ['Bicep Curl', 3, 12, 60, '10–14 kg'],
    ],
  },
  {
    name: 'Lower Body A',
    notes: 'Squat-focused lower-body session.',
    items: [
      ['Back Squat', 5, 5, 150, '80–100 kg'],
      ['Romanian Deadlift', 3, 8, 120, '60–80 kg'],
      ['Dumbbell Lunge', 3, 12, 90, '14–20 kg'],
      ['Plank', 3, 1, 60, '45–60 s hold'],
    ],
  },
  {
    name: 'Pull Day',
    notes: 'Posterior-chain and back volume.',
    items: [
      ['Deadlift', 4, 5, 180, '100–120 kg'],
      ['Pull-Up', 4, 8, 90, 'Bodyweight'],
      ['Barbell Row', 3, 10, 90, '45–55 kg'],
      ['Lat Pulldown', 3, 12, 75, '45–60 kg'],
      ['Bicep Curl', 3, 12, 60, '10–14 kg'],
    ],
  },
  {
    name: 'Full Body Starter',
    notes: 'Balanced full-body day.',
    items: [
      ['Back Squat', 3, 8, 120, '60–80 kg'],
      ['Bench Press', 3, 8, 90, '50–60 kg'],
      ['Barbell Row', 3, 10, 90, '45–55 kg'],
      ['Plank', 3, 1, 60, '45 s hold'],
    ],
  },
];

// day_of_week 0=Sun … 6=Sat. null workout = rest day.
const WEEK_TEMPLATE = [null, 'Upper Body A', null, 'Lower Body A', null, 'Pull Day', 'Full Body Starter'];
const DURATION_WEEKS = 4;

const TIP_BODIES = [
  'Consistency beats intensity. Three solid sessions a week, every week, will out-build the occasional heroic workout.',
  'Progressive overload is the whole game: add a little weight, a rep, or a set over time. Track it so you can see it.',
  'Sleep is your cheapest performance enhancer. Aim for 7–9 hours — recovery is when the muscle is actually built.',
  'Protein target: roughly 1.6–2.2 g per kg of bodyweight per day. Spread it across your meals.',
  'Warm up the movement, not just the muscle. Two or three lighter ramp-up sets before your working weight.',
  'Form first, ego last. A clean rep at a lighter weight beats a sloppy rep that gets you hurt.',
];

const SAMPLE_NOTES = [
  'Felt strong today, all sets clean.',
  'Last set was a grind but hit the reps.',
  'Lower back a little tight — kept the weight conservative.',
  'Great pump, added 2.5 kg on the main lift.',
  null,
  'Short on time, cut rest periods.',
];

async function seedCoachContent(coachId, coachLabel) {
  console.log(`\n— Coach: ${coachLabel} (${coachId})`);

  for (const table of ['plans', 'workouts', 'exercises', 'tips', 'coach_invites']) {
    const { error } = await supabase.from(table).delete().eq('coach_id', coachId);
    check(error, `reset ${table}`);
  }

  const exerciseRows = await insertReturning(
    'exercises',
    EXERCISE_DEFS.map(([name, description, muscle_group, equipment, vid]) => ({
      coach_id: coachId,
      name,
      description,
      muscle_group,
      equipment,
      video_url: `https://www.youtube.com/watch?v=${vid}`,
    })),
    'id,name',
  );
  const ex = Object.fromEntries(exerciseRows.map((r) => [r.name, r.id]));
  console.log(`  • ${exerciseRows.length} exercises`);

  const workout = {};
  for (const def of WORKOUT_DEFS) {
    const [row] = await insertReturning(
      'workouts',
      [{ coach_id: coachId, name: def.name, notes: def.notes }],
      'id,name',
    );
    workout[def.name] = row.id;
    const weRows = def.items.map(([exName, sets, reps, rest_seconds, weight_hint], i) => ({
      workout_id: row.id,
      exercise_id: ex[exName],
      position: i,
      sets,
      reps,
      rest_seconds,
      weight_hint,
    }));
    const { error } = await supabase.from('workout_exercises').insert(weRows);
    check(error, `workout_exercises(${def.name})`);
  }
  console.log(`  • ${WORKOUT_DEFS.length} workouts with exercises`);

  const [plan] = await insertReturning(
    'plans',
    [
      {
        coach_id: coachId,
        name: '4-Week Strength Builder',
        duration_weeks: DURATION_WEEKS,
        description:
          'A 4-day strength split: upper, lower, pull, and a full-body day. ' +
          'Progress the weight each week while keeping reps in range.',
      },
    ],
    'id',
  );

  const planDayRows = [];
  for (let week = 1; week <= DURATION_WEEKS; week += 1) {
    for (let dow = 0; dow <= 6; dow += 1) {
      const wName = WEEK_TEMPLATE[dow];
      planDayRows.push({
        plan_id: plan.id,
        week_number: week,
        day_of_week: dow,
        workout_id: wName ? workout[wName] : null,
      });
    }
  }
  const planDays = await insertReturning('plan_days', planDayRows, 'id,week_number,day_of_week,workout_id');
  console.log(`  • plan "4-Week Strength Builder" with ${planDays.length} days`);

  const { error: tipsErr } = await supabase
    .from('tips')
    .insert(TIP_BODIES.map((body) => ({ coach_id: coachId, body })));
  check(tipsErr, 'tips');

  const expires = new Date(Date.now() + 60 * DAY_MS).toISOString();
  const codeSuffix = coachId.replace(/-/g, '').slice(0, 6).toUpperCase();
  const inviteCodes = [`WELCOME${codeSuffix}`, `TRYIT${codeSuffix}`];
  const { error: invErr } = await supabase.from('coach_invites').insert(
    inviteCodes.map((code) => ({ code, coach_id: coachId, single_use: true, expires_at: expires })),
  );
  check(invErr, 'coach_invites');
  console.log(`  • ${TIP_BODIES.length} tips, invite codes: ${inviteCodes.join(', ')}`);

  const { data: weAll, error: weErr } = await supabase
    .from('workout_exercises')
    .select('workout_id,exercise_id,position,sets,reps')
    .in('workout_id', Object.values(workout));
  check(weErr, 'load workout_exercises');
  const exByWorkout = {};
  for (const r of weAll) (exByWorkout[r.workout_id] ??= []).push(r);
  for (const list of Object.values(exByWorkout)) list.sort((a, b) => a.position - b.position);

  return { planId: plan.id, planDays, exByWorkout };
}

async function seedClientProgress(clientId, clientLabel, { planId, planDays, exByWorkout }) {
  const startDate = new Date(Date.now() - 18 * DAY_MS);
  const startDateStr = startDate.toISOString().slice(0, 10);

  const [assignment] = await insertReturning(
    'plan_assignments',
    [{ plan_id: planId, client_id: clientId, start_date: startDateStr, status: 'active' }],
    'id',
  );

  const trainingDays = planDays
    .filter((d) => d.workout_id)
    .sort((a, b) => a.week_number - b.week_number || a.day_of_week - b.day_of_week);

  let logged = 0;
  let noteIdx = 0;
  for (const d of trainingDays) {
    const isWeek12 = d.week_number <= 2;
    const isEarlyWeek3 = d.week_number === 3 && (d.day_of_week === 1 || d.day_of_week === 3);
    if (!isWeek12 && !isEarlyWeek3) continue;

    const offsetDays = (d.week_number - 1) * 7 + d.day_of_week;
    const completedAt = new Date(startDate.getTime() + offsetDays * DAY_MS);

    const [log] = await insertReturning(
      'progress_logs',
      [
        {
          assignment_id: assignment.id,
          plan_day_id: d.id,
          client_id: clientId,
          completed_at: completedAt.toISOString(),
          perceived_effort: 6 + (logged % 4),
          notes: SAMPLE_NOTES[noteIdx % SAMPLE_NOTES.length],
        },
      ],
      'id',
    );
    noteIdx += 1;

    const exItems = exByWorkout[d.workout_id] ?? [];
    const setRows = [];
    for (const item of exItems) {
      for (let s = 1; s <= item.sets; s += 1) {
        const isHold = item.reps <= 1;
        setRows.push({
          progress_log_id: log.id,
          exercise_id: item.exercise_id,
          set_number: s,
          reps_done: isHold ? null : item.reps - (s === item.sets ? 1 : 0),
          weight_done: isHold ? null : 40 + item.position * 5 + d.week_number * 2.5,
        });
      }
    }
    if (setRows.length) {
      const { error } = await supabase.from('set_logs').insert(setRows);
      check(error, 'set_logs');
    }
    logged += 1;
  }
  console.log(`    ↳ client ${clientLabel}: plan assigned, ${logged} sessions logged`);
}

async function main() {
  console.log('\n🌱 Seeding sample content for every coach + client account …');

  const { data: profiles, error: profErr } = await supabase
    .from('profiles')
    .select('id,full_name,role')
    .order('created_at', { ascending: true });
  check(profErr, 'load profiles');

  const coaches = profiles.filter((p) => p.role === 'coach');
  const clients = profiles.filter((p) => p.role === 'client');

  const { data: links, error: linkErr } = await supabase
    .from('coach_clients')
    .select('coach_id,client_id,status')
    .eq('status', 'active');
  check(linkErr, 'load coach_clients');

  if (coaches.length === 0) die('No coach profiles found — nothing to seed.');

  for (const coach of coaches) {
    const content = await seedCoachContent(coach.id, coach.full_name || coach.id);
    const linkedClientIds = links.filter((l) => l.coach_id === coach.id).map((l) => l.client_id);
    if (linkedClientIds.length === 0) {
      console.log('  (no clients linked to this coach)');
      continue;
    }
    for (const clientId of linkedClientIds) {
      const client = clients.find((c) => c.id === clientId);
      await seedClientProgress(clientId, client?.full_name ?? clientId, content);
    }
  }

  const unlinkedClients = clients.filter((c) => !links.some((l) => l.client_id === c.id));
  if (unlinkedClients.length > 0) {
    console.log('\n⚠️  Clients with no active coach link (left untouched):');
    for (const c of unlinkedClients) console.log(`   - ${c.full_name || '(no name)'}  ${c.id}`);
  }

  console.log(`\n✅ Seeded ${coaches.length} coach(es) and ${clients.length - unlinkedClients.length} linked client(s).\n`);
}

main().catch((e) => die(e.message ?? String(e)));
