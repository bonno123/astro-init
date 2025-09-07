-- Drop existing table if it exists
drop table if exists messages;

-- Create users table to store basic user information
create table users (
   id         integer primary key,
   name       text, -- Can be null for anonymous users
   email      text, -- Can be null for anonymous users
   session_id text unique, -- For identifying returning anonymous users
   created_at timestamp default current_timestamp
);

-- Create threads table to organize conversations
create table threads (
   id         integer primary key,
   subject    text not null,
   status     text default 'open', -- open, closed, archived
   created_at timestamp default current_timestamp,
   updated_at timestamp default current_timestamp
);

-- Create messages table with improved schema
create table messages (
   id         integer primary key,
   thread_id  integer not null,
   user_id    integer not null,
   content    text not null,
   is_read    boolean default false,
   created_at timestamp default current_timestamp,
   foreign key ( thread_id )
      references threads ( id ),
   foreign key ( user_id )
      references users ( id )
);

-- Create an index for faster message retrieval by thread
create index idx_messages_thread_id on
   messages (
      thread_id
   );

-- Create an index for faster message retrieval by user
create index idx_messages_user_id on
   messages (
      user_id
   );