-- OffsetPool schema
-- Run this in your Supabase SQL editor

create extension if not exists "uuid-ossp";

-- ─────────────────────────────────────────
-- Drop existing objects (safe re-run)
-- ─────────────────────────────────────────

drop trigger if exists on_auth_user_created on auth.users;
drop function if exists handle_new_user();
drop function if exists is_group_member(uuid) cascade;
drop function if exists is_group_admin(uuid) cascade;
drop function if exists create_group(text, numeric, text, numeric, date, text, text);
drop function if exists join_group(text, text, text);
drop function if exists submit_contribution(uuid, numeric, date, text, text, text);
drop function if exists confirm_contribution(uuid);
drop function if exists get_group_contributions(uuid);
drop table if exists contributions cascade;
drop table if exists interest_rates cascade;
drop table if exists group_members cascade;
drop table if exists groups cascade;
drop table if exists profiles cascade;

-- ─────────────────────────────────────────
-- Tables
-- ─────────────────────────────────────────

create table profiles (
  id          uuid references auth.users(id) on delete cascade primary key,
  full_name   text not null,
  email       text not null,
  created_at  timestamptz default now()
);

create table groups (
  id            uuid default uuid_generate_v4() primary key,
  name          text not null,
  loan_balance  numeric(12, 2) not null default 0,
  invite_code   text unique not null,
  created_by    uuid references profiles(id) on delete cascade not null,
  created_at    timestamptz default now()
);

create table group_members (
  id          uuid default uuid_generate_v4() primary key,
  group_id    uuid references groups(id) on delete cascade not null,
  user_id     uuid references profiles(id) on delete cascade not null,
  role        text not null default 'member' check (role in ('admin', 'member')),
  joined_at   timestamptz default now(),
  unique(group_id, user_id)
);

create table interest_rates (
  id              uuid default uuid_generate_v4() primary key,
  group_id        uuid references groups(id) on delete cascade not null,
  rate            numeric(6, 4) not null,
  effective_from  date not null,
  created_by      uuid references profiles(id) not null,
  created_at      timestamptz default now()
);

create table contributions (
  id              uuid default uuid_generate_v4() primary key,
  group_id        uuid references groups(id) on delete cascade not null,
  user_id         uuid references profiles(id) on delete cascade not null,
  amount          numeric(10, 2) not null check (amount > 0),
  contributed_at  date not null,
  notes           text,
  status          text not null default 'pending' check (status in ('pending', 'confirmed')),
  confirmed_at    timestamptz,
  confirmed_by    uuid references profiles(id),
  created_at      timestamptz default now()
);

-- ─────────────────────────────────────────
-- Helper functions (defined before policies)
-- ─────────────────────────────────────────

create or replace function is_group_member(gid uuid)
returns boolean language sql security definer stable as $$
  select exists (
    select 1 from group_members
    where group_id = gid and user_id = auth.uid()
  )
$$;

create or replace function is_group_admin(gid uuid)
returns boolean language sql security definer stable as $$
  select exists (
    select 1 from group_members
    where group_id = gid and user_id = auth.uid() and role = 'admin'
  )
$$;

-- ─────────────────────────────────────────
-- Row Level Security
-- ─────────────────────────────────────────

alter table profiles enable row level security;
alter table groups enable row level security;
alter table group_members enable row level security;
alter table interest_rates enable row level security;
alter table contributions enable row level security;

-- Profiles
create policy "Users can read own profile"
  on profiles for select using (auth.uid() = id);

create policy "Users can update own profile"
  on profiles for update using (auth.uid() = id);

-- Groups
create policy "Group members can read group"
  on groups for select using (is_group_member(id));

create policy "Group admin can update group"
  on groups for update using (is_group_admin(id));

create policy "Authenticated users can create groups"
  on groups for insert with check (auth.uid() is not null);

-- Group Members
create policy "Members can read group members"
  on group_members for select using (is_group_member(group_id));

create policy "Users can join groups"
  on group_members for insert with check (auth.uid() = user_id);

create policy "Admin can delete members"
  on group_members for delete using (is_group_admin(group_id));

-- Interest Rates
create policy "Members can read interest rates"
  on interest_rates for select using (is_group_member(group_id));

create policy "Admin can add interest rates"
  on interest_rates for insert with check (is_group_admin(group_id));

create policy "Admin can delete interest rates"
  on interest_rates for delete using (is_group_admin(group_id));

-- Contributions
create policy "Members can read contributions"
  on contributions for select using (is_group_member(group_id));

create policy "Members/admin can delete contributions"
  on contributions for delete
  using (auth.uid() = user_id or is_group_admin(group_id));

-- ─────────────────────────────────────────
-- Group creation function (bypasses RLS)
-- ─────────────────────────────────────────

create or replace function create_group(
  p_name text,
  p_loan_balance numeric,
  p_invite_code text,
  p_rate numeric,
  p_effective_from date,
  p_full_name text,
  p_email text
)
returns uuid language plpgsql security definer as $$
declare
  v_user_id uuid := auth.uid();
  v_group_id uuid;
begin
  if v_user_id is null then raise exception 'Not authenticated'; end if;

  insert into profiles (id, full_name, email)
  values (v_user_id, p_full_name, p_email)
  on conflict (id) do nothing;

  insert into groups (name, loan_balance, invite_code, created_by)
  values (p_name, p_loan_balance, p_invite_code, v_user_id)
  returning id into v_group_id;

  insert into group_members (group_id, user_id, role)
  values (v_group_id, v_user_id, 'admin');

  insert into interest_rates (group_id, rate, effective_from, created_by)
  values (v_group_id, p_rate, p_effective_from, v_user_id);

  return v_group_id;
end;
$$;

-- ─────────────────────────────────────────
-- Join group function (bypasses RLS)
-- ─────────────────────────────────────────

create or replace function join_group(
  p_invite_code text,
  p_full_name text,
  p_email text
)
returns uuid language plpgsql security definer as $$
declare
  v_user_id uuid := auth.uid();
  v_group_id uuid;
begin
  if v_user_id is null then raise exception 'Not authenticated'; end if;

  insert into profiles (id, full_name, email)
  values (v_user_id, p_full_name, p_email)
  on conflict (id) do nothing;

  select id into v_group_id from groups where invite_code = upper(p_invite_code);
  if v_group_id is null then raise exception 'Invalid invite code'; end if;

  insert into group_members (group_id, user_id, role)
  values (v_group_id, v_user_id, 'member')
  on conflict (group_id, user_id) do nothing;

  return v_group_id;
end;
$$;

-- ─────────────────────────────────────────
-- Submit contribution (bypasses RLS)
-- ─────────────────────────────────────────

create or replace function submit_contribution(
  p_group_id uuid,
  p_amount numeric,
  p_date date,
  p_notes text,
  p_full_name text,
  p_email text
)
returns uuid language plpgsql security definer as $$
declare
  v_user_id uuid := auth.uid();
  v_id uuid;
begin
  if v_user_id is null then raise exception 'Not authenticated'; end if;

  insert into profiles (id, full_name, email)
  values (v_user_id, p_full_name, p_email)
  on conflict (id) do nothing;

  if not is_group_member(p_group_id) then
    raise exception 'Not a member of this group';
  end if;

  insert into contributions (group_id, user_id, amount, contributed_at, notes, status)
  values (p_group_id, v_user_id, p_amount, p_date, nullif(p_notes, ''), 'pending')
  returning id into v_id;

  return v_id;
end;
$$;

-- ─────────────────────────────────────────
-- Confirm contribution (admin only, bypasses RLS)
-- ─────────────────────────────────────────

create or replace function confirm_contribution(p_contribution_id uuid)
returns void language plpgsql security definer as $$
declare
  v_user_id uuid := auth.uid();
  v_group_id uuid;
begin
  if v_user_id is null then raise exception 'Not authenticated'; end if;

  select group_id into v_group_id from contributions where id = p_contribution_id;
  if v_group_id is null then raise exception 'Contribution not found'; end if;

  if not is_group_admin(v_group_id) then
    raise exception 'Only admins can confirm contributions';
  end if;

  update contributions
  set status = 'confirmed', confirmed_at = now(), confirmed_by = v_user_id
  where id = p_contribution_id;
end;
$$;

-- ─────────────────────────────────────────
-- Get group contributions (bypasses RLS)
-- ─────────────────────────────────────────

create or replace function get_group_contributions(p_group_id uuid)
returns table (
  id uuid,
  group_id uuid,
  user_id uuid,
  amount numeric,
  contributed_at date,
  notes text,
  status text,
  confirmed_at timestamptz,
  confirmed_by uuid,
  created_at timestamptz,
  full_name text,
  email text
)
language plpgsql security definer as $$
begin
  if auth.uid() is null then raise exception 'Not authenticated'; end if;
  if not is_group_member(p_group_id) then raise exception 'Not a member'; end if;

  return query
    select
      c.id, c.group_id, c.user_id, c.amount, c.contributed_at,
      c.notes, c.status, c.confirmed_at, c.confirmed_by, c.created_at,
      p.full_name, p.email
    from contributions c
    join profiles p on p.id = c.user_id
    where c.group_id = p_group_id
    order by c.contributed_at desc;
end;
$$;

-- ─────────────────────────────────────────
-- Auto-create profile on signup
-- ─────────────────────────────────────────

create or replace function handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into profiles (id, full_name, email)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    new.email
  )
  on conflict (id) do nothing;
  return new;
exception when others then
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();
