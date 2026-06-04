-- RLS test harness (pgTAP). Run with: supabase test db
--
-- Exercises every policy across all three vantage points: the coach, an
-- enrolled client (A), and an unrelated client (B). Setup runs as the
-- superuser (postgres); each assertion runs as `authenticated` with a forged
-- JWT so RLS is actually enforced.

begin;
select plan(29);

-- Fixed UUIDs so assertions can reference rows without capturing ids.
\set coach '00000000-0000-0000-0000-000000000001'
\set client_a '00000000-0000-0000-0000-000000000002'
\set client_b '00000000-0000-0000-0000-000000000003'
\set ex 'a0000000-0000-0000-0000-000000000001'
\set wk 'b0000000-0000-0000-0000-000000000001'
\set pl 'c0000000-0000-0000-0000-000000000001'
\set pd 'd0000000-0000-0000-0000-000000000001'

-- Switch the active identity by forging request.jwt.claims (role stays
-- `authenticated`; only the `sub` changes).
create function public._login(uid uuid) returns void language plpgsql as $$
begin
  perform set_config(
    'request.jwt.claims',
    json_build_object('sub', uid::text, 'role', 'authenticated')::text,
    true
  );
end;
$$;

-- ----------------------------------------------------------------------------
-- Setup (as postgres). handle_new_user() auto-creates the profile rows.
-- ----------------------------------------------------------------------------
insert into auth.users (id, email, raw_user_meta_data, email_confirmed_at)
values
  (:'coach', 'coach@test.dev', '{"full_name":"Coach"}', now()),
  (:'client_a', 'a@test.dev', '{"full_name":"Client A"}', now()),
  (:'client_b', 'b@test.dev', '{"full_name":"Client B"}', now());

-- Promote the coach. Only a service_role context may change role; emulate it.
select set_config('request.jwt.claims', '{"role":"service_role"}', true);
update public.profiles set role = 'coach' where id = :'coach';

-- ----------------------------------------------------------------------------
-- COACH builds the library + plan (each insert exercises a write policy).
-- ----------------------------------------------------------------------------
set local role authenticated;
select public._login(:'coach');

select lives_ok(
  format($$insert into public.exercises (id, coach_id, name, video_url)
           values (%L, %L, 'Squat', 'https://youtu.be/abc')$$, :'ex', :'coach'),
  'coach inserts an exercise');
select lives_ok(
  format($$insert into public.workouts (id, coach_id, name) values (%L, %L, 'Leg day')$$,
         :'wk', :'coach'),
  'coach inserts a workout');
select lives_ok(
  format($$insert into public.workout_exercises (workout_id, exercise_id, position)
           values (%L, %L, 1)$$, :'wk', :'ex'),
  'coach inserts a workout_exercise');
select lives_ok(
  format($$insert into public.plans (id, coach_id, name, duration_weeks)
           values (%L, %L, 'Beginner', 4)$$, :'pl', :'coach'),
  'coach inserts a plan');
select lives_ok(
  format($$insert into public.plan_days (id, plan_id, week_number, day_of_week, workout_id)
           values (%L, %L, 1, 1, %L)$$, :'pd', :'pl', :'wk'),
  'coach inserts a plan_day');
select lives_ok(
  format($$insert into public.coach_invites (code, coach_id) values ('ABC234', %L)$$, :'coach'),
  'coach inserts an invite code');
select ok(length(public.generate_invite_code()) = 6, 'generate_invite_code returns a 6-char code');
select is(
  (select count(*)::int from public.exercises),
  1, 'coach sees their own exercise');

-- ----------------------------------------------------------------------------
-- CLIENT A redeems the invite (idempotent on re-run).
-- ----------------------------------------------------------------------------
select public._login(:'client_a');
select lives_ok($$select public.redeem_invite('ABC234')$$, 'client A redeems the invite');
select throws_ok($$select public.redeem_invite('ABC234')$$, '23505',
  null, 're-redeeming the same invite is rejected (409)');

-- ----------------------------------------------------------------------------
-- COACH can now assign the plan to client A (is_my_client passes).
-- ----------------------------------------------------------------------------
select public._login(:'coach');
select lives_ok(
  format($$insert into public.plan_assignments (plan_id, client_id, start_date)
           values (%L, %L, current_date)$$, :'pl', :'client_a'),
  'coach assigns the plan to their client');

-- ----------------------------------------------------------------------------
-- CLIENT A: visibility down the assigned chain + write boundaries.
-- ----------------------------------------------------------------------------
select public._login(:'client_a');
select is((select count(*)::int from public.exercises), 1, 'client A sees the assigned exercise');
select is((select count(*)::int from public.workouts), 1, 'client A sees the assigned workout');
select is((select count(*)::int from public.plans), 1, 'client A sees the assigned plan');
select is((select count(*)::int from public.plan_days), 1, 'client A sees the assigned plan_day');
select is((select count(*)::int from public.plan_assignments), 1, 'client A sees their assignment');
select throws_ok(
  format($$insert into public.exercises (coach_id, name) values (%L, 'Hack')$$, :'client_a'),
  '42501', null, 'client A cannot insert an exercise');
select lives_ok(
  format($$insert into public.progress_logs (assignment_id, plan_day_id, client_id)
           select id, %L, %L from public.plan_assignments limit 1$$, :'pd', :'client_a'),
  'client A logs progress on their own assignment');
select throws_ok(
  format($$insert into public.progress_logs (assignment_id, plan_day_id, client_id)
           select id, %L, %L from public.plan_assignments limit 1$$, :'pd', :'client_b'),
  '42501', null, 'client A cannot log progress for another client');
select is(
  (select count(*)::int from public.profiles where id = :'coach'),
  1, 'client A can read their coach profile');
select is(
  (select count(*)::int from public.profiles where id = :'client_b'),
  0, 'client A cannot read an unrelated profile');
select throws_ok(
  format($$update public.profiles set role = 'coach' where id = %L$$, :'client_a'),
  '42501', null, 'client A cannot escalate their own role');
select throws_ok($$select public.generate_invite_code()$$, '42501',
  null, 'client A cannot generate invite codes');

-- ----------------------------------------------------------------------------
-- CLIENT B (unrelated): sees none of A's or the coach's scoped data.
-- ----------------------------------------------------------------------------
select public._login(:'client_b');
select is((select count(*)::int from public.exercises), 0, 'client B sees no exercises');
select is((select count(*)::int from public.plan_assignments), 0, 'client B sees no assignments');
select is((select count(*)::int from public.progress_logs), 0, 'client B sees no progress logs');

-- ----------------------------------------------------------------------------
-- COACH: roster scoping + reading client progress.
-- ----------------------------------------------------------------------------
select public._login(:'coach');
select is(
  (select count(*)::int from public.profiles where id = :'client_a'),
  1, 'coach can read their own client profile');
select is(
  (select count(*)::int from public.profiles where id = :'client_b'),
  0, 'coach cannot read a non-client profile');
select is(
  (select count(*)::int from public.progress_logs),
  1, 'coach can read their client progress logs');

select * from finish();
rollback;
