-- Run once in Supabase Dashboard → SQL Editor
-- Project: https://supabase.com/dashboard/project/eokgsehbntupgtayweng/sql/new

create type public.todo_priority as enum ('low', 'medium', 'high');

create table public.todos (
  id          uuid primary key default gen_random_uuid(),
  title       text not null check (char_length(title) <= 200),
  completed   boolean not null default false,
  priority    public.todo_priority not null default 'medium',
  deadline    timestamptz,
  tags        text[] not null default '{}',
  position    integer not null default 0,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  -- nullable until Auth (phase 2)
  user_id     uuid references auth.users(id) on delete cascade
);

create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger todos_updated_at
  before update on public.todos
  for each row execute function public.handle_updated_at();

alter table public.todos enable row level security;

-- Phase 1 demo: open access so SSR works before Auth
create policy "Public can view todos" on public.todos
  for select using (true);

create policy "Public can insert todos" on public.todos
  for insert with check (true);

create policy "Public can update todos" on public.todos
  for update using (true);

create policy "Public can delete todos" on public.todos
  for delete using (true);

insert into public.todos (title, completed, priority, tags, position, deadline) values
  ('Kupić mleko i pieczywo', false, 'medium', array['zakupy'], 1, now() + interval '1 day'),
  ('Zrobić review PR-a', false, 'high', array['praca', 'code'], 2, now() + interval '2 days'),
  ('Pobiegać 5 km', false, 'low', array['sport'], 3, null),
  ('Opłacić rachunek za internet', true, 'high', array['finanse'], 4, now() - interval '1 day'),
  ('Przeczytać dokumentację Supabase RLS', false, 'medium', array['nauka'], 5, now() + interval '7 days');
