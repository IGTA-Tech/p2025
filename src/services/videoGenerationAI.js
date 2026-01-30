/**
 * Video Generation Service using Kie.ai Kling 2.6 API
 *
 * Generates AI videos with native audio from text prompts or images.
 * Kling 2.6 supports 5s or 10s videos at 720p or 1080p with better voice/lip-sync.
 *
 * Pricing (no audio): $0.28 (5s) | $0.55 (10s)
 * Pricing (with audio): $0.55 (5s) | $1.10 (10s)
 */

// Use relative URL so Vite dev server proxies to backend
const API_URL = '';
console.log('Video API using relative URLs (proxied by Vite)');

/**
 * Video generation status constants
 */
export const VideoStatus = {
  PENDING: 'pending',
  PROCESSING: 'processing',
  COMPLETED: 'completed',
  FAILED: 'failed',
};

/**
 * Generate a video from a text prompt
 * @param {Object} options - Video generation options
 * @param {string} options.prompt - Text description of the video content
 * @param {number} options.duration - Duration in seconds (5 or 10) - defaults to 10 for max impact
 * @param {string} options.resolution - Resolution ('720p' or '1080p')
 * @param {string} options.aspectRatio - Aspect ratio ('16:9' or '9:16')
 * @returns {Promise<{taskId: string, status: string}>}
 */
export async function generateVideoFromText({
  prompt,
  duration = 10, // Always default to 10 seconds for maximum impact
  resolution = '720p',
  aspectRatio = '16:9',
}) {
  // Enforce 10-second duration for political ads (optimal for social sharing)
  const effectiveDuration = 10;
  const url = `${API_URL}/api/video/generate`;
  console.log('Video generation request to:', url);
  console.log('Prompt being sent to Kling:', prompt.substring(0, 200) + '...');

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt,
        duration: effectiveDuration,
        resolution,
        aspectRatio,
        mode: 'text-to-video',
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to start video generation');
    }

    return response.json();
  } catch (err) {
    console.error('Video generation fetch error:', err);
    console.error('API_URL was:', API_URL);
    throw new Error(`Network error: ${err.message}. API URL: ${url}`);
  }
}

/**
 * Generate a video from an image
 * @param {Object} options - Video generation options
 * @param {string} options.imageUrl - URL of the source image
 * @param {string} options.prompt - Text description to guide the video generation
 * @param {number} options.duration - Duration in seconds (5, 10, or 15)
 * @param {string} options.resolution - Resolution ('720p' or '1080p')
 * @returns {Promise<{taskId: string, status: string}>}
 */
export async function generateVideoFromImage({
  imageUrl,
  prompt,
  duration = 10,
  resolution = '720p',
}) {
  const response = await fetch(`${API_URL}/api/video/generate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      imageUrl,
      prompt,
      duration,
      resolution,
      mode: 'image-to-video',
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to start video generation');
  }

  return response.json();
}

/**
 * Check the status of a video generation task
 * @param {string} taskId - The task ID returned from generate functions
 * @returns {Promise<{status: string, videoUrl?: string, error?: string}>}
 */
export async function getVideoStatus(taskId) {
  const response = await fetch(`${API_URL}/api/video/status/${taskId}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to get video status');
  }

  return response.json();
}

/**
 * Poll for video completion with automatic retries
 * @param {string} taskId - The task ID to poll
 * @param {Object} options - Polling options
 * @param {number} options.interval - Polling interval in ms (default: 5000)
 * @param {number} options.maxAttempts - Max polling attempts (default: 60)
 * @param {function} options.onProgress - Callback for status updates
 * @returns {Promise<{status: string, videoUrl: string}>}
 */
export async function pollVideoCompletion(taskId, {
  interval = 5000,
  maxAttempts = 60,
  onProgress = null,
} = {}) {
  let attempts = 0;

  while (attempts < maxAttempts) {
    const result = await getVideoStatus(taskId);

    if (onProgress) {
      onProgress(result);
    }

    if (result.status === VideoStatus.COMPLETED) {
      return result;
    }

    if (result.status === VideoStatus.FAILED) {
      throw new Error(result.error || 'Video generation failed');
    }

    attempts++;
    await new Promise(resolve => setTimeout(resolve, interval));
  }

  throw new Error('Video generation timed out');
}

/**
 * Generate a campaign video from a citizen story
 * @param {Object} story - The citizen story object
 * @param {Object} options - Generation options
 * @returns {Promise<{taskId: string}>}
 */
export async function generateCampaignVideo(story, options = {}) {
  const {
    duration = 10,
    resolution = '720p',
    aspectRatio = '16:9',
  } = options;

  // Build a dynamic, compelling video prompt from the story
  const prompt = buildVideoPromptFromStory(story);

  return generateVideoFromText({
    prompt,
    duration,
    resolution,
    aspectRatio,
  });
}

/**
 * Style configurations with camera, lighting, and pacing
 */
const VIDEO_STYLES = {
  cinematic: {
    camera: 'Cinematic wide establishing shot, slow dramatic push-in, shallow depth of field',
    lighting: 'Golden hour lighting with lens flares, high contrast shadows',
    pacing: 'Slow deliberate movements building tension',
  },
  urgent: {
    camera: 'Handheld camera with slight shake, quick cuts, close-up reaction shots',
    lighting: 'Harsh overhead lighting, stark contrasts, news-style brightness',
    pacing: 'Fast-paced cuts, sense of immediacy and breaking news',
  },
  testimonial: {
    camera: 'Medium close-up, person speaking directly to camera, subtle rack focus',
    lighting: 'Soft key light with gentle fill, warm skin tones, blurred background',
    pacing: 'Intimate and personal, lingering on emotional moments',
  },
  dramatic: {
    camera: 'Low angle hero shots, dramatic crane movements, silhouettes against sky',
    lighting: 'Chiaroscuro lighting, deep shadows, dramatic rim lights',
    pacing: 'Building crescendo, powerful climactic moment',
  },
  hopeful: {
    camera: 'Tracking shot following subject, upward tilts, opening up to wide vistas',
    lighting: 'Bright natural daylight, sun rays, warm optimistic tones',
    pacing: 'Uplifting progression, ending on inspiring note',
  },
  documentary: {
    camera: 'Observational steady cam, natural eye-level angles, fly-on-wall perspective',
    lighting: 'Available natural light, authentic unpolished look',
    pacing: 'Measured and thoughtful, letting moments breathe',
  },
  investigative: {
    camera: 'Hidden camera aesthetic, through-window shots, surveillance angles',
    lighting: 'Fluorescent institutional lighting, slightly desaturated',
    pacing: 'Revealing and uncovering, building to expose',
  },
  emotional: {
    camera: 'Extreme close-ups on eyes and hands, slow dolly movements',
    lighting: 'Soft diffused light, intimate and vulnerable',
    pacing: 'Slow and reflective, space for emotional resonance',
  },
};

/**
 * Mood configurations based on story content
 */
const MOOD_CONFIGS = {
  critical: {
    tone: 'Urgent and alarming',
    music: 'Tense orchestral swells, minor key, building percussion',
    voiceStyle: 'Authoritative and concerned, measured urgency',
  },
  high: {
    tone: 'Serious and compelling',
    music: 'Dramatic strings, powerful brass accents, emotional piano',
    voiceStyle: 'Strong and persuasive, call to action',
  },
  medium: {
    tone: 'Thoughtful and engaging',
    music: 'Contemplative piano, subtle strings, hopeful undertones',
    voiceStyle: 'Warm and relatable, conversational authority',
  },
  low: {
    tone: 'Informative and balanced',
    music: 'Light ambient texture, gentle acoustic elements',
    voiceStyle: 'Clear and informative, trustworthy narrator',
  },
  positive: {
    tone: 'Uplifting and inspiring',
    music: 'Soaring melody, major key progression, triumphant crescendo',
    voiceStyle: 'Hopeful and energizing, celebrating progress',
  },
};

/**
 * Policy area to visual theme mapping
 */
const POLICY_VISUALS = {
  healthcare: {
    scenes: 'Hospital corridors, family at doctor office, medicine bottles on kitchen counter, elderly hands holding pills',
    symbols: 'Medical equipment, insurance paperwork, empty pharmacy shelves',
    people: 'Worried parents with sick child, senior checking prescription costs, nurse looking exhausted',
  },
  education: {
    scenes: 'Classroom with empty desks, parent helping with homework at kitchen table, school bus stop',
    symbols: 'Textbooks, report cards, closed school building, protest signs',
    people: 'Teacher in underfunded classroom, student struggling with outdated materials, parent at school board meeting',
  },
  employment: {
    scenes: 'Factory floor, unemployment office line, home office setup, "now hiring" signs',
    symbols: 'Pink slips, job applications, empty storefronts, union signs',
    people: 'Worker packing personal items from desk, family discussing bills, job interview moment',
  },
  housing: {
    scenes: 'For sale signs on street, moving boxes, apartment building exterior, tent encampment',
    symbols: 'Eviction notices, mortgage documents, house keys being handed over',
    people: 'Family loading moving truck, person apartment hunting, homeless individual finding shelter',
  },
  environment: {
    scenes: 'Polluted waterway, wildfire smoke over neighborhood, flooded streets, solar panel installation',
    symbols: 'Smokestacks, dead fish, drought-cracked earth, wind turbines',
    people: 'Farmer surveying damaged crops, child with asthma inhaler, community cleanup crew',
  },
  economy: {
    scenes: 'Gas station price signs, grocery store checkout, stock ticker, small business storefront',
    symbols: 'Bills and receipts, credit cards, empty wallet, price tags',
    people: 'Parent comparing prices, small business owner closing shop, family budget meeting',
  },
  immigration: {
    scenes: 'Border crossing, citizenship ceremony, detention facility exterior, family reunion',
    symbols: 'Passports, visa documents, American flag, welcome signs',
    people: 'Family separated by fence, new citizen taking oath, DACA recipient at work',
  },
  infrastructure: {
    scenes: 'Potholed road, bridge with rust, train station, broadband installation',
    symbols: 'Construction barriers, "road closed" signs, old pipes, fiber optic cables',
    people: 'Commuter stuck in traffic, family without internet access, construction worker',
  },
};

/**
 * Build a dynamic video generation prompt from a citizen story
 * Optimized for 10-second maximum impact with dialogue
 * @param {Object} story - The story object
 * @returns {string}
 */
function buildVideoPromptFromStory(story) {
  const location = story.location || {};
  const city = location.city || 'a local community';
  const state = location.state || '';
  const policyArea = story.policyArea || 'policy';
  const severity = story.severity || 'medium';

  // Select style based on severity and policy area
  const style = selectStyleForStory(story);
  const styleConfig = VIDEO_STYLES[style] || VIDEO_STYLES.cinematic;

  // Get mood configuration
  const moodConfig = MOOD_CONFIGS[severity] || MOOD_CONFIGS.medium;

  // Get policy-specific visuals
  const policyVisuals = POLICY_VISUALS[policyArea] || {
    scenes: 'Community spaces, local neighborhoods, everyday life moments',
    symbols: 'Official documents, news headlines, community bulletin boards',
    people: 'Diverse community members, families, local workers',
  };

  // Extract the most impactful quote from the story (first sentence or headline)
  const impactQuote = extractImpactQuote(story);

  // Build the 10-second optimized prompt
  return `=== 10-SECOND POLITICAL AD - MAXIMUM IMPACT ===

STYLE: ${style.toUpperCase()}
${styleConfig.camera}
${styleConfig.lighting}
${styleConfig.pacing}

MOOD: ${moodConfig.tone}
MUSIC: ${moodConfig.music}

=== DIALOGUE/VOICEOVER (CRITICAL - MUST BE SPOKEN CLEARLY) ===
A real person speaks directly to camera with emotion and conviction:
"${impactQuote}"

The voice should be: ${moodConfig.voiceStyle}
Lip sync must be perfect. Words must be clearly audible and emotionally delivered.

=== VISUAL SEQUENCE (10 SECONDS) ===

SECOND 0-3: HOOK
- Location: ${city}${state ? `, ${state}` : ''}
- Open on: ${policyVisuals.people.split(',')[0]}
- Visual symbols: ${policyVisuals.symbols.split(',')[0]}
- Camera: Dynamic opening that grabs attention immediately

SECOND 3-7: EMOTIONAL CORE
- Scene: ${policyVisuals.scenes.split(',')[0]}
- Show: Person delivering the key message with genuine emotion
- Close-up on face during most impactful words
- B-roll cuts: ${policyVisuals.symbols}

SECOND 7-10: CALL TO ACTION
- Pull back to show community context
- Text overlay: "${story.headline}"
- End on powerful image that lingers
- Final frame: Clear, memorable, shareable

=== PRODUCTION NOTES ===
- This is a 10-second political accountability video
- Every frame must serve the message
- Prioritize authentic human emotion over polish
- The spoken words are the PRIMARY content
- Visuals support and amplify the dialogue
- Must feel real, not produced or artificial
- End with emotional resonance that demands sharing`;
}

/**
 * Select the best video style based on story attributes
 * @param {Object} story - The story object
 * @returns {string} - Style key
 */
function selectStyleForStory(story) {
  const severity = story.severity || 'medium';
  const policyArea = story.policyArea || '';

  // Severity-based style selection
  const severityStyles = {
    critical: ['urgent', 'investigative', 'dramatic'],
    high: ['dramatic', 'cinematic', 'testimonial'],
    medium: ['testimonial', 'documentary', 'emotional'],
    low: ['documentary', 'hopeful', 'cinematic'],
  };

  // Policy area style preferences
  const policyStyles = {
    healthcare: ['emotional', 'testimonial', 'urgent'],
    education: ['hopeful', 'documentary', 'testimonial'],
    employment: ['dramatic', 'testimonial', 'documentary'],
    housing: ['urgent', 'emotional', 'documentary'],
    environment: ['cinematic', 'dramatic', 'investigative'],
    economy: ['urgent', 'testimonial', 'documentary'],
    immigration: ['emotional', 'testimonial', 'hopeful'],
    infrastructure: ['documentary', 'investigative', 'cinematic'],
  };

  // Get candidate styles from both severity and policy
  const severityCandidates = severityStyles[severity] || severityStyles.medium;
  const policyCandidates = policyStyles[policyArea] || [];

  // Find overlap or use severity-based default
  const overlap = severityCandidates.filter(s => policyCandidates.includes(s));
  const candidates = overlap.length > 0 ? overlap : severityCandidates;

  // Randomly select from top candidates for variety
  return candidates[Math.floor(Math.random() * candidates.length)];
}

/**
 * Extract the most impactful quote for the video dialogue
 * @param {Object} story - The story object
 * @returns {string} - The impact quote
 */
function extractImpactQuote(story) {
  // Priority: Use headline if it's personal and impactful
  if (story.headline && story.headline.length < 100) {
    // Make it more personal/first-person if it isn't already
    let quote = story.headline;

    // If headline is third-person, try to use first sentence of story
    if (!quote.includes('I ') && !quote.includes('my ') && !quote.includes('My ') && !quote.includes("I'")) {
      const storyText = story.story || '';
      const firstSentence = storyText.split(/[.!?]/)[0];
      if (firstSentence && firstSentence.length > 20 && firstSentence.length < 150) {
        quote = firstSentence.trim();
      }
    }

    return quote;
  }

  // Fallback: Extract first compelling sentence from story
  const storyText = story.story || story.headline || 'This affects real families in our community.';
  const sentences = storyText.split(/[.!?]/).filter(s => s.trim().length > 10);

  // Find the most impactful sentence (contains "I", emotion words, or is short and punchy)
  const impactWords = ['I ', 'my ', 'we ', 'our ', 'family', 'child', 'lost', 'can\'t', 'afford', 'struggling', 'forced', 'never'];

  for (const sentence of sentences) {
    const lower = sentence.toLowerCase();
    if (impactWords.some(word => lower.includes(word.toLowerCase())) && sentence.length < 120) {
      return sentence.trim();
    }
  }

  // Default to first sentence if nothing else works
  return sentences[0]?.trim() || 'This is happening in communities across America.';
}

/**
 * Get estimated cost for a video generation
 * @param {number} duration - Duration in seconds (5, 10, or 15)
 * @param {string} resolution - Resolution ('720p' or '1080p')
 * @returns {{cost: number, formatted: string}}
 */
export function getEstimatedCost(duration, resolution = '720p') {
  // Kling 2.6 pricing (with audio enabled)
  const pricing = {
    '720p': { 5: 0.55, 10: 1.10 },
    '1080p': { 5: 0.55, 10: 1.10 },
  };

  const cost = pricing[resolution]?.[duration] || 0;
  return {
    cost,
    formatted: `$${cost.toFixed(2)}`,
  };
}

/**
 * Validate video generation parameters
 * @param {Object} params - Parameters to validate
 * @returns {{valid: boolean, errors: string[]}}
 */
export function validateVideoParams({ prompt, duration, resolution }) {
  const errors = [];

  if (!prompt || prompt.trim().length < 10) {
    errors.push('Prompt must be at least 10 characters');
  }

  if (prompt && prompt.length > 5000) {
    errors.push('Prompt must not exceed 5000 characters');
  }

  if (![5, 10].includes(duration)) {
    errors.push('Duration must be 5 or 10 seconds');
  }

  if (!['720p', '1080p'].includes(resolution)) {
    errors.push('Resolution must be 720p or 1080p');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

export default {
  generateVideoFromText,
  generateVideoFromImage,
  getVideoStatus,
  pollVideoCompletion,
  generateCampaignVideo,
  getEstimatedCost,
  validateVideoParams,
  VideoStatus,
};
