-- Fitness & Muscles — Phase 1 schema + RLS.
-- Single-tenant: one coach trains his own roster. Both roles share this DB,
-- gated by profiles.role and the RLS policies below. RLS is THE security
-- boundary; client-side coach_id/client_id filtering is defense-in-depth only.

create extension if not exists "pg_trgm" with schema "extensions";

-- ============================================================================
-- TABLES
-- ============================================================================

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text not null,
  role text not null default 'client' check (role in ('coach', 'client')),
  avatar_url text,
  locale text not null default 'en',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.client_intake (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null unique references public.profiles (id) on delete cascade,
  basic_info jsonb,
  body_metrics jsonb,
  fitness_goals jsonb,
  health_restrictions jsonb,
  nutrition_prefs jsonb,
  workout_prefs jsonb,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.coach_invites (
  code text primary key,
  coach_id uuid not null references public.profiles (id) on delete cascade,
  used_by uuid references public.profiles (id) on delete set null,
  single_use boolean not null default true,
  expires_at timestamptz not null default (now() + interval '7 days'),
  created_at timestamptz not null default now()
);
create index coach_invites_coach_id_idx on public.coach_invites (coach_id);

create table public.coach_clients (
  coach_id uuid not null references public.profiles (id) on delete cascade,
  client_id uuid not null references public.profiles (id) on delete cascade,
  status text not null default 'active' check (status in ('active', 'removed')),
  accepted_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (coach_id, client_id)
);
create index coach_clients_client_id_idx on public.coach_clients (client_id);

create table public.exercises (
  id uuid primary key default gen_random_uuid(),
  coach_id uuid not null references public.profiles (id) on delete cascade,
  name text not null,
  description text,
  video_url text check (
    video_url is null
    or video_url ~ '^https://((www\.)?youtube\.com/|youtu\.be/)'
  ),
  muscle_group text,
  equipment text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index exercises_coach_id_idx on public.exercises (coach_id);
create index exercises_name_trgm_idx on public.exercises using gin (name extensions.gin_trgm_ops);

create table public.workouts (
  id uuid primary key default gen_random_uuid(),
  coach_id uuid not null references public.profiles (id) on delete cascade,
  name text not null,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index workouts_coach_id_idx on public.workouts (coach_id);

-- `position` not `order` (reserved word). No timestamps: child rows of workouts.
create table public.workout_exercises (
  workout_id uuid not null references public.workouts (id) on delete cascade,
  exercise_id uuid not null references public.exercises (id) on delete cascade,
  position int not null,
  sets int not null default 3,
  reps int not null default 10,
  rest_seconds int not null default 60,
  weight_hint text,
  primary key (workout_id, position)
);
create index workout_exercises_exercise_id_idx on public.workout_exercises (exercise_id);

create table public.plans (
  id uuid primary key default gen_random_uuid(),
  coach_id uuid not null references public.profiles (id) on delete cascade,
  name text not null,
  duration_weeks int check (duration_weeks between 1 and 52),
  description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index plans_coach_id_idx on public.plans (coach_id);

-- day_of_week: 0=Sunday (matches JS Date.getDay()). null workout_id = rest day.
create table public.plan_days (
  id uuid primary key default gen_random_uuid(),
  plan_id uuid not null references public.plans (id) on delete cascade,
  week_number int not null check (week_number >= 1),
  day_of_week int not null check (day_of_week between 0 and 6),
  workout_id uuid references public.workouts (id) on delete set null,
  unique (plan_id, week_number, day_of_week)
);
create index plan_days_plan_id_idx on public.plan_days (plan_id);
create index plan_days_workout_id_idx on public.plan_days (workout_id);

create table public.plan_assignments (
  id uuid primary key default gen_random_uuid(),
  plan_id uuid not null references public.plans (id) on delete cascade,
  client_id uuid not null references public.profiles (id) on delete cascade,
  start_date date not null,
  status text not null default 'active' check (status in ('active', 'completed', 'paused')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index plan_assignments_plan_id_idx on public.plan_assignments (plan_id);
create index plan_assignments_client_id_idx on public.plan_assignments (client_id);
-- One active plan per client.
create unique index plan_assignments_one_active_idx
  on public.plan_assignments (client_id)
  where status = 'active';

create table public.progress_logs (
  id uuid primary key default gen_random_uuid(),
  assignment_id uuid not null references public.plan_assignments (id) on delete cascade,
  plan_day_id uuid not null references public.plan_days (id) on delete cascade,
  client_id uuid not null references public.profiles (id) on delete cascade,
  completed_at timestamptz not null default now(),
  notes text,
  perceived_effort int check (perceived_effort between 1 and 10),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  -- one log per plan-day per assignment; retroactive logging upserts.
  unique (assignment_id, plan_day_id)
);
create index progress_logs_assignment_id_idx on public.progress_logs (assignment_id);
create index progress_logs_plan_day_id_idx on public.progress_logs (plan_day_id);
create index progress_logs_client_id_idx on public.progress_logs (client_id);

create table public.set_logs (
  id uuid primary key default gen_random_uuid(),
  progress_log_id uuid not null references public.progress_logs (id) on delete cascade,
  exercise_id uuid not null references public.exercises (id) on delete cascade,
  set_number int not null,
  reps_done int,
  weight_done numeric(6, 2),
  created_at timestamptz not null default now(),
  unique (progress_log_id, exercise_id, set_number)
);
create index set_logs_progress_log_id_idx on public.set_logs (progress_log_id);
create index set_logs_exercise_id_idx on public.set_logs (exercise_id);

create table public.tips (
  id uuid primary key default gen_random_uuid(),
  coach_id uuid not null references public.profiles (id) on delete cascade,
  body text not null check (char_length(body) <= 2000),
  created_at timestamptz not null default now()
);
create index tips_coach_id_idx on public.tips (coach_id);
create index tips_created_at_idx on public.tips (created_at desc);

-- ============================================================================
-- AUTH WIRING + SECURITY-DEFINER HELPERS
-- ============================================================================
-- All helpers run `security definer` with an empty search_path so they bypass
-- RLS on the tables they inspect (breaking the recursion that would otherwise
-- occur when a policy queries another RLS-protected table) while staying immune
-- to search_path hijacking. Every identifier inside is schema-qualified.

-- Create a profile row whenever an auth user is created.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, full_name, locale)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    coalesce(new.raw_user_meta_data ->> 'locale', 'en')
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Block privilege escalation: a client must never flip their own role to coach.
-- Only the service_role key (seed script / dashboard) may change role.
create or replace function public.prevent_role_escalation()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.role is distinct from old.role and auth.role() <> 'service_role' then
    raise exception 'role may only be changed by a privileged context'
      using errcode = '42501';
  end if;
  return new;
end;
$$;

create trigger profiles_prevent_role_escalation
  before update on public.profiles
  for each row execute function public.prevent_role_escalation();

create or replace function public.is_coach()
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.profiles where id = auth.uid() and role = 'coach'
  );
$$;

create or replace function public.my_coach_id()
returns uuid language sql stable security definer set search_path = '' as $$
  select coach_id from public.coach_clients
  where client_id = auth.uid() and status = 'active'
  limit 1;
$$;

create or replace function public.is_my_client(client uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.coach_clients
    where coach_id = auth.uid() and client_id = client and status = 'active'
  );
$$;

create or replace function public.owns_plan(p uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.plans where id = p and coach_id = auth.uid()
  );
$$;

create or replace function public.owns_workout(w uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.workouts where id = w and coach_id = auth.uid()
  );
$$;

create or replace function public.client_has_plan(p uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.plan_assignments
    where plan_id = p and client_id = auth.uid()
  );
$$;

create or replace function public.client_can_see_workout(w uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1
    from public.plan_assignments pa
    join public.plan_days pd on pd.plan_id = pa.plan_id
    where pa.client_id = auth.uid() and pd.workout_id = w
  );
$$;

create or replace function public.client_can_see_exercise(e uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1
    from public.plan_assignments pa
    join public.plan_days pd on pd.plan_id = pa.plan_id
    join public.workout_exercises we on we.workout_id = pd.workout_id
    where pa.client_id = auth.uid() and we.exercise_id = e
  );
$$;

create or replace function public.client_owns_assignment(a uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.plan_assignments
    where id = a and client_id = auth.uid()
  );
$$;

create or replace function public.client_owns_log(l uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.progress_logs where id = l and client_id = auth.uid()
  );
$$;

create or replace function public.coach_can_see_log(l uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.progress_logs pl
    where pl.id = l and public.is_my_client(pl.client_id)
  );
$$;

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

alter table public.profiles enable row level security;
alter table public.client_intake enable row level security;
alter table public.coach_invites enable row level security;
alter table public.coach_clients enable row level security;
alter table public.exercises enable row level security;
alter table public.workouts enable row level security;
alter table public.workout_exercises enable row level security;
alter table public.plans enable row level security;
alter table public.plan_days enable row level security;
alter table public.plan_assignments enable row level security;
alter table public.progress_logs enable row level security;
alter table public.set_logs enable row level security;
alter table public.tips enable row level security;

-- profiles ------------------------------------------------------------------
create policy profiles_select_own on public.profiles
  for select to authenticated using (id = auth.uid());
create policy profiles_select_coach on public.profiles
  for select to authenticated using (id = public.my_coach_id());
create policy profiles_select_client on public.profiles
  for select to authenticated using (public.is_my_client(id));
create policy profiles_update_own on public.profiles
  for update to authenticated using (id = auth.uid()) with check (id = auth.uid());

-- client_intake -------------------------------------------------------------
create policy client_intake_select on public.client_intake
  for select to authenticated
  using (profile_id = auth.uid() or public.is_my_client(profile_id));
create policy client_intake_insert on public.client_intake
  for insert to authenticated with check (profile_id = auth.uid());
create policy client_intake_update on public.client_intake
  for update to authenticated
  using (profile_id = auth.uid()) with check (profile_id = auth.uid());

-- coach_invites -------------------------------------------------------------
-- Intentionally NO blanket SELECT: a `using (true)` policy would let any user
-- enumerate every unused code and hijack the roster. Redemption goes through
-- the security-definer redeem_invite() RPC, which never needs client SELECT.
create policy coach_invites_select_coach on public.coach_invites
  for select to authenticated using (coach_id = auth.uid());
create policy coach_invites_insert_coach on public.coach_invites
  for insert to authenticated
  with check (public.is_coach() and coach_id = auth.uid());

-- coach_clients -------------------------------------------------------------
-- INSERT happens only via redeem_invite() (security definer). Coach manages
-- membership (status) via UPDATE/DELETE.
create policy coach_clients_select on public.coach_clients
  for select to authenticated
  using (coach_id = auth.uid() or client_id = auth.uid());
create policy coach_clients_update_coach on public.coach_clients
  for update to authenticated
  using (coach_id = auth.uid()) with check (coach_id = auth.uid());
create policy coach_clients_delete_coach on public.coach_clients
  for delete to authenticated using (coach_id = auth.uid());

-- exercises -----------------------------------------------------------------
create policy exercises_select on public.exercises
  for select to authenticated
  using (coach_id = auth.uid() or public.client_can_see_exercise(id));
create policy exercises_insert on public.exercises
  for insert to authenticated
  with check (public.is_coach() and coach_id = auth.uid());
create policy exercises_update on public.exercises
  for update to authenticated
  using (coach_id = auth.uid()) with check (coach_id = auth.uid());
create policy exercises_delete on public.exercises
  for delete to authenticated using (coach_id = auth.uid());

-- workouts ------------------------------------------------------------------
create policy workouts_select on public.workouts
  for select to authenticated
  using (coach_id = auth.uid() or public.client_can_see_workout(id));
create policy workouts_insert on public.workouts
  for insert to authenticated
  with check (public.is_coach() and coach_id = auth.uid());
create policy workouts_update on public.workouts
  for update to authenticated
  using (coach_id = auth.uid()) with check (coach_id = auth.uid());
create policy workouts_delete on public.workouts
  for delete to authenticated using (coach_id = auth.uid());

-- workout_exercises (ownership via parent workout) --------------------------
create policy workout_exercises_select on public.workout_exercises
  for select to authenticated
  using (public.owns_workout(workout_id) or public.client_can_see_workout(workout_id));
create policy workout_exercises_insert on public.workout_exercises
  for insert to authenticated with check (public.owns_workout(workout_id));
create policy workout_exercises_update on public.workout_exercises
  for update to authenticated
  using (public.owns_workout(workout_id)) with check (public.owns_workout(workout_id));
create policy workout_exercises_delete on public.workout_exercises
  for delete to authenticated using (public.owns_workout(workout_id));

-- plans ---------------------------------------------------------------------
create policy plans_select on public.plans
  for select to authenticated
  using (coach_id = auth.uid() or public.client_has_plan(id));
create policy plans_insert on public.plans
  for insert to authenticated
  with check (public.is_coach() and coach_id = auth.uid());
create policy plans_update on public.plans
  for update to authenticated
  using (coach_id = auth.uid()) with check (coach_id = auth.uid());
create policy plans_delete on public.plans
  for delete to authenticated using (coach_id = auth.uid());

-- plan_days (ownership via parent plan) -------------------------------------
create policy plan_days_select on public.plan_days
  for select to authenticated
  using (public.owns_plan(plan_id) or public.client_has_plan(plan_id));
create policy plan_days_insert on public.plan_days
  for insert to authenticated with check (public.owns_plan(plan_id));
create policy plan_days_update on public.plan_days
  for update to authenticated
  using (public.owns_plan(plan_id)) with check (public.owns_plan(plan_id));
create policy plan_days_delete on public.plan_days
  for delete to authenticated using (public.owns_plan(plan_id));

-- plan_assignments ----------------------------------------------------------
create policy plan_assignments_select on public.plan_assignments
  for select to authenticated
  using (client_id = auth.uid() or public.owns_plan(plan_id));
create policy plan_assignments_insert on public.plan_assignments
  for insert to authenticated
  with check (public.owns_plan(plan_id) and public.is_my_client(client_id));
create policy plan_assignments_update on public.plan_assignments
  for update to authenticated
  using (public.owns_plan(plan_id)) with check (public.owns_plan(plan_id));
create policy plan_assignments_delete on public.plan_assignments
  for delete to authenticated using (public.owns_plan(plan_id));

-- progress_logs -------------------------------------------------------------
create policy progress_logs_select on public.progress_logs
  for select to authenticated
  using (client_id = auth.uid() or public.is_my_client(client_id));
create policy progress_logs_insert on public.progress_logs
  for insert to authenticated
  with check (client_id = auth.uid() and public.client_owns_assignment(assignment_id));
create policy progress_logs_update on public.progress_logs
  for update to authenticated
  using (client_id = auth.uid()) with check (client_id = auth.uid());
create policy progress_logs_delete on public.progress_logs
  for delete to authenticated using (client_id = auth.uid());

-- set_logs (ownership via parent progress_log) ------------------------------
create policy set_logs_select on public.set_logs
  for select to authenticated
  using (public.client_owns_log(progress_log_id) or public.coach_can_see_log(progress_log_id));
create policy set_logs_insert on public.set_logs
  for insert to authenticated with check (public.client_owns_log(progress_log_id));
create policy set_logs_update on public.set_logs
  for update to authenticated
  using (public.client_owns_log(progress_log_id))
  with check (public.client_owns_log(progress_log_id));
create policy set_logs_delete on public.set_logs
  for delete to authenticated using (public.client_owns_log(progress_log_id));

-- tips ----------------------------------------------------------------------
create policy tips_select on public.tips
  for select to authenticated
  using (coach_id = auth.uid() or coach_id = public.my_coach_id());
create policy tips_insert on public.tips
  for insert to authenticated
  with check (public.is_coach() and coach_id = auth.uid());
create policy tips_update on public.tips
  for update to authenticated
  using (coach_id = auth.uid()) with check (coach_id = auth.uid());
create policy tips_delete on public.tips
  for delete to authenticated using (coach_id = auth.uid());

-- ============================================================================
-- REALTIME
-- ============================================================================
-- Only tables the client live-queries (Phase 2 collections + their children).
-- Broadcasts respect RLS because RLS is enabled above AND the table is added
-- to the publication here — both are required.

alter publication supabase_realtime add table public.exercises;
alter publication supabase_realtime add table public.workouts;
alter publication supabase_realtime add table public.workout_exercises;
alter publication supabase_realtime add table public.plans;
alter publication supabase_realtime add table public.plan_days;
alter publication supabase_realtime add table public.plan_assignments;
alter publication supabase_realtime add table public.progress_logs;
alter publication supabase_realtime add table public.set_logs;
alter publication supabase_realtime add table public.tips;
alter publication supabase_realtime add table public.coach_clients;
