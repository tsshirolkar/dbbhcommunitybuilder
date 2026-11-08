-- dBBH Community Builder (test version): NO login, NO passwords, NO email of any kind.
-- A profile is created on the visitor's device. Run once in Supabase → SQL Editor → New query → Run.
-- Uses new cb_people / cb_chats tables, so earlier test tables are left untouched.

create extension if not exists pgcrypto with schema extensions;

-- Remove functions from earlier versions (their tables are left alone)
drop function if exists public.cb_signup(text, text);
drop function if exists public.cb_login(text, text);
drop function if exists public.cb_logout(text);
drop function if exists public.cb_new_session(uuid);
drop function if exists public.cb_uid(text);
drop function if exists public.cb_overview(text);
drop function if exists public.cb_save_profile(text, jsonb);
drop function if exists public.cb_request_chat(text, uuid);
drop function if exists public.cb_delete_profile(text);

create table if not exists public.cb_people (
  id uuid primary key default gen_random_uuid(),
  secret_hash text not null,                       -- hash of the private key kept in the member's browser
  duke_email text not null unique check (duke_email ~ '^[a-z0-9._-]+@duke\.edu$'),
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
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.cb_chats (
  from_id uuid not null references public.cb_people(id) on delete cascade,
  to_id uuid not null references public.cb_people(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (from_id, to_id),
  check (from_id <> to_id)
);

-- Nobody can read or write the tables directly. All access goes through the functions below.
alter table public.cb_people enable row level security;
alter table public.cb_chats enable row level security;
revoke all on public.cb_people, public.cb_chats from anon, authenticated;

-- Internal helper: which member does this private key belong to? (not callable from the website)
create or replace function public.cb_uid(p_token text) returns uuid
language sql stable security definer set search_path = public, extensions as $$
  select id from public.cb_people
  where secret_hash = encode(digest(coalesce(p_token,''), 'sha256'), 'hex');
$$;

-- Create or update your own profile. Creating returns a private key for this device: {"token": "..."}
create or replace function public.cb_save_profile(p_token text, p_data jsonb) returns jsonb
language plpgsql security definer set search_path = public, extensions as $$
declare
  u uuid := public.cb_uid(p_token);
  em text := lower(trim(coalesce(p_data->>'duke_email','')));
  ints text[];
  tok text;
begin
  ints := array(select jsonb_array_elements_text(coalesce(p_data->'interests', '[]'::jsonb)));
  if coalesce(trim(p_data->>'name'),'') = '' or coalesce(trim(p_data->>'major'),'') = ''
     or coalesce(trim(p_data->>'phone'),'') = '' then
    raise exception 'Name, major and phone number are required.';
  end if;
  if coalesce((p_data->>'class_year')::int, 0) not in (2027,2028,2029,2030) then raise exception 'Pick your class year.'; end if;
  if cardinality(ints) not between 1 and 14 then raise exception 'Pick between 1 and 14 professional interests.'; end if;

  if u is null then
    if em !~ '^[a-z0-9._-]+@duke\.edu$' then raise exception 'Please use your @duke.edu email.'; end if;
    if exists (select 1 from public.cb_people where duke_email = em) then
      raise exception 'A profile with that email already exists, probably made on another device. Use a different email for testing, or ask a dBBH admin to remove it.';
    end if;
    tok := encode(gen_random_bytes(32), 'hex');
    insert into public.cb_people (secret_hash, duke_email, name, phone, class_year, major, minor, certificates, interests,
                                  three_words, dream_role, ask_me, fix_problem, bio)
    values (encode(digest(tok, 'sha256'), 'hex'), em, trim(p_data->>'name'), trim(p_data->>'phone'),
            (p_data->>'class_year')::int, trim(p_data->>'major'),
            nullif(trim(coalesce(p_data->>'minor','')), ''), nullif(trim(coalesce(p_data->>'certificates','')), ''), ints,
            p_data->>'three_words', p_data->>'dream_role', p_data->>'ask_me', p_data->>'fix_problem', p_data->>'bio');
    return jsonb_build_object('token', tok);
  end if;

  update public.cb_people set
    name = trim(p_data->>'name'), phone = trim(p_data->>'phone'), class_year = (p_data->>'class_year')::int,
    major = trim(p_data->>'major'),
    minor = nullif(trim(coalesce(p_data->>'minor','')), ''),
    certificates = nullif(trim(coalesce(p_data->>'certificates','')), ''),
    interests = ints, three_words = p_data->>'three_words', dream_role = p_data->>'dream_role',
    ask_me = p_data->>'ask_me', fix_problem = p_data->>'fix_problem', bio = p_data->>'bio', updated_at = now()
  where id = u;
  return jsonb_build_object('token', null);
end $$;

-- Everything the page needs in one call: your profile, the directory (no email/phone),
-- who you asked to chat, and mutual matches (the only place other people's email and phone are released).
create or replace function public.cb_overview(p_token text) returns jsonb
language plpgsql security definer set search_path = public, extensions as $$
declare u uuid := public.cb_uid(p_token); me public.cb_people;
begin
  if u is null then raise exception 'Not logged in'; end if;
  select * into me from public.cb_people where id = u;
  return jsonb_build_object(
    'profile', to_jsonb(me) - 'secret_hash',
    'directory', coalesce((
        select jsonb_agg(jsonb_build_object('id', m.id, 'name', m.name, 'class_year', m.class_year,
          'major', m.major, 'minor', m.minor, 'certificates', m.certificates, 'interests', m.interests,
          'three_words', m.three_words, 'dream_role', m.dream_role, 'ask_me', m.ask_me,
          'fix_problem', m.fix_problem, 'bio', m.bio))
        from public.cb_people m where m.id <> u), '[]'::jsonb),
    'requested', coalesce((select jsonb_agg(to_id) from public.cb_chats where from_id = u), '[]'::jsonb),
    'matches', coalesce((
        select jsonb_agg(jsonb_build_object('id', m.id, 'name', m.name, 'class_year', m.class_year,
          'major', m.major, 'duke_email', m.duke_email, 'phone', m.phone))
        from public.cb_chats r1
        join public.cb_chats r2 on r2.from_id = r1.to_id and r2.to_id = r1.from_id
        join public.cb_people m on m.id = r1.to_id
        where r1.from_id = u), '[]'::jsonb)
  );
end $$;

create or replace function public.cb_request_chat(p_token text, p_to uuid) returns jsonb
language plpgsql security definer set search_path = public, extensions as $$
declare u uuid := public.cb_uid(p_token);
begin
  if u is null then raise exception 'Not logged in'; end if;
  if p_to = u or not exists (select 1 from public.cb_people where id = p_to) then raise exception 'That member was not found.'; end if;
  insert into public.cb_chats (from_id, to_id) values (u, p_to) on conflict do nothing;
  return jsonb_build_object('matched', exists (select 1 from public.cb_chats where from_id = p_to and to_id = u));
end $$;

create or replace function public.cb_delete_profile(p_token text) returns void
language plpgsql security definer set search_path = public, extensions as $$
declare u uuid := public.cb_uid(p_token);
begin
  if u is null then raise exception 'Not logged in'; end if;
  delete from public.cb_people where id = u;
end $$;

-- Who may call what
revoke all on function public.cb_uid(text) from public, anon, authenticated;
revoke all on function public.cb_save_profile(text,jsonb), public.cb_overview(text),
  public.cb_request_chat(text,uuid), public.cb_delete_profile(text) from public;
grant execute on function public.cb_save_profile(text,jsonb), public.cb_overview(text),
  public.cb_request_chat(text,uuid), public.cb_delete_profile(text) to anon, authenticated;
