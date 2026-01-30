/**
 * News to Story Transformation
 *
 * Fetches policy news and uses Claude to generate citizen story narratives.
 */

import { POLICY_NEWS_KEYWORDS, API_URL, STORY_GENERATION_TIMEOUT_MS } from './config.js';

// NewsAPI configuration - use getters to ensure env vars are read after dotenv loads
function getNewsApiBase() {
  return process.env.VITE_NEWS_API_BASE || 'https://newsapi.org/v2';
}

function getNewsApiKey() {
  return process.env.VITE_NEWS_API_KEY;
}

/**
 * Search for policy-related news articles
 * @param {string} policyArea - The policy area to search for
 * @param {string} state - Optional state for geographic context
 * @returns {Promise<object|null>} News results or null on error
 */
async function searchPolicyNews(policyArea, state = null) {
  const NEWS_API_KEY = getNewsApiKey();
  const NEWS_API_BASE = getNewsApiBase();

  if (!NEWS_API_KEY) {
    console.error('NewsAPI key not configured (VITE_NEWS_API_KEY missing)');
    return null;
  }

  const keywords = POLICY_NEWS_KEYWORDS[policyArea] || [policyArea];
  const query = keywords.slice(0, 3).join(' OR '); // Use top 3 keywords

  // Calculate date range: last 7 days
  const toDate = new Date();
  const fromDate = new Date();
  fromDate.setDate(fromDate.getDate() - 7);

  const params = new URLSearchParams({
    q: query,
    language: 'en',
    sortBy: 'publishedAt',  // Sort by newest first to get fresh articles
    pageSize: '10',         // Fetch more to have variety
    from: fromDate.toISOString().split('T')[0],  // YYYY-MM-DD format
    to: toDate.toISOString().split('T')[0],
    apiKey: NEWS_API_KEY
  });

  try {
    console.log(`Fetching news for "${policyArea}" with query: ${query.substring(0, 50)}...`);

    const response = await fetch(`${NEWS_API_BASE}/everything?${params}`, {
      headers: { 'Accept': 'application/json' },
      signal: AbortSignal.timeout(30000)
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('NewsAPI error:', error);
      return null;
    }

    const data = await response.json();
    console.log(`Found ${data.articles?.length || 0} articles for ${policyArea}`);
    return data;

  } catch (error) {
    console.error('Error fetching news:', error.message);
    return null;
  }
}

/**
 * Shuffle array using Fisher-Yates algorithm
 * @param {Array} array - Array to shuffle
 * @returns {Array} Shuffled copy of array
 */
function shuffleArray(array) {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

/**
 * Build a prompt for Claude to generate a citizen story from news
 * @param {Array} newsArticles - Array of news article objects
 * @param {string} policyArea - The policy area
 * @param {object} location - Location object with city, state, zip, etc.
 * @returns {string} The formatted prompt
 */
function buildStoryPrompt(newsArticles, policyArea, location) {
  // Randomly select 3 articles from the pool for variety
  const shuffled = shuffleArray(newsArticles);
  const topArticles = shuffled.slice(0, 3);
  const newsContext = topArticles.map((a, i) =>
    `Article ${i + 1}: "${a.title}" - ${a.description || 'No description available'}`
  ).join('\n');

  return `You are generating a realistic first-person citizen story for a democratic accountability platform. The story should sound like it was written by a real person affected by policy changes.

CONTEXT:
- Policy Area: ${policyArea}
- Location: ${location.city}, ${location.state} (ZIP: ${location.zip})
- Congressional District: ${location.district}
- County: ${location.county}

RECENT NEWS CONTEXT:
${newsContext}

REQUIREMENTS:
1. Write as a first-person narrative from a citizen's perspective
2. Include specific, believable details (approximate dates, general timeframes, realistic descriptions)
3. Describe a concrete impact from recent policy changes related to the news
4. Include emotional but credible testimony - this person is sharing their real experience
5. Reference at least one verifiable type of impact (e.g., "my hours were cut", "the clinic closed", "my application was denied")
6. Keep it between 100-200 words
7. Make it sound natural and conversational, not formal or overly dramatic
8. The person should be a regular citizen, not an expert or official

OUTPUT FORMAT (valid JSON only, no markdown):
{
  "headline": "Short, impactful headline summarizing the impact (max 15 words)",
  "story": "First-person narrative (100-200 words)",
  "severity": "critical|high|medium|low",
  "suggestedEvidence": ["Type of document that could verify this, e.g., 'termination letter', 'medical bill'"],
  "affectedPopulation": <estimated number of people in similar situations locally>,
  "economicImpact": <estimated dollar impact on this person/family, as negative number>
}

Generate the JSON now:`;
}

/**
 * Call the backend proxy to generate story via Claude
 * @param {string} prompt - The generation prompt
 * @returns {Promise<object|null>} Parsed story data or null on error
 */
async function generateStoryWithClaude(prompt) {
  try {
    console.log('Calling Claude API to generate story...');

    const response = await fetch(`${API_URL}/api/generate-story`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt }),
      signal: AbortSignal.timeout(STORY_GENERATION_TIMEOUT_MS)
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('Story generation API error:', error);
      return null;
    }

    const data = await response.json();

    if (data.useMock) {
      console.warn('API returned mock flag, Claude may not be available');
      return null;
    }

    // Parse the JSON response from Claude
    let storyData;
    try {
      // Remove any markdown code fences if present
      let jsonStr = data.story;
      if (jsonStr.startsWith('```')) {
        jsonStr = jsonStr.replace(/```json?\n?/g, '').replace(/```\n?$/g, '');
      }
      storyData = JSON.parse(jsonStr.trim());
    } catch (parseError) {
      console.error('Failed to parse Claude response as JSON:', parseError.message);
      console.error('Raw response:', data.story?.substring(0, 200));
      return null;
    }

    console.log('Successfully generated story:', storyData.headline?.substring(0, 50));
    return storyData;

  } catch (error) {
    console.error('Error generating story with Claude:', error.message);
    return null;
  }
}

/**
 * Generate a fallback story when news/AI is unavailable
 * @param {string} policyArea - The policy area
 * @param {object} location - Location object
 * @returns {object} A template-based story
 */
function generateFallbackStory(policyArea, location) {
  const templates = {
    education: {
      headline: 'Local school funding cuts affecting students',
      story: `I'm a parent in ${location.city}, and I've been watching our school district struggle. They announced budget cuts last month, and now my daughter's art program is being eliminated. The teachers are stretched thin, and class sizes keep growing. I moved here because of the good schools, but now I'm worried about my kids' future. We're doing what we can at home, but it's not the same.`,
      severity: 'high',
      affectedPopulation: 2500,
      economicImpact: -3500
    },
    healthcare: {
      headline: 'Rural healthcare access becoming critical concern',
      story: `I live about 30 minutes outside ${location.city}, and getting healthcare has become a real problem. The urgent care clinic that used to be nearby closed down, and now the nearest facility is over an hour away. When my husband had chest pains last month, that drive felt like forever. We're retired, on a fixed income, and the gas costs alone are adding up. I don't know what we'll do if something serious happens.`,
      severity: 'critical',
      affectedPopulation: 5000,
      economicImpact: -8000
    },
    employment: {
      headline: 'Federal contractor layoffs impacting local families',
      story: `I worked as a contractor for a federal agency for six years. Last month, they told us our contracts weren't being renewed. Just like that, I'm out of a job. I have two kids in school and a mortgage. I've been applying everywhere, but the job market here in ${location.city} isn't great. My wife is picking up extra shifts, but we're burning through our savings. It's terrifying.`,
      severity: 'critical',
      affectedPopulation: 800,
      economicImpact: -65000
    },
    housing: {
      headline: 'Rising rents pushing families out of neighborhoods',
      story: `I've lived in ${location.city} my whole life. My family has been here for three generations. But our landlord just told us he's raising the rent by 40% when our lease is up. There's no way we can afford that on what we make. We're looking at apartments further out, but then my commute doubles and childcare becomes impossible. I never thought I'd be priced out of my own community.`,
      severity: 'high',
      affectedPopulation: 3500,
      economicImpact: -12000
    },
    environment: {
      headline: 'Water quality concerns growing in community',
      story: `Something's not right with our water here in ${location.county} County. It started smelling funny a few months ago, and now it has this weird color sometimes. I've been buying bottled water for my family, but that adds up fast. When I called to complain, they said everything was within limits, but I don't trust it. My neighbor's kids have been getting rashes, and I'm worried about what we've already been exposed to.`,
      severity: 'high',
      affectedPopulation: 4000,
      economicImpact: -2500
    },
    immigration: {
      headline: 'Immigration enforcement creating fear in community',
      story: `I'm a citizen, but many people in my church aren't. The fear is everywhere now. My neighbor, who's been here 20 years paying taxes and raising American kids, is afraid to leave the house. Local businesses are suffering because people are scared to go out. My daughter's best friend didn't come to school for a week because her parents were afraid of checkpoints. This isn't the community I grew up in.`,
      severity: 'critical',
      affectedPopulation: 6000,
      economicImpact: -15000
    },
    infrastructure: {
      headline: 'Aging infrastructure causing daily problems',
      story: `The roads in ${location.county} County are falling apart. I've replaced two tires in three months from potholes. The bridge I take to work has been "under evaluation" for a year now, and everyone's just crossing their fingers. When it rained hard last month, the old drainage system couldn't handle it and my basement flooded. We pay our taxes, but it feels like nothing gets fixed anymore.`,
      severity: 'medium',
      affectedPopulation: 15000,
      economicImpact: -4500
    },
    justice: {
      headline: 'Court backlogs delaying access to justice',
      story: `I've been waiting 14 months for my day in court over a wrongful termination case. The delays just keep coming. My lawyer says the courts are overwhelmed and understaffed. Meanwhile, I can't move on with my life. I've used up most of my savings, and the stress is affecting my health. I just want resolution, but the system moves so slowly that I'm starting to lose hope.`,
      severity: 'medium',
      affectedPopulation: 1200,
      economicImpact: -25000
    },
    election: {
      headline: 'Voting access changes concerning residents',
      story: `They closed the polling place that's been in our neighborhood for 30 years. Now the nearest one is across town. For people like my mother, who doesn't drive, that's a real problem. The early voting hours were cut too. I'm lucky I have flexibility with my job, but a lot of people here work shifts and can't take hours off. It feels like they're making it harder for regular folks to vote.`,
      severity: 'high',
      affectedPopulation: 8000,
      economicImpact: -500
    }
  };

  const template = templates[policyArea] || templates.education;

  return {
    ...template,
    suggestedEvidence: ['personal documentation', 'local news coverage']
  };
}

/**
 * Main function: Fetch news and generate a story for a policy area
 * @param {string} policyArea - The policy area to generate for
 * @param {object} location - Location object with city, state, zip, etc.
 * @returns {Promise<object|null>} Story data or null on complete failure
 */
export async function generateStoryFromNews(policyArea, location) {
  // Try to fetch news
  const newsResult = await searchPolicyNews(policyArea, location.state);

  if (!newsResult || !newsResult.articles || newsResult.articles.length === 0) {
    console.log(`No news found for ${policyArea}, using fallback generation`);
    const fallbackStory = generateFallbackStory(policyArea, location);
    fallbackStory._sourceReference = {
      type: 'auto_generated',
      fallback_used: true,
      news_articles: []
    };
    return fallbackStory;
  }

  // Build prompt and generate with Claude
  const prompt = buildStoryPrompt(newsResult.articles, policyArea, location);
  const storyData = await generateStoryWithClaude(prompt);

  if (!storyData) {
    console.log('Claude generation failed, using fallback story');
    const fallbackStory = generateFallbackStory(policyArea, location);
    fallbackStory._sourceReference = {
      type: 'auto_generated',
      fallback_used: true,
      news_articles: newsResult.articles.slice(0, 3).map(a => ({
        title: a.title,
        url: a.url,
        source: a.source?.name || 'Unknown'
      }))
    };
    return fallbackStory;
  }

  // Attach source reference to story data
  storyData._sourceReference = {
    type: 'auto_generated',
    fallback_used: false,
    news_articles: newsResult.articles.slice(0, 3).map(a => ({
      title: a.title,
      url: a.url,
      source: a.source?.name || 'Unknown'
    }))
  };

  return storyData;
}

/**
 * Test function for development
 */
export async function testGeneration() {
  const testLocation = {
    zip: '48197',
    city: 'Ypsilanti',
    state: 'MI',
    county: 'Washtenaw',
    district: 'MI-06'
  };

  console.log('Testing story generation...');
  const story = await generateStoryFromNews('healthcare', testLocation);
  console.log('Generated story:', JSON.stringify(story, null, 2));
  return story;
}
