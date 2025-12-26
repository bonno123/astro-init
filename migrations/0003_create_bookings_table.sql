-- Create bookings table for call scheduling
create table if not exists bookings (
   id               text primary key,
   name             text not null,
   email            text not null,
   topic            text not null,
   details          text,
   status           text not null default 'pending',
   start_at         text not null,
   duration_minutes integer not null default 30,
   meet_link        text,
   created_at       text default current_timestamp,
   updated_at       text default current_timestamp
);

-- Create index for querying overlapping bookings
create index if not exists idx_bookings_start_at on
   bookings (
      start_at
   );
create index if not exists idx_bookings_status on
   bookings (
      status
   );
create index if not exists idx_bookings_email on
   bookings (
      email
   );

-- Create availability slots table (optional: pre-set working hours)
create table if not exists availability_slots (
   id               text primary key,
   day_of_week      integer not null,
   start_time       text not null,
   end_time         text not null,
   duration_minutes integer not null default 30,
   is_active        integer not null default 1,
   created_at       text default current_timestamp
);