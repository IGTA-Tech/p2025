/**
 * Policy Rotation State Management
 *
 * Tracks which policy area to use next across cron runs.
 * Persists state to a JSON file so rotation continues between process restarts.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { POLICY_AREAS, DAILY_NEWS_LIMIT } from './config.js';

// Get directory name for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const STATE_FILE = path.join(__dirname, 'state.json');

/**
 * Default state structure
 */
function getDefaultState() {
  return {
    currentIndex: 0,
    lastRun: null,
    generatedStories: 0,
    dailyNewsRequests: 0,
    lastResetDate: new Date().toDateString()
  };
}

/**
 * Load state from file, return default if doesn't exist
 */
function loadState() {
  try {
    if (fs.existsSync(STATE_FILE)) {
      const data = fs.readFileSync(STATE_FILE, 'utf8');
      return JSON.parse(data);
    }
  } catch (error) {
    console.error('Error loading state file:', error.message);
  }
  return getDefaultState();
}

/**
 * Save state to file
 */
function saveState(state) {
  try {
    fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));
  } catch (error) {
    console.error('Error saving state file:', error.message);
  }
}

/**
 * Get the next policy area in rotation and advance the index
 * @returns {{ policyArea: string, state: object }}
 */
export function getNextPolicyArea() {
  const state = loadState();

  // Reset daily counter if new day
  const today = new Date().toDateString();
  if (state.lastResetDate !== today) {
    console.log('New day detected, resetting daily counters');
    state.dailyNewsRequests = 0;
    state.lastResetDate = today;
  }

  // Get current policy area
  const policyArea = POLICY_AREAS[state.currentIndex];

  // Advance to next policy area (wraps around)
  state.currentIndex = (state.currentIndex + 1) % POLICY_AREAS.length;
  state.lastRun = new Date().toISOString();
  state.dailyNewsRequests++;

  saveState(state);

  return { policyArea, state };
}

/**
 * Increment the successful story count
 */
export function incrementStoryCount() {
  const state = loadState();
  state.generatedStories++;
  saveState(state);
  return state.generatedStories;
}

/**
 * Check if we can make a news request (respecting daily limit)
 * @returns {boolean}
 */
export function canMakeNewsRequest() {
  const state = loadState();

  // Reset if new day
  const today = new Date().toDateString();
  if (state.lastResetDate !== today) {
    return true; // New day, can make requests
  }

  const remaining = DAILY_NEWS_LIMIT - state.dailyNewsRequests;
  if (remaining <= 0) {
    console.warn(`Daily NewsAPI limit reached: ${state.dailyNewsRequests}/${DAILY_NEWS_LIMIT}`);
    return false;
  }

  if (remaining <= 10) {
    console.warn(`Approaching limit: ${remaining} requests remaining today`);
  }

  return true;
}

/**
 * Get current state (for debugging/logging)
 * @returns {object}
 */
export function getState() {
  return loadState();
}

/**
 * Reset state (for testing)
 */
export function resetState() {
  saveState(getDefaultState());
}
