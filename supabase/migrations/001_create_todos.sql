-- supabase/migrations/001_create_todos.sql

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
  user_id     uuid not null references auth.users(id) on delete cascade
);

-- Trigger: automatyczna aktualizacja updated_at
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

-- Row Level Security — dostęp tylko do własnych zadań
alter table public.todos enable row level security;

create policy "Users can view own todos" on public.todos
  for select using (auth.uid() = user_id);

create policy "Users can insert own todos" on public.todos
  for insert with check (auth.uid() = user_id);

create policy "Users can update own todos" on public.todos
  for update using (auth.uid() = user_id);

create policy "Users can delete own todos" on public.todos
  for delete using (auth.uid() = user_id);
