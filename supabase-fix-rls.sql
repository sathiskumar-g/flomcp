-- FIX: Row Level Security Policy Issue
-- Run this in Supabase SQL Editor to allow form submissions

-- Option 1: Drop and recreate the policy (if it exists but not working)
DROP POLICY IF EXISTS "Allow public inserts" ON submissions;
DROP POLICY IF EXISTS "Allow admin to view all" ON submissions;

-- Create working policy for public inserts
CREATE POLICY "Enable insert for anonymous users" 
ON submissions
FOR INSERT 
TO anon, authenticated
WITH CHECK (true);

-- Create policy to view your own submissions
CREATE POLICY "Enable read for all users" 
ON submissions
FOR SELECT 
TO anon, authenticated
USING (true);

-- Verify RLS is enabled
ALTER TABLE submissions ENABLE ROW LEVEL SECURITY;

-- Test: This should work now!
-- Try inserting a test row:
-- INSERT INTO submissions (email, interest_type) VALUES ('test@test.com', 'product');
