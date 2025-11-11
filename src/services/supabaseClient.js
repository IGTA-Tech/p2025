/**
 * Supabase Client for Democratic Accountability Platform
 *
 * Provides real-time database access for citizen stories
 */

import { createClient } from '@supabase/supabase-js';

// Get Supabase credentials from environment variables
// Support both browser (import.meta.env) and Node.js (process.env)
function getSupabaseConfig() {
  const url =
    (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_URL) ||
    (typeof process !== 'undefined' && process.env?.VITE_SUPABASE_URL) ||
    '';

  const key =
    (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_ANON_KEY) ||
    (typeof process !== 'undefined' && process.env?.VITE_SUPABASE_ANON_KEY) ||
    '';

  return { url, key };
}

const { url: supabaseUrl, key: supabaseAnonKey } = getSupabaseConfig();

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase credentials not found. Database features will be disabled.');
}

// Create Supabase client
export const supabase = supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: false, // We don't need auth sessions for this demo
      },
      realtime: {
        params: {
          eventsPerSecond: 10, // Limit real-time events
        },
      },
    })
  : null;

/**
 * Submit a new citizen story to Supabase
 * @param {Object} story - The story object to submit
 * @returns {Promise<Object>} The inserted story
 */
export async function submitStory(story) {
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
    }])
    .select()
    .single();

  if (error) {
    console.error('Error submitting story to Supabase:', error);
    throw error;
  }

  return transformStoryFromDB(data);
}

/**
 * Fetch all citizen stories from Supabase
 * @returns {Promise<Array>} Array of stories
 */
export async function fetchStories() {
  if (!supabase) {
    throw new Error('Supabase client not initialized. Check environment variables.');
  }

  const { data, error } = await supabase
    .from('citizen_stories')
    .select('*')
    .order('submitted_at', { ascending: false });

  if (error) {
    console.error('Error fetching stories from Supabase:', error);
    throw error;
  }

  return data.map(transformStoryFromDB);
}

/**
 * Update a story's verification data
 * @param {string} storyId - The story ID
 * @param {Object} updates - Fields to update
 * @returns {Promise<Object>} Updated story
 */
export async function updateStory(storyId, updates) {
  if (!supabase) {
    throw new Error('Supabase client not initialized. Check environment variables.');
  }

  const dbUpdates = {};

  if (updates.verificationStatus) dbUpdates.verification_status = updates.verificationStatus;
  if (updates.verificationScore !== undefined) dbUpdates.verification_score = updates.verificationScore;
  if (updates.location) {
    if (updates.location.city) dbUpdates.location_city = updates.location.city;
    if (updates.location.state) dbUpdates.location_state = updates.location.state;
    if (updates.location.county) dbUpdates.location_county = updates.location.county;
    if (updates.location.district) dbUpdates.location_district = updates.location.district;
  }
  if (updates.demographics) dbUpdates.demographics = updates.demographics;
  if (updates.impact) dbUpdates.impact = updates.impact;
  if (updates.aiAnalysis) dbUpdates.ai_analysis = updates.aiAnalysis;

  const { data, error } = await supabase
    .from('citizen_stories')
    .update(dbUpdates)
    .eq('id', storyId)
    .select()
    .single();

  if (error) {
    console.error('Error updating story:', error);
    throw error;
  }

  return transformStoryFromDB(data);
}

/**
 * Subscribe to real-time story updates
 * @param {Function} callback - Called when stories are inserted/updated/deleted
 * @returns {Object} Subscription object (call .unsubscribe() to stop)
 */
export function subscribeToStories(callback) {
  if (!supabase) {
    console.warn('Supabase client not initialized. Real-time updates disabled.');
    return { unsubscribe: () => {} }; // Return dummy subscription
  }

  const subscription = supabase
    .channel('citizen_stories_changes')
    .on('postgres_changes',
      { event: '*', schema: 'public', table: 'citizen_stories' },
      (payload) => {
        console.log('Real-time update received:', payload);

        if (payload.eventType === 'INSERT') {
          callback({
            type: 'INSERT',
            story: transformStoryFromDB(payload.new),
          });
        } else if (payload.eventType === 'UPDATE') {
          callback({
            type: 'UPDATE',
            story: transformStoryFromDB(payload.new),
          });
        } else if (payload.eventType === 'DELETE') {
          callback({
            type: 'DELETE',
            storyId: payload.old.id,
          });
        }
      }
    )
    .subscribe();

  return subscription;
}

/**
 * Transform database row to story object format
 * @param {Object} dbRow - Database row
 * @returns {Object} Story object
 */
function transformStoryFromDB(dbRow) {
  return {
    id: dbRow.id,
    submittedAt: dbRow.submitted_at,
    location: {
      zip: dbRow.location_zip,
      city: dbRow.location_city,
      state: dbRow.location_state,
      county: dbRow.location_county,
      district: dbRow.location_district,
    },
    policyArea: dbRow.policy_area,
    severity: dbRow.severity,
    verificationStatus: dbRow.verification_status,
    verificationScore: dbRow.verification_score,
    headline: dbRow.headline,
    story: dbRow.story,
    evidence: dbRow.evidence || [],
    demographics: dbRow.demographics || {},
    impact: dbRow.impact || {},
    aiAnalysis: dbRow.ai_analysis || {},
  };
}

export default {
  supabase,
  submitStory,
  fetchStories,
  updateStory,
  subscribeToStories,
};
