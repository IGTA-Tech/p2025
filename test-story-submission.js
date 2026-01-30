/**
 * Test script to verify story submission to Supabase
 */

import dotenv from 'dotenv';
dotenv.config();

// Debug: Check if env vars are loaded
console.log('Environment check:');
console.log('VITE_SUPABASE_URL:', process.env.VITE_SUPABASE_URL ? 'SET' : 'NOT SET');
console.log('VITE_SUPABASE_ANON_KEY:', process.env.VITE_SUPABASE_ANON_KEY ? 'SET' : 'NOT SET');
console.log('');

import { submitStory } from './src/services/supabaseClient.js';

async function testStorySubmission() {
  console.log('Testing story submission to Supabase...\n');

  const testStory = {
    id: `test_story_${Date.now()}`,
    submittedAt: new Date().toISOString(),
    location: {
      zip: '90210',
      city: 'Beverly Hills',
      state: 'CA',
      county: 'Los Angeles',
      district: 'CA-30',
    },
    policyArea: 'healthcare',
    severity: 'high',
    headline: 'Insurance costs doubled after policy change',
    story: 'My health insurance premiums have doubled since the new policy went into effect last month. I can barely afford my medications now.',
    verificationStatus: 'verified',
    verificationScore: 92,
    evidence: [],
    demographics: {
      age_range: '45-54',
      household_size: 3,
    },
    impact: {
      economic: 500,
      affected_population: 1,
      timeframe: 'recent',
      correlation_confidence: 88,
    },
    aiAnalysis: {
      dataMatch: 94,
      timelineConsistency: 91,
      geographicVerification: 90,
      policyCorrelation: 88,
    },
  };

  try {
    console.log('Submitting test story:', JSON.stringify(testStory, null, 2));
    const result = await submitStory(testStory);
    console.log('\n✅ SUCCESS! Story submitted to Supabase:');
    console.log(JSON.stringify(result, null, 2));
  } catch (error) {
    console.error('\n❌ ERROR submitting story:', error);
    process.exit(1);
  }
}

testStorySubmission();
