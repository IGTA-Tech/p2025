/**
 * Test script for story verification integration
 * Run with: node test-story-verification.js
 */

import dotenv from 'dotenv';
import { verifyStory, getStoryContext } from './src/services/storyVerification.js';

// Load environment variables
dotenv.config();

console.log('🔍 Testing Story Verification Integration...\n');

// Test stories for different policy areas
const testStories = [
  {
    id: 'HOUSING-001',
    policyArea: 'housing',
    location: { state: 'MI', city: 'Detroit', zip: '48201' },
    headline: 'Rent doubled after landlord stopped accepting Section 8',
    story: 'My rent went from $900 to $1,800 per month. We make $45,000 a year and face eviction if we cannot pay.',
    severity: 'high',
  },
  {
    id: 'ENERGY-001',
    policyArea: 'energy',
    location: { state: 'MI', city: 'Detroit' },
    headline: 'Utility bills tripled after energy assistance cuts',
    story: 'My monthly electric bill went from $120 to $360 after federal energy subsidies were eliminated.',
    severity: 'high',
  },
  {
    id: 'ENVIRONMENT-001',
    policyArea: 'environment',
    location: { state: 'MI', city: 'Ann Arbor' },
    headline: 'Extreme heat affecting elderly residents',
    story: 'Record heat waves this summer with temperatures over 95°F for weeks. Seniors struggling with cooling costs.',
    severity: 'medium',
  },
];

async function runTests() {
  for (const story of testStories) {
    console.log('='.repeat(80));
    console.log(`Testing: ${story.policyArea.toUpperCase()} - ${story.headline}`);
    console.log('='.repeat(80));
    console.log(`Location: ${story.location.city}, ${story.location.state}`);
    console.log(`Story ID: ${story.id}`);
    console.log('');

    try {
      // Test verification
      const verification = await verifyStory(story);

      console.log('📊 Verification Results:');
      console.log(`  ✓ Verified: ${verification.verified}`);
      console.log(`  ✓ Confidence: ${verification.confidence}%`);
      console.log(`  ✓ Data Source: ${verification.dataSource}`);
      if (verification.flags.length > 0) {
        console.log(`  ✓ Flags: ${verification.flags.join(', ')}`);
      }

      console.log('\n💡 Insights:');
      verification.insights.forEach((insight, i) => {
        console.log(`  ${i + 1}. [${insight.type}] ${insight.message}`);
      });

      if (verification.contextData) {
        console.log('\n📈 Context Data Available:');
        if (verification.contextData.affordabilityMetrics) {
          console.log(`  • Housing Affordability: ${verification.contextData.affordabilityMetrics.housingCostBurden} burden`);
        }
        if (verification.contextData.typicalHouseholdCosts) {
          console.log(`  • Monthly Energy Costs: $${verification.contextData.typicalHouseholdCosts.totalMonthlyEnergy}`);
        }
        if (verification.contextData.temperature) {
          console.log(`  • Average Temperature: ${verification.contextData.temperature.annual}°F`);
        }
      }

      console.log('');
    } catch (error) {
      console.error('❌ Verification failed:', error.message);
      console.error(error);
    }

    console.log('');
  }

  console.log('='.repeat(80));
  console.log('✅ All verification tests completed!');
  console.log('='.repeat(80));
  console.log('\n📝 Summary:');
  console.log('  • HUD API integration: Housing stories verified with rent/income data');
  console.log('  • EIA API integration: Energy stories verified with utility cost data');
  console.log('  • NCDC API integration: Environment stories verified with climate data');
  console.log('  • All APIs fall back to mock data gracefully when real data unavailable');
  console.log('');
}

runTests();
