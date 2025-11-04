-- Enable Realtime for chats and files tables
-- This allows the frontend to subscribe to database changes

-- Enable Realtime replication for chats table
ALTER PUBLICATION supabase_realtime ADD TABLE chats;

-- Enable Realtime replication for files table
ALTER PUBLICATION supabase_realtime ADD TABLE files;

-- Ensure RLS is enabled (should already be enabled)
ALTER TABLE chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE files ENABLE ROW LEVEL SECURITY;

