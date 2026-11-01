alter table public.leads
  add column if not exists cities text[] not null default '{}';
