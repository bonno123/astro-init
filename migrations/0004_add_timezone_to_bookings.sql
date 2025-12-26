-- Add timezone column to bookings to record the requester's preferred timezone
ALTER TABLE bookings ADD COLUMN timezone TEXT;

-- Optional: index timezone for filtering/searching later
CREATE INDEX IF NOT EXISTS idx_bookings_timezone ON bookings(timezone);
