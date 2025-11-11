/**
 * Test saving a transportation story to Supabase
 */

import dotenv from 'dotenv';

// Load environment variables FIRST
dotenv.config();

console.log('🧪 Testing story submission to Supabase...\n');

// Dynamic import AFTER environment variables are loaded
const { submitStory } = await import('./src/services/supabaseClient.js');

// Create a test transportation story similar to what user submitted
const testStory = {
  id: 'CS-2025-TEST-TRANSPORT',
  submittedAt: new Date().toISOString(),
  location: {
    zip: '28202',
    city: 'Charlotte',
    state: 'NC',
    county: 'Mecklenburg',
    district: 'NC-12'
  },
  policyArea: 'infrastructure',
  severity: 'high',
  headline: 'Delays on the light rail are making me late for work every day',
  story: 'The LYNX Blue Line has been experiencing constant delays and breakdowns. I rely on public transit to get to work, but lately I have been late 3-4 times per week because trains break down or get stuck. This is affecting my job performance and I am worried about losing my position. We need better investment in our public transportation infrastructure.',
  verificationStatus: 'pending',
  verificationScore: 75,
  evidence: [],
  demographics: {},
  impact: {
    economic: 0,
    affected_population: 0,
    timeframe: 'unknown',
    correlation_confidence: 0
  },
  aiAnalysis: {
    messageResonance: 78,
    demographicAppeal: ['commuters', 'transit-dependent'],
    recommendedTalkingPoints: ['Infrastructure investment', 'Public transit reliability'],
    competitiveVulnerability: 'medium'
  }
};

console.log('Attempting to save story:', testStory.headline);
console.log('Policy Area:', testStory.policyArea);
console.log('Location:', `${testStory.location.city}, ${testStory.location.state} ${testStory.location.zip}`);
console.log('');

try {
  const result = await submitStory(testStory);
  console.log('✅ SUCCESS! Story saved to Supabase.');
  console.log('Returned story ID:', result.id);
  console.log('');
  console.log('Full returned story:', JSON.stringify(result, null, 2));
} catch (error) {
  console.error('❌ FAILED to save story to Supabase');
  console.error('Error:', error.message);
  console.error('');
  console.error('Full error:', error);

  // Check for specific common issues
  if (error.message.includes('violates row-level security')) {
    console.error('\n⚠️  Row Level Security Policy Issue');
    console.error('The INSERT policy may be blocking the save.');
    console.error('Check Supabase dashboard → Authentication → Policies');
  } else if (error.message.includes('null value')) {
    console.error('\n⚠️  NULL value constraint violation');
    console.error('A required field is missing or null.');
  } else if (error.message.includes('duplicate key')) {
    console.error('\n⚠️  Duplicate ID');
    console.error('A story with this ID already exists.');
  }

  process.exit(1);
}
