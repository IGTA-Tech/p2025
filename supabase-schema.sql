-- Democratic Accountability Platform - Supabase Schema
-- Run this SQL in your Supabase SQL Editor to create the citizen_stories table

-- Enable Row Level Security (RLS)
-- This allows us to set fine-grained permissions on the table

-- Create citizen_stories table
CREATE TABLE IF NOT EXISTS citizen_stories (
  -- Primary key and metadata
  id TEXT PRIMARY KEY,
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Location data
  location_zip TEXT NOT NULL,
  location_city TEXT,
  location_state TEXT,
  location_county TEXT,
  location_district TEXT,

  -- Story content
  policy_area TEXT NOT NULL,
  severity TEXT DEFAULT 'medium',
  headline TEXT NOT NULL,
  story TEXT NOT NULL,

  -- Verification
  verification_status TEXT DEFAULT 'pending',
  verification_score INTEGER DEFAULT 0,

  -- Evidence (stored as JSON array of file references)
  evidence JSONB DEFAULT '[]'::jsonb,

  -- Demographics (JSON object)
  demographics JSONB DEFAULT '{}'::jsonb,

  -- Impact metrics (JSON object)
  impact JSONB DEFAULT '{
    "economic": 0,
    "affected_population": 0,
    "timeframe": "unknown",
    "correlation_confidence": 0
  }'::jsonb,

  -- AI Analysis (JSON object)
  ai_analysis JSONB DEFAULT '{
    "messageResonance": 0,
    "demographicAppeal": [],
    "recommendedTalkingPoints": [],
    "competitiveVulnerability": "unknown"
  }'::jsonb,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_citizen_stories_policy_area ON citizen_stories(policy_area);
CREATE INDEX IF NOT EXISTS idx_citizen_stories_state ON citizen_stories(location_state);
CREATE INDEX IF NOT EXISTS idx_citizen_stories_verification_status ON citizen_stories(verification_status);
CREATE INDEX IF NOT EXISTS idx_citizen_stories_submitted_at ON citizen_stories(submitted_at DESC);

-- Enable Row Level Security
ALTER TABLE citizen_stories ENABLE ROW LEVEL SECURITY;

-- Create policies for public access (since this is a demo)
-- In production, you'd want more restrictive policies

-- Allow anyone to read stories
CREATE POLICY "Enable read access for all users" ON citizen_stories
  FOR SELECT
  USING (true);

-- Allow anyone to insert stories (citizen submissions)
CREATE POLICY "Enable insert access for all users" ON citizen_stories
  FOR INSERT
  WITH CHECK (true);

-- Allow anyone to update stories (for verification updates)
CREATE POLICY "Enable update access for all users" ON citizen_stories
  FOR UPDATE
  USING (true);

-- Create a function to automatically update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to call the function
DROP TRIGGER IF EXISTS update_citizen_stories_updated_at ON citizen_stories;
CREATE TRIGGER update_citizen_stories_updated_at
  BEFORE UPDATE ON citizen_stories
  FOR EACH ROW
  EXECUTE PROCEDURE update_updated_at_column();

-- Enable Realtime for live updates
ALTER PUBLICATION supabase_realtime ADD TABLE citizen_stories;

-- Success message
DO $$
BEGIN
  RAISE NOTICE 'citizen_stories table created successfully!';
  RAISE NOTICE 'Table is ready for real-time subscriptions.';
  RAISE NOTICE 'You can now submit stories from the Citizen Portal.';
END $$;
