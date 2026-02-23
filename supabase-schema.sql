-- Create submissions table in Supabase
-- Run this in Supabase SQL Editor: https://supabase.com/dashboard/project/_/sql
CREATE TABLE submissions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL,
  problem TEXT,
  interest_type TEXT NOT NULL CHECK (interest_type IN ('product', 'freelance')),
  urgency TEXT CHECK (urgency IN ('low', 'medium', 'high', 'urgent')),
  description TEXT,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
-- Create index for faster queries
CREATE INDEX idx_submissions_created_at ON submissions(created_at DESC);
CREATE INDEX idx_submissions_interest ON submissions(interest_type);
-- Enable Row Level Security (RLS) - required by Supabase
ALTER TABLE submissions ENABLE ROW LEVEL SECURITY;
-- Create policy to allow inserts from anyone (for form submissions)
CREATE POLICY "Allow public inserts" ON submissions FOR
INSERT TO anon WITH CHECK (true);
-- Create policy to allow you to view all submissions (when logged in as admin)
CREATE POLICY "Allow admin to view all" ON submissions FOR
SELECT TO authenticated USING (true);
-- Success! Table created.
-- You can view submissions in: Supabase Dashboard > Table Editor > submissions