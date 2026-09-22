create table if not exists conversation (
  id                   uuid primary key default gen_random_uuid(),
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now(),
  ip_hash              text not null,
  status               text not null default 'aberta',
  contact_name         text,
  contact_email        text,
  contact_phone        text,
  summary              jsonb,
  summary_updated_at   timestamptz,
  summary_attempted_at timestamptz,
  summary_input_hash   text
);

create table if not exists message (
  id              bigserial primary key,
  conversation_id uuid not null references conversation(id) on delete cascade,
  role            text not null check (role in ('user', 'assistant')),
  content         text not null,
  incomplete      boolean not null default false,
  created_at      timestamptz not null default now()
);

create index if not exists message_conversation_idx on message (conversation_id, id);
create index if not exists conversation_ip_recent_idx on conversation (ip_hash, created_at desc);
create index if not exists conversation_created_idx on conversation (created_at desc);
