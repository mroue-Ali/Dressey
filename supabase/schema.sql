-- Dressy database schema for Supabase (Postgres).
-- Mirrors mobile/src/data/types.ts. Run in the Supabase SQL editor.
-- Every row belongs to the signed-in owner (auth.uid()), enforced by RLS.

create extension if not exists btree_gist;

create table public.funding (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users on delete cascade,
  source text not null check (source in ('starter', 'investor', 'gift', 'help', 'other')),
  from_name text not null default '',
  amount numeric(12, 2) not null check (amount > 0),
  date date not null default current_date,
  note text,
  created_at timestamptz not null default now()
);

create table public.dresses (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users on delete cascade,
  name text not null,
  origin text not null check (origin in ('bought', 'personal', 'gift', 'other')),
  shop text,
  purchase_price numeric(12, 2) not null default 0 check (purchase_price >= 0),
  rental_price numeric(12, 2) not null default 0 check (rental_price >= 0),
  size text,
  photo_path text, -- object path in the 'dress-photos' storage bucket
  color text not null default '#E9D8B8',
  added_at date not null default current_date,
  note text,
  created_at timestamptz not null default now()
);

create table public.expenses (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users on delete cascade,
  category text not null check (category in ('transport', 'fuel', 'delivery', 'cleaning', 'repair', 'other')),
  amount numeric(12, 2) not null check (amount > 0),
  date date not null default current_date,
  note text,
  created_at timestamptz not null default now()
);

create table public.bookings (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users on delete cascade,
  dress_id uuid not null references public.dresses on delete restrict,
  customer_name text not null,
  customer_phone text,
  event_date date not null,
  price numeric(12, 2) not null check (price >= 0),
  paid numeric(12, 2) not null default 0 check (paid >= 0 and paid <= price),
  status text not null default 'booked' check (status in ('booked', 'cancelled')),
  note text,
  created_at timestamptz not null default now(),

  -- Same rule as mobile/src/lib/availability.ts: event dates for one dress
  -- must be at least 3 days apart (1 day pickup before, return + cleaning after).
  -- The database refuses double bookings even if two phones book at once.
  -- Two [D-1, D+1] ranges overlap exactly when the event dates are <= 2 days apart.
  constraint bookings_no_overlap exclude using gist (
    dress_id with =,
    daterange(event_date - 1, event_date + 1, '[]') with &&
  ) where (status = 'booked')
);

-- Fitting visits: the customer comes over to try dresses on before booking one.
-- Times are the owner's local wall-clock times (no time zone), like event_date.
create table public.appointments (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users on delete cascade,
  customer_name text not null,
  customer_phone text,
  date date not null,
  start_time time not null,
  end_time time, -- optional: the visit is a range of hours when set
  note text,
  created_at timestamptz not null default now(),
  check (end_time is null or end_time > start_time)
);

create index on public.appointments (date, start_time);

create index on public.bookings (dress_id, event_date);
create index on public.bookings (event_date);

-- Row level security: the owner sees and edits only her own data.
alter table public.funding enable row level security;
alter table public.dresses enable row level security;
alter table public.expenses enable row level security;
alter table public.bookings enable row level security;
alter table public.appointments enable row level security;

create policy "owner" on public.funding for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());
create policy "owner" on public.dresses for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());
create policy "owner" on public.expenses for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());
create policy "owner" on public.bookings for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());
create policy "owner" on public.appointments for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());

-- Private bucket for dress photos, one folder per owner: <owner_id>/<file>.
insert into storage.buckets (id, name, public) values ('dress-photos', 'dress-photos', false)
on conflict (id) do nothing;

create policy "owner photos" on storage.objects for all
  using (bucket_id = 'dress-photos' and (storage.foldername(name))[1] = auth.uid()::text)
  with check (bucket_id = 'dress-photos' and (storage.foldername(name))[1] = auth.uid()::text);
