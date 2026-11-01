alter table public.leads
  add column if not exists cities text[] not null default '{}';

grant select, insert, update, delete on public.leads to authenticated;
