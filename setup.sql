-- dBBH Community Builder (v2). Run once in Supabase → SQL Editor → New query → Run.
-- All names start with cb_ so nothing collides with tables your main dBBH site may already use.

create table if not exists public.cb_profiles (
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

create table if not exists public.cb_likes (
  from_id uuid not null references public.cb_profiles(id) on delete cascade,
  to_id uuid not null references public.cb_profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (from_id, to_id),
  check (from_id <> to_id)
);

alter table public.cb_profiles enable row level security;
alter table public.cb_likes enable row level security;

-- Your full profile row (it holds email and phone) is readable and editable only by you.
drop policy if exists cb_own_profile on public.cb_profiles;
create policy cb_own_profile on public.cb_profiles for all to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id and lower(duke_email) = lower(auth.jwt() ->> 'email'));

-- Likes: add, see and remove only your own.
drop policy if exists cb_likes_insert on public.cb_likes;
create policy cb_likes_insert on public.cb_likes for insert to authenticated with check (from_id = auth.uid());
drop policy if exists cb_likes_select on public.cb_likes;
create policy cb_likes_select on public.cb_likes for select to authenticated using (from_id = auth.uid());
drop policy if exists cb_likes_delete on public.cb_likes;
create policy cb_likes_delete on public.cb_likes for delete to authenticated using (from_id = auth.uid());

-- Directory: members with a profile can browse everyone else WITHOUT email or phone.
create or replace function public.cb_directory()
returns table (id uuid, name text, class_year int, major text, minor text, certificates text,
               interests text[], three_words text, dream_role text, ask_me text, fix_problem text, bio text)
language sql stable security definer set search_path = public as $$
  select p.id, p.name, p.class_year, p.major, p.minor, p.certificates,
         p.interests, p.three_words, p.dream_role, p.ask_me, p.fix_problem, p.bio
  from public.cb_profiles p
  where p.id <> auth.uid()
    and exists (select 1 from public.cb_profiles me where me.id = auth.uid());
$$;
revoke all on function public.cb_directory() from public, anon;
grant execute on function public.cb_directory() to authenticated;

-- Matches: email and phone ONLY for people who chose "Let's Chat!" on you too.
create or replace function public.cb_my_matches()
returns table (id uuid, name text, class_year int, major text, duke_email text, phone text)
language sql stable security definer set search_path = public as $$
  select p.id, p.name, p.class_year, p.major, p.duke_email, p.phone
  from public.cb_likes a
  join public.cb_likes b on b.from_id = a.to_id and b.to_id = a.from_id
  join public.cb_profiles p on p.id = a.to_id
  where a.from_id = auth.uid();
$$;
revoke all on function public.cb_my_matches() from public, anon;
grant execute on function public.cb_my_matches() to authenticated;
