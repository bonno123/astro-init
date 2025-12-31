-- Create contact messages table for direct messaging without booking
create table if not exists contact_messages (
   id         text primary key,
   name       text not null,
   email      text not null,
   subject    text not null,
   message    text not null,
   status     text not null default 'new',
   created_at text default current_timestamp,
   updated_at text default current_timestamp
);

-- Create indexes for querying
create index if not exists idx_contact_messages_email on
   contact_messages (
      email
   );
create index if not exists idx_contact_messages_status on
   contact_messages (
      status
   );
create index if not exists idx_contact_messages_created_at on
   contact_messages (
      created_at
   );