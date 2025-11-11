/**
 * AI Story Analysis Service
 *
 * Analyzes citizen stories to determine:
 * - Message resonance (how compelling the story is)
 * - Demographic appeal (which groups would care)
 * - Recommended talking points
 * - Competitive vulnerability (political exploitability)
 */

const ANTHROPIC_API_KEY = import.meta.env.VITE_ANTHROPIC_API_KEY || '';
const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY || '';

/**
 * Policy area to demographic mapping
 */
const POLICY_DEMOGRAPHICS = {
  education: ['suburban_parents', 'young_families', 'teachers', 'working_class'],
  healthcare: ['seniors', 'rural_voters', 'working_class', 'healthcare_advocates'],
  employment: ['working_class', 'middle_class', 'young_professionals', 'union_members'],
  housing: ['young_families', 'renters', 'urban_voters', 'first_time_buyers'],
  environment: ['young_voters', 'suburban_voters', 'environmental_advocates', 'outdoor_enthusiasts'],
  immigration: ['latino_voters', 'urban_voters', 'immigrant_communities', 'small_business_owners'],
  infrastructure: ['rural_voters', 'suburban_voters', 'commuters', 'small_business_owners'],
  justice: ['urban_voters', 'minority_communities', 'young_voters', 'reform_advocates']
};

/**
 * Severity to vulnerability mapping
 */
const SEVERITY_VULNERABILITY = {
  low: 'low',
  medium: 'medium',
  high: 'high',
  critical: 'critical'
};

/**
 * Extract key talking points from story text using keyword analysis
 */
function extractTalkingPoints(storyText, policyArea) {
  const text = storyText.toLowerCase();
  const points = [];

  // Policy-specific keyword mappings
  const keywords = {
    education: [
      { keyword: 'class size', point: 'classroom_overcrowding' },
      { keyword: 'teacher', point: 'teacher_shortage' },
      { keyword: 'funding cut', point: 'education_funding_cuts' },
      { keyword: 'reading', point: 'reading_achievement' },
      { keyword: 'test score', point: 'academic_performance' },
      { keyword: 'special education', point: 'special_needs_support' },
      { keyword: 'school closing', point: 'school_closures' },
    ],
    healthcare: [
      { keyword: 'clinic closed', point: 'healthcare_access' },
      { keyword: 'hospital', point: 'hospital_services' },
      { keyword: 'wait time', point: 'healthcare_delays' },
      { keyword: 'insurance', point: 'health_insurance_coverage' },
      { keyword: 'prescription', point: 'prescription_drug_costs' },
      { keyword: 'emergency room', point: 'emergency_care_access' },
      { keyword: 'rural health', point: 'rural_healthcare_crisis' },
    ],
    employment: [
      { keyword: 'laid off', point: 'job_losses' },
      { keyword: 'unemployment', point: 'unemployment_crisis' },
      { keyword: 'wage', point: 'wage_stagnation' },
      { keyword: 'contract', point: 'job_security' },
      { keyword: 'federal contractor', point: 'federal_contracting_instability' },
      { keyword: 'benefits', point: 'benefits_cuts' },
    ],
    housing: [
      { keyword: 'rent', point: 'rental_affordability' },
      { keyword: 'mortgage', point: 'homeownership_crisis' },
      { keyword: 'eviction', point: 'housing_displacement' },
      { keyword: 'affordable housing', point: 'affordable_housing_shortage' },
      { keyword: 'homeless', point: 'homelessness_crisis' },
    ],
    environment: [
      { keyword: 'water', point: 'water_quality' },
      { keyword: 'pollution', point: 'environmental_pollution' },
      { keyword: 'climate', point: 'climate_change_impacts' },
      { keyword: 'flood', point: 'flood_risks' },
      { keyword: 'air quality', point: 'air_pollution' },
    ],
    immigration: [
      { keyword: 'separated', point: 'family_separation' },
      { keyword: 'deportation', point: 'deportation_fears' },
      { keyword: 'visa', point: 'visa_uncertainty' },
      { keyword: 'documentation', point: 'immigration_status' },
      { keyword: 'business', point: 'immigration_workforce' },
    ],
    infrastructure: [
      { keyword: 'road', point: 'road_conditions' },
      { keyword: 'bridge', point: 'bridge_safety' },
      { keyword: 'water main', point: 'water_infrastructure' },
      { keyword: 'broadband', point: 'rural_broadband_access' },
      { keyword: 'public transit', point: 'public_transportation' },
    ],
    justice: [
      { keyword: 'police', point: 'police_accountability' },
      { keyword: 'court', point: 'judicial_system' },
      { keyword: 'bail', point: 'bail_reform' },
      { keyword: 'prison', point: 'criminal_justice_reform' },
      { keyword: 'legal aid', point: 'legal_representation_access' },
    ]
  };

  const policyKeywords = keywords[policyArea] || [];

  // Find matching keywords
  for (const { keyword, point } of policyKeywords) {
    if (text.includes(keyword)) {
      points.push(point);
    }
  }

  // Always add federal policy impact if mentioned
  if (text.includes('federal') || text.includes('government')) {
    points.push('federal_policy_impact');
  }

  // Add economic impact if dollar amounts mentioned
  if (text.includes('$') || text.includes('dollar')) {
    points.push('economic_consequences');
  }

  // Ensure we have at least 2-3 talking points
  if (points.length === 0) {
    // Use generic policy area talking points
    const genericPoints = {
      education: ['education_quality', 'student_outcomes'],
      healthcare: ['healthcare_access', 'patient_care'],
      employment: ['job_security', 'economic_stability'],
      housing: ['housing_affordability', 'community_stability'],
      environment: ['environmental_protection', 'public_health'],
      immigration: ['immigrant_rights', 'community_impact'],
      infrastructure: ['infrastructure_investment', 'public_safety'],
      justice: ['justice_reform', 'community_safety']
    };
    points.push(...(genericPoints[policyArea] || ['policy_impact', 'community_concerns']));
  }

  return points.slice(0, 4); // Return top 4 points
}

/**
 * Calculate message resonance score based on story characteristics
 */
function calculateMessageResonance(story) {
  let score = 50; // Base score

  // Story length and detail (more detailed = more compelling)
  const storyLength = story.story.length;
  if (storyLength > 500) score += 15;
  else if (storyLength > 300) score += 10;
  else if (storyLength > 150) score += 5;

  // Severity increases resonance
  const severityBonus = {
    low: 5,
    medium: 10,
    high: 15,
    critical: 20
  };
  score += severityBonus[story.severity] || 0;

  // Evidence provided
  if (story.evidence && story.evidence.length > 0) {
    score += story.evidence.length * 3;
  }

  // Specific numbers/data mentioned (shows concreteness)
  const hasNumbers = /\d+/.test(story.story);
  if (hasNumbers) score += 8;

  // Personal narrative (contains "I", "my", "we")
  const personalWords = (story.story.match(/\b(i|my|we|our)\b/gi) || []).length;
  if (personalWords > 3) score += 10;
  else if (personalWords > 0) score += 5;

  // Emotional keywords
  const emotionalKeywords = [
    'scared', 'worried', 'devastated', 'struggling', 'desperate',
    'impossible', 'crisis', 'emergency', 'urgent', 'critical'
  ];
  const emotionalCount = emotionalKeywords.filter(word =>
    story.story.toLowerCase().includes(word)
  ).length;
  score += emotionalCount * 3;

  // Cap at 95 (leave room for extraordinary stories)
  return Math.min(95, Math.max(30, score));
}

/**
 * Analyze story using AI (Anthropic Claude or OpenAI)
 */
async function analyzeWithAI(story) {
  const prompt = `Analyze this citizen story for political campaign messaging potential. Return ONLY a JSON object with no additional text.

Story:
Policy Area: ${story.policyArea}
Location: ${story.location.city}, ${story.location.state}
Severity: ${story.severity}
Story Text: ${story.story}

Return a JSON object with this exact structure:
{
  "messageResonance": <number 0-100>,
  "demographicAppeal": [<array of 2-4 demographic groups>],
  "recommendedTalkingPoints": [<array of 3-5 talking point keywords>],
  "competitiveVulnerability": "<low|medium|high|critical>"
}

Demographic groups can be: suburban_parents, working_class, seniors, rural_voters, young_voters, middle_class, urban_voters, independents, teachers, healthcare_advocates, union_members, small_business_owners, environmental_advocates, etc.

Talking points should be short keywords like: healthcare_access, job_security, education_funding, etc.

Competitive vulnerability should assess how politically exploitable this story is for opposition campaigns.`;

  try {
    let response;

    if (ANTHROPIC_API_KEY) {
      // Use Claude
      response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': ANTHROPIC_API_KEY,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: 'claude-3-5-sonnet-20241022',
          max_tokens: 1024,
          temperature: 0.3,
          messages: [{ role: 'user', content: prompt }],
        }),
      });

      if (!response.ok) throw new Error('Claude API request failed');

      const data = await response.json();
      const jsonText = data.content[0].text;

      // Extract JSON from response (in case there's extra text)
      const jsonMatch = jsonText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error('No JSON found in AI response');

      return JSON.parse(jsonMatch[0]);

    } else if (OPENAI_API_KEY) {
      // Use OpenAI
      response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: 'gpt-4-turbo-preview',
          messages: [
            { role: 'system', content: 'You are a political campaign analyst. Return only valid JSON.' },
            { role: 'user', content: prompt }
          ],
          max_tokens: 1024,
          temperature: 0.3,
        }),
      });

      if (!response.ok) throw new Error('OpenAI API request failed');

      const data = await response.json();
      const jsonText = data.choices[0].message.content;

      // Extract JSON from response
      const jsonMatch = jsonText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error('No JSON found in AI response');

      return JSON.parse(jsonMatch[0]);

    } else {
      throw new Error('No AI API key configured');
    }
  } catch (error) {
    console.warn('AI analysis failed, using fallback:', error.message);
    return null;
  }
}

/**
 * Analyze a story using heuristics (fallback when AI unavailable)
 */
function analyzeWithHeuristics(story) {
  const messageResonance = calculateMessageResonance(story);
  const demographicAppeal = POLICY_DEMOGRAPHICS[story.policyArea] || ['general_public'];
  const recommendedTalkingPoints = extractTalkingPoints(story.story, story.policyArea);
  const competitiveVulnerability = SEVERITY_VULNERABILITY[story.severity] || 'medium';

  // Adjust demographics based on location
  const locationDemographics = [...demographicAppeal];
  if (story.location.state) {
    // Add geographic demographic
    const ruralStates = ['WY', 'MT', 'VT', 'ND', 'SD', 'AK'];
    const urbanStates = ['NY', 'CA', 'IL', 'MA', 'NJ'];

    if (ruralStates.includes(story.location.state)) {
      locationDemographics.push('rural_voters');
    } else if (urbanStates.includes(story.location.state)) {
      locationDemographics.push('urban_voters');
    } else {
      locationDemographics.push('suburban_voters');
    }
  }

  // Add independents if moderate severity (swing voters care about moderate issues)
  if (story.severity === 'medium' || story.severity === 'high') {
    locationDemographics.push('independents');
  }

  // Deduplicate and limit to top 4
  const uniqueDemographics = [...new Set(locationDemographics)].slice(0, 4);

  return {
    messageResonance,
    demographicAppeal: uniqueDemographics,
    recommendedTalkingPoints,
    competitiveVulnerability
  };
}

/**
 * Main analysis function - tries AI first, falls back to heuristics
 * @param {Object} story - The citizen story to analyze
 * @returns {Promise<Object>} Analysis results
 */
export async function analyzeStory(story) {
  console.log('Analyzing story:', story.id);

  try {
    // Try AI analysis first
    const aiResult = await analyzeWithAI(story);

    if (aiResult) {
      console.log('AI analysis completed successfully');
      return {
        messageResonance: aiResult.messageResonance,
        demographicAppeal: aiResult.demographicAppeal,
        recommendedTalkingPoints: aiResult.recommendedTalkingPoints,
        competitiveVulnerability: aiResult.competitiveVulnerability,
        analysisMethod: 'ai'
      };
    }
  } catch (error) {
    console.warn('AI analysis failed:', error);
  }

  // Fallback to heuristic analysis
  console.log('Using heuristic analysis');
  const heuristicResult = analyzeWithHeuristics(story);

  return {
    ...heuristicResult,
    analysisMethod: 'heuristic'
  };
}

export default {
  analyzeStory,
  calculateMessageResonance,
  extractTalkingPoints
};
