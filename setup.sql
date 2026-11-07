-- dBBH Community Builder: run once in Supabase → SQL Editor → New query → Run

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  duke_email text not null check (duke_email ~* '^[a-z0-9._-]+@duke\.edu$'),
  name text not null check (char_length(name) between 1 and 80),
  phone text not null check (char_length(phone) between 7 and 20),
  class_year int not null check (class_year in (2027,2028,2029,2030)),
  major text not null check (char_length(major) <= 120),
  minor text check (char_length(minor) <= 120),
  certificates text check (char_length(certificates) <= 200),
  interests text[] not null default '{}' check (cardinality(interests) between 1 and 14),
  three_words text check (char_length(three_words) <= 80),
  dream_role text check (char_length(dream_role) <= 120),
  ask_me text check (char_length(ask_me) <= 200),
  fix_problem text check (char_length(fix_problem) <= 300),
  bio text check (char_length(bio) <= 600),
  created_at timestamptz not null default now()
);

create table if not exists public.likes (
  from_id uuid not null references public.profiles(id) on delete cascade,
  to_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (from_id, to_id),
  check (from_id <> to_id)
);

alter table public.profiles enable row level security;
alter table public.likes enable row level security;

-- Each person can only read and write their own full profile row (it holds email and phone).
drop policy if exists own_profile on public.profiles;
create policy own_profile on public.profiles for all to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id and lower(duke_email) = lower(auth.jwt() ->> 'email'));

-- Likes: you can add, see and remove only your own.
drop policy if exists likes_insert on public.likes;
create policy likes_insert on public.likes for insert to authenticated with check (from_id = auth.uid());
drop policy if exists likes_select on public.likes;
create policy likes_select on public.likes for select to authenticated using (from_id = auth.uid());
drop policy if exists likes_delete on public.likes;
create policy likes_delete on public.likes for delete to authenticated using (from_id = auth.uid());

-- Directory: everyone logged in can browse profiles WITHOUT email or phone.
create or replace view public.directory as
  select id, name, class_year, major, minor, certificates, interests,
         three_words, dream_role, ask_me, fix_problem, bio
  from public.profiles;
revoke all on public.directory from anon;
grant select on public.directory to authenticated;

-- Matches: returns email and phone ONLY for people who liked you back.
create or replace function public.my_matches()
returns table (id uuid, name text, class_year int, major text, duke_email text, phone text)
language sql security definer set search_path = public as $$
  select p.id, p.name, p.class_year, p.major, p.duke_email, p.phone
  from public.likes a
  join public.likes b on b.from_id = a.to_id and b.to_id = a.from_id
  join public.profiles p on p.id = a.to_id
  where a.from_id = auth.uid();
$$;
revoke all on function public.my_matches() from public, anon;
grant execute on function public.my_matches() to authenticated;
