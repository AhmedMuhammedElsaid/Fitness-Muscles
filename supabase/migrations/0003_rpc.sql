-- updated_at trigger + invite RPCs.

-- ============================================================================
-- updated_at maintenance
-- ============================================================================

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger set_updated_at_profiles before update on public.profiles
  for each row execute function public.set_updated_at();
create trigger set_updated_at_client_intake before update on public.client_intake
  for each row execute function public.set_updated_at();
create trigger set_updated_at_coach_clients before update on public.coach_clients
  for each row execute function public.set_updated_at();
create trigger set_updated_at_exercises before update on public.exercises
  for each row execute function public.set_updated_at();
create trigger set_updated_at_workouts before update on public.workouts
  for each row execute function public.set_updated_at();
create trigger set_updated_at_plans before update on public.plans
  for each row execute function public.set_updated_at();
create trigger set_updated_at_plan_assignments before update on public.plan_assignments
  for each row execute function public.set_updated_at();
create trigger set_updated_at_progress_logs before update on public.progress_logs
  for each row execute function public.set_updated_at();

-- ============================================================================
-- Invite RPCs
-- ============================================================================

-- Coach-only. Generates a unique 6-char code (alphabet excludes ambiguous
-- I/O/0/1), inserts the invite, returns the code.
create or replace function public.generate_invite_code()
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_alphabet constant text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  v_code text;
  v_i int;
  v_attempts int := 0;
begin
  if not public.is_coach() then
    raise exception 'only coaches can generate invite codes' using errcode = '42501';
  end if;

  loop
    v_code := '';
    for v_i in 1..6 loop
      v_code := v_code || substr(v_alphabet, 1 + floor(random() * length(v_alphabet))::int, 1);
    end loop;

    begin
      insert into public.coach_invites (code, coach_id) values (v_code, auth.uid());
      return v_code;
    exception when unique_violation then
      v_attempts := v_attempts + 1;
      if v_attempts > 10 then
        raise exception 'could not generate a unique invite code, try again';
      end if;
    end;
  end loop;
end;
$$;

-- Client-side redemption. Atomically claims an unexpired, unclaimed invite
-- (`update ... where used_by is null returning *`), then links the roster row.
-- Re-running with the same code raises 23505 (already redeemed → 409); an
-- unknown/expired code raises 22023.
create or replace function public.redeem_invite(invite_code text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_coach uuid;
begin
  if auth.uid() is null then
    raise exception 'authentication required' using errcode = '42501';
  end if;

  update public.coach_invites
     set used_by = auth.uid()
   where code = invite_code
     and used_by is null
     and expires_at > now()
  returning coach_id into v_coach;

  if v_coach is null then
    if exists (
      select 1 from public.coach_invites
      where code = invite_code and used_by = auth.uid()
    ) then
      raise exception 'invite already redeemed' using errcode = '23505';
    end if;
    raise exception 'invalid or expired invite code' using errcode = '22023';
  end if;

  insert into public.coach_clients (coach_id, client_id)
  values (v_coach, auth.uid())
  on conflict (coach_id, client_id) do update set status = 'active';
end;
$$;

revoke execute on function public.generate_invite_code() from public;
revoke execute on function public.redeem_invite(text) from public;
grant execute on function public.generate_invite_code() to authenticated;
grant execute on function public.redeem_invite(text) to authenticated;
