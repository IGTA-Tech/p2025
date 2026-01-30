/**
 * Story Generator Configuration
 *
 * Defines policy areas, keywords for news search, and API configuration
 * for the automated story generation system.
 */

// Policy areas matching DemocraticAccountabilityPlatform.jsx (lines 27-36)
export const POLICY_AREAS = [
  'education',
  'healthcare',
  'employment',
  'housing',
  'environment',
  'immigration',
  'infrastructure',
  'justice',
  'election'
];

// Enhanced keywords for NewsAPI queries by policy area
export const POLICY_NEWS_KEYWORDS = {
  education: [
    'Department of Education',
    'Title I funding',
    'Pell Grant',
    'school voucher',
    'teacher layoffs',
    'public school funding',
    'student loans',
    'education budget cuts'
  ],
  healthcare: [
    'Medicaid cuts',
    'rural hospital closure',
    'ACA repeal',
    'Medicare changes',
    'health insurance',
    'prescription drug costs',
    'mental health services',
    'healthcare access'
  ],
  employment: [
    'federal workforce',
    'Schedule F',
    'federal layoffs',
    'job losses',
    'civil service',
    'unemployment',
    'worker protections',
    'labor rights'
  ],
  housing: [
    'HUD cuts',
    'Section 8',
    'affordable housing',
    'rent assistance',
    'eviction',
    'homelessness',
    'housing vouchers',
    'mortgage rates'
  ],
  environment: [
    'EPA rollback',
    'clean water',
    'air quality',
    'climate policy',
    'environmental regulation',
    'pollution',
    'renewable energy',
    'conservation'
  ],
  immigration: [
    'ICE enforcement',
    'border policy',
    'deportation',
    'DACA',
    'visa changes',
    'asylum seekers',
    'immigration raids',
    'migrant workers'
  ],
  infrastructure: [
    'highway funding',
    'bridge repair',
    'infrastructure cuts',
    'transit funding',
    'broadband access',
    'road construction',
    'public transit',
    'rural infrastructure'
  ],
  justice: [
    'DOJ policy',
    'federal courts',
    'civil rights',
    'criminal justice reform',
    'sentencing',
    'police reform',
    'voting rights',
    'discrimination'
  ],
  election: [
    'voter access',
    'election security',
    'voting rights',
    'ballot access',
    'election administration',
    'voter ID',
    'early voting',
    'mail-in ballots'
  ]
};

// API configuration
export const API_URL = process.env.VITE_API_URL || 'http://localhost:3001';

// Rate limiting configuration
export const DAILY_NEWS_LIMIT = 80; // Reserve 20 requests for main app (out of 100/day)
export const STORY_GENERATION_TIMEOUT_MS = 60000; // 60 seconds for Claude generation
