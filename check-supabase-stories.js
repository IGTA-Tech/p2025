/**
 * Check Supabase for stored citizen stories
 */

import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

console.log('🔍 Checking Supabase for citizen stories...\n');
console.log(`Supabase URL: ${supabaseUrl}`);
console.log(`Has Anon Key: ${supabaseAnonKey ? 'Yes' : 'No'}\n`);

const supabase = createClient(supabaseUrl, supabaseAnonKey);

try {
  // Fetch all stories, most recent first
  const { data, error } = await supabase
    .from('citizen_stories')
    .select('*')
    .order('submitted_at', { ascending: false });

  if (error) {
    console.error('❌ Error fetching stories:', error);
    process.exit(1);
  }

  console.log(`\n✅ Found ${data.length} stories in Supabase:\n`);

  // Show all stories with focus on transportation/infrastructure
  data.forEach((story, i) => {
    const isTransportation = story.policy_area === 'infrastructure' ||
                            story.headline.toLowerCase().includes('train') ||
                            story.headline.toLowerCase().includes('transport') ||
                            story.headline.toLowerCase().includes('rail') ||
                            story.headline.toLowerCase().includes('transit');

    const marker = isTransportation ? '🚂 <<<< TRANSPORTATION' : '';

    console.log(`${i + 1}. ${story.headline} ${marker}`);
    console.log(`   ID: ${story.id}`);
    console.log(`   Policy Area: ${story.policy_area}`);
    console.log(`   Location: ${story.location_city}, ${story.location_state} ${story.location_zip}`);
    console.log(`   Submitted: ${new Date(story.submitted_at).toLocaleString()}`);
    console.log(`   Verification: ${story.verification_status} (Score: ${story.verification_score})`);
    console.log(`   Story: ${story.story.substring(0, 100)}...`);
    console.log('');
  });

  // Look specifically for recent transportation stories (last 30 minutes)
  const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000).toISOString();
  const recentTransport = data.filter(s =>
    s.submitted_at > thirtyMinutesAgo &&
    (s.policy_area === 'infrastructure' ||
     s.headline.toLowerCase().includes('train') ||
     s.headline.toLowerCase().includes('transport'))
  );

  if (recentTransport.length > 0) {
    console.log(`\n🎯 Found ${recentTransport.length} recent transportation-related stories:\n`);
    recentTransport.forEach(s => {
      console.log(`  - "${s.headline}"`);
      console.log(`    Submitted: ${new Date(s.submitted_at).toLocaleString()}`);
      console.log(`    ${s.location_city}, ${s.location_state}\n`);
    });
  } else {
    console.log('\n⚠️  No transportation stories found in the last 30 minutes.');
    console.log('This suggests the story was NOT saved to Supabase.\n');
  }

} catch (err) {
  console.error('❌ Connection error:', err);
  process.exit(1);
}
