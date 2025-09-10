-- reset_and_seed.sql
-- 1. Delete all data
DELETE FROM messages;
DELETE FROM threads; 
DELETE FROM users;

-- 2. Add auth columns to users table (skip if they already exist)
-- Note: If columns exist, these will fail silently - that's OK
ALTER TABLE users ADD COLUMN username TEXT;
ALTER TABLE users ADD COLUMN password_hash TEXT;
ALTER TABLE users ADD COLUMN is_admin INTEGER;
ALTER TABLE users ADD COLUMN auth_method TEXT;

-- Create unique index for username (SQLite compatible)
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_username ON users(username);

-- 3. Seed a single thread: 'Troll Section'
INSERT INTO threads (subject, status) VALUES ('Troll Section', 'open');

-- 4. Seed two users
INSERT INTO users (name, email, session_id, username, password_hash, is_admin, auth_method) VALUES
('Olivia Hart', 'olivia.hart@example.com', 'session_olivia', 'olivia.hart', 'hash1', 0, 'session'),
('Ethan Clarke', 'ethan.clarke@example.com', 'session_ethan', 'ethan.clarke', 'hash2', 0, 'session');

-- 5. Seed two messages in the 'Troll Section' thread (thread_id = 1)
INSERT INTO messages (thread_id, user_id, content) VALUES
(1, 1, 'Well, I''d explain it to you, but I left my crayons at home.'),
(1, 2, 'Nice try, but your argument has more holes than Swiss cheese.');