/**
 * Direct test of Supabase connection using dynamic import
 */

import dotenv from 'dotenv';
dotenv.config();

console.log('\n=== Direct Supabase Connection Test ===\n');
console.log('Environment variables:');
console.log('URL:', process.env.VITE_SUPABASE_URL);
console.log('Key:', process.env.VITE_SUPABASE_ANON_KEY ? '[REDACTED]' : 'NOT SET');
console.log('');

// Dynamically import after env is set
const { createClient } = await import('@supabase/supabase-js');

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

console.log('✅ Supabase client created successfully\n');

// Test story submission
const testStory = {
  id: `direct_test_${Date.now()}`,
  submitted_at: new Date().toISOString(),
  location_zip: '90210',
  location_city: 'Beverly Hills',
  location_state: 'CA',
  location_county: 'Los Angeles',
  location_district: 'CA-30',
  policy_area: 'healthcare',
  severity: 'high',
  headline: 'Insurance costs doubled after policy change',
  story: 'My health insurance premiums have doubled since the new policy went into effect last month. I can barely afford my medications now.',
  verification_status: 'verified',
  verification_score: 92,
  evidence: [],
  demographics: { age_range: '45-54', household_size: 3 },
  impact: {
    economic: 500,
    affected_population: 1,
    timeframe: 'recent',
    correlation_confidence: 88,
  },
  ai_analysis: {
    dataMatch: 94,
    timelineConsistency: 91,
    geographicVerification: 90,
    policyCorrelation: 88,
  },
};

console.log('Submitting test story to Supabase...');
try {
  const { data, error } = await supabase
    .from('citizen_stories')
    .insert([testStory])
    .select()
    .single();

  if (error) {
    console.error('\n❌ Error from Supabase:', error);
    process.exit(1);
  }

  console.log('\n✅ SUCCESS! Story inserted into Supabase:');
  console.log(JSON.stringify(data, null, 2));
  console.log('\nStory ID:', data.id);
  console.log('Submitted at:', data.submitted_at);
} catch (err) {
  console.error('\n❌ Exception:', err);
  process.exit(1);
}
