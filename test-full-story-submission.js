/**
 * Test complete story submission flow with zip code lookup
 */

import dotenv from 'dotenv';
dotenv.config();

import { lookupZipCode } from './src/services/zipLookup.js';
import { createClient } from '@supabase/supabase-js';

async function testFullSubmission() {
  console.log('\n=== Testing Full Story Submission with Zip Lookup ===\n');

  // Step 1: Look up zip code
  const zipCode = '28202';
  console.log(`Step 1: Looking up zip code ${zipCode}...`);
  const location = await lookupZipCode(zipCode);
  console.log('Location data:', JSON.stringify(location, null, 2));
  console.log('');

  // Step 2: Create story object (simulating what ConversationalInput creates)
  const conversationalStory = {
    messages: [
      { text: 'Healthcare costs have doubled in my area' },
      { text: 'Started happening last month' }
    ],
    timestamp: new Date(),
    score: {
      overall: 92,
      dataMatch: 94,
      timelineConsistency: 91,
      geographicVerification: 90,
      policyCorrelation: 88
    },
    summary: 'Healthcare costs have doubled in my area. Started happening last month',
    location: location  // Location from zip lookup
  };

  console.log('Step 2: Conversational story object created');
  console.log('Location in story:', JSON.stringify(conversationalStory.location, null, 2));
  console.log('');

  // Step 3: Transform to Supabase format (simulating what App.jsx does)
  const storyId = `test_full_${Date.now()}`;
  const headline = conversationalStory.messages[0].text.slice(0, 200);
  const fullStory = conversationalStory.messages.map(m => m.text).join('\n\n');

  const storyToSubmit = {
    id: storyId,
    submittedAt: conversationalStory.timestamp.toISOString(),
    location: conversationalStory.location || {
      zip: '00000',
      city: null,
      state: null,
      county: null,
      district: null,
    },
    policyArea: 'healthcare',
    severity: 'high',
    headline: headline,
    story: fullStory,
    verificationStatus: 'verified',
    verificationScore: conversationalStory.score.overall,
    evidence: [],
    demographics: {},
    impact: {
      economic: 0,
      affected_population: 1,
      timeframe: 'recent',
      correlation_confidence: conversationalStory.score.policyCorrelation || 0,
    },
    aiAnalysis: {
      dataMatch: conversationalStory.score.dataMatch || 0,
      timelineConsistency: conversationalStory.score.timelineConsistency || 0,
      geographicVerification: conversationalStory.score.geographicVerification || 0,
      policyCorrelation: conversationalStory.score.policyCorrelation || 0,
    },
  };

  console.log('Step 3: Story formatted for Supabase');
  console.log('Location details:');
  console.log(`  Zip: ${storyToSubmit.location.zip}`);
  console.log(`  City: ${storyToSubmit.location.city}`);
  console.log(`  State: ${storyToSubmit.location.state}`);
  console.log(`  County: ${storyToSubmit.location.county}`);
  console.log(`  District: ${storyToSubmit.location.district}`);
  console.log('');

  // Step 4: Submit to Supabase
  console.log('Step 4: Submitting to Supabase...');

  const supabase = createClient(
    process.env.VITE_SUPABASE_URL,
    process.env.VITE_SUPABASE_ANON_KEY
  );

  try {
    const { data, error } = await supabase
      .from('citizen_stories')
      .insert([{
        id: storyToSubmit.id,
        submitted_at: storyToSubmit.submittedAt,
        location_zip: storyToSubmit.location.zip,
        location_city: storyToSubmit.location.city,
        location_state: storyToSubmit.location.state,
        location_county: storyToSubmit.location.county,
        location_district: storyToSubmit.location.district,
        policy_area: storyToSubmit.policyArea,
        severity: storyToSubmit.severity,
        headline: storyToSubmit.headline,
        story: storyToSubmit.story,
        verification_status: storyToSubmit.verificationStatus,
        verification_score: storyToSubmit.verificationScore,
        evidence: storyToSubmit.evidence,
        demographics: storyToSubmit.demographics,
        impact: storyToSubmit.impact,
        ai_analysis: storyToSubmit.aiAnalysis,
      }])
      .select()
      .single();

    if (error) throw error;

    const result = {
      id: data.id,
      location: {
        zip: data.location_zip,
        city: data.location_city,
        state: data.location_state,
        county: data.location_county,
        district: data.location_district,
      },
      headline: data.headline,
      policyArea: data.policy_area,
      verificationScore: data.verification_score,
    };
    console.log('\n✅ SUCCESS! Story submitted to Supabase');
    console.log('\nReturned data from database:');
    console.log(`  ID: ${result.id}`);
    console.log(`  Zip: ${result.location.zip}`);
    console.log(`  City: ${result.location.city}`);
    console.log(`  State: ${result.location.state}`);
    console.log(`  County: ${result.location.county}`);
    console.log(`  District: ${result.location.district}`);
    console.log(`  Headline: ${result.headline}`);
    console.log(`  Policy Area: ${result.policyArea}`);
    console.log(`  Verification Score: ${result.verificationScore}`);
    console.log('');

    // Verify all location fields are populated correctly
    if (result.location.zip === '28202' &&
        result.location.city === 'Charlotte' &&
        result.location.state === 'NC') {
      console.log('✅ All location fields saved correctly to Supabase!\n');
    } else {
      console.log('❌ Location data mismatch!');
      console.log('Expected: Charlotte, NC 28202');
      console.log(`Got: ${result.location.city}, ${result.location.state} ${result.location.zip}\n`);
    }

  } catch (error) {
    console.error('\n❌ Error submitting story:', error);
    process.exit(1);
  }
}

testFullSubmission();
