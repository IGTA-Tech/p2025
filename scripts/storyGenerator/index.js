#!/usr/bin/env node

/**
 * Story Generator - Automated Story Generation System
 *
 * This script cycles through policy areas, fetches relevant news,
 * generates citizen story narratives using Claude, and submits
 * them to Supabase for testing and bounds checking.
 *
 * Usage:
 *   node scripts/storyGenerator/index.js
 *   npm run generate-story
 *
 * Cron setup (every 20 minutes):
 *   *\/20 * * * * cd /path/to/project && node scripts/storyGenerator/index.js >> logs/story-generator.log 2>&1
 */

import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';

// Get directory name for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from project root FIRST
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

// Import local modules (these don't depend on supabase being initialized at import time)
import { getNextPolicyArea, incrementStoryCount, canMakeNewsRequest, getState } from './policyRotation.js';
import { generateLocationForPolicy } from './locationGenerator.js';
import { generateStoryFromNews } from './newsToStory.js';

// Create Supabase client AFTER dotenv has loaded
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

let supabase = null;
if (supabaseUrl && supabaseAnonKey) {
  supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: { persistSession: false }
  });
  console.log('Supabase client initialized successfully');
} else {
  console.error('Supabase credentials not found in environment');
}

/**
 * Transform story to database format and submit
 */
async function submitStoryToSupabase(story) {
  if (!supabase) {
    throw new Error('Supabase client not initialized. Check environment variables.');
  }

  const { data, error } = await supabase
    .from('citizen_stories')
    .insert([{
      id: story.id,
      submitted_at: story.submittedAt,
      location_zip: story.location.zip,
      location_city: story.location.city || null,
      location_state: story.location.state || null,
      location_county: story.location.county || null,
      location_district: story.location.district || null,
      policy_area: story.policyArea,
      severity: story.severity,
      headline: story.headline,
      story: story.story,
      verification_status: story.verificationStatus,
      verification_score: story.verificationScore,
      evidence: story.evidence || [],
      demographics: story.demographics || {},
      impact: story.impact || {},
      ai_analysis: story.aiAnalysis || {},
      source_reference: story.sourceReference || null,
    }])
    .select()
    .single();

  if (error) {
    console.error('Error submitting story to Supabase:', error);
    throw error;
  }

  return data;
}

/**
 * Generate a unique story ID
 * @returns {string} Story ID in format CS-YYYY-XXXXXXXX
 */
function generateStoryId() {
  const year = new Date().getFullYear();
  const randomPart = crypto.randomBytes(4).toString('hex').toUpperCase();
  return `CS-${year}-${randomPart}`;
}

/**
 * Generate random demographics for the story
 * @returns {object} Demographics object
 */
function generateRandomDemographics() {
  const ages = [22, 25, 28, 32, 35, 38, 42, 45, 48, 52, 55, 58, 62, 65, 68];
  const incomes = ['under-30k', '30-45k', '45-60k', '60-80k', '80-100k', '100-150k'];
  const educations = ['high_school', 'some_college', 'associates', 'bachelors', 'masters', 'doctorate'];
  const parties = ['democrat', 'republican', 'independent', 'independent', 'independent', 'libertarian', 'green'];

  return {
    age: ages[Math.floor(Math.random() * ages.length)],
    income: incomes[Math.floor(Math.random() * incomes.length)],
    education: educations[Math.floor(Math.random() * educations.length)],
    party: parties[Math.floor(Math.random() * parties.length)]
  };
}

/**
 * Main story generation function
 */
async function main() {
  const timestamp = new Date().toISOString();
  console.log(`\n${'='.repeat(60)}`);
  console.log(`[${timestamp}] Story Generator Started`);
  console.log(`${'='.repeat(60)}`);

  // Check rate limits before proceeding
  if (!canMakeNewsRequest()) {
    console.log('Daily NewsAPI limit reached, skipping this run');
    console.log('Exiting with code 0 (normal - will retry next cycle)');
    process.exit(0);
  }

  try {
    // Get next policy area in rotation
    const { policyArea, state } = getNextPolicyArea();
    console.log(`\nPolicy area: ${policyArea}`);
    console.log(`Run number: ${state.generatedStories + 1}`);
    console.log(`Daily news requests: ${state.dailyNewsRequests}/50`);

    // Generate random location weighted for this policy area
    console.log('\nGenerating location...');
    const location = await generateLocationForPolicy(policyArea);
    console.log(`Location: ${location.city}, ${location.state} (${location.zip})`);
    console.log(`District: ${location.district}`);

    // Fetch news and generate story
    console.log('\nGenerating story from news...');
    const storyData = await generateStoryFromNews(policyArea, location);

    if (!storyData) {
      console.error('Failed to generate story data');
      process.exit(1);
    }

    console.log(`\nGenerated headline: "${storyData.headline}"`);
    console.log(`Severity: ${storyData.severity}`);
    console.log(`Story length: ${storyData.story?.length || 0} characters`);

    // Build source reference with generation timestamp
    const sourceReference = storyData._sourceReference ? {
      ...storyData._sourceReference,
      generated_at: new Date().toISOString(),
      policy_area: policyArea
    } : null;

    // Build complete story object matching Supabase schema
    const story = {
      id: generateStoryId(),
      submittedAt: new Date().toISOString(),
      location: location,
      policyArea: policyArea,
      severity: storyData.severity || 'medium',
      verificationStatus: 'pending',
      verificationScore: 0,
      headline: storyData.headline,
      story: storyData.story,
      evidence: storyData.suggestedEvidence || [],
      demographics: generateRandomDemographics(),
      impact: {
        economic: storyData.economicImpact || -10000,
        affected_population: storyData.affectedPopulation || 1000,
        timeframe: '30_days',
        correlation_confidence: 0.75 + (Math.random() * 0.2) // 0.75-0.95
      },
      aiAnalysis: {
        messageResonance: Math.floor(Math.random() * 20) + 70, // 70-90
        demographicAppeal: ['general_public', policyArea === 'healthcare' ? 'seniors' : 'working_families'],
        recommendedTalkingPoints: [policyArea, 'economic_impact', 'local_community'],
        competitiveVulnerability: storyData.severity === 'critical' ? 'high' : 'medium'
      },
      sourceReference: sourceReference
    };

    // Submit to Supabase
    console.log('\nSubmitting story to Supabase...');
    const result = await submitStoryToSupabase(story);
    console.log(`Story submitted successfully!`);
    console.log(`Story ID: ${result.id}`);

    // Update success counter
    const totalStories = incrementStoryCount();
    console.log(`\nTotal stories generated: ${totalStories}`);

    console.log(`\n${'='.repeat(60)}`);
    console.log(`[${new Date().toISOString()}] Story Generation Complete`);
    console.log(`${'='.repeat(60)}\n`);

    process.exit(0);

  } catch (error) {
    console.error('\nStory generation failed:', error.message);
    console.error('Stack trace:', error.stack);

    // Log current state for debugging
    const state = getState();
    console.error('\nCurrent state:', JSON.stringify(state, null, 2));

    process.exit(1);
  }
}

// Run the main function
main();
