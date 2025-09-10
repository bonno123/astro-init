-- edit_messages.sql

-- 1. Clear existing users and messages to avoid conflicts
delete from messages;
delete from users;

-- -- 2. Re-insert users with updated session_ids and usernames
insert into users (
   name,
   email,
   session_id,
   username,
   password_hash,
   is_admin,
   auth_method
) values ( 'Olivia Hart',
           'olivia.hart@example.com',
           '78e122fc-fy53-4260-bd41-ccd568589090',
           'thankyousomuch',
           'hash1',
           0,
           'session' ),( 'Ethan Clarke',
                         'ethan.clarke@example.com',
                         '85346b9b-1970-495c-813b-4a2cb8725e12',
                         'justsquiggles',
                         'hash2',
                         0,
                         'session' );

-- 3. Re-insert messages with updated content
insert into messages (
   thread_id,
   user_id,
   content
) values ( 1,
           2,
           'oh no you don''t!' ),( 1,
                                   1,
                                   'I can take it back to my art teacher' ),( 1,
                                                                              2,
                                                                              'Nice try, but it''s just squiggles and chaos' )
                                                                              ;