-- Integration configs per company
create table if not exists integration_configs (
  id          uuid primary key default gen_random_uuid(),
  company_id  uuid not null references companies(id) on delete cascade,
  key         text not null,
  value       text not null default '',
  created_at  timestamptz default now(),
  updated_at  timestamptz default now(),
  unique(company_id, key)
);

alter table integration_configs enable row level security;

create policy "Users can manage their company integration configs"
  on integration_configs for all
  using (
    company_id in (
      select company_id from users where id = auth.uid()
    )
  )
  with check (
    company_id in (
      select company_id from users where id = auth.uid()
    )
  );
