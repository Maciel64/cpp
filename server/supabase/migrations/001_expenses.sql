create extension if not exists "pgcrypto";

create table if not exists public.expenses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  vendor text,
  amount numeric(12, 2) check (amount is null or amount >= 0),
  currency text default 'BRL',
  date date,
  receipt_key text,
  confidence numeric(4, 3) check (confidence is null or confidence between 0 and 1),
  status text not null default 'pending_review'
    check (status in ('pending_review', 'needs_attention', 'confirmed')),
  ocr_error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists expenses_user_created_idx
  on public.expenses (user_id, created_at desc);

create index if not exists expenses_status_idx
  on public.expenses (status);

alter table public.expenses enable row level security;

create policy "expenses_select_own" on public.expenses
  for select to authenticated
  using (user_id = auth.uid());

create policy "expenses_insert_own" on public.expenses
  for insert to authenticated
  with check (user_id = auth.uid());

create policy "expenses_update_own" on public.expenses
  for update to authenticated
  using (user_id = auth.uid());

create policy "expenses_delete_own" on public.expenses
  for delete to authenticated
  using (user_id = auth.uid());

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

drop trigger if exists expenses_set_updated_at on public.expenses;
create trigger expenses_set_updated_at
  before update on public.expenses
  for each row execute function public.set_updated_at();