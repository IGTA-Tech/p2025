/**
 * AI Service for Creative Brief Generation
 *
 * Generates professional campaign creative briefs using AI (Anthropic Claude or OpenAI)
 * based on verified citizen stories, Census data, and platform analytics.
 */

const AI_PROVIDER = 'anthropic'; // 'anthropic' or 'openai'
const ANTHROPIC_API_KEY = import.meta.env.VITE_ANTHROPIC_API_KEY || '';
const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY || '';

/**
 * Generate a creative brief prompt for the AI
 */
function buildCreativeBriefPrompt(story, censusData, verification) {
  return `Generate a complete political campaign creative brief. Output ONLY the brief document - no conversational text, no questions, no stopping. This is automated document generation.

DATA:
Story: ${story.headline} | ${story.location.city}, ${story.location.state} (${story.location.district}) | ${story.policyArea}
${story.story}

Verification: AI ${story.verificationScore}% | Census ${verification?.confidence || 75}% | Resonance ${story.aiAnalysis.messageResonance}% | Vulnerability ${story.aiAnalysis.competitiveVulnerability}

Demographics (ZIP ${story.location.zip}): Pop ${censusData?.population.total.toLocaleString() || 'N/A'} | Income $${censusData?.income.medianHousehold.toLocaleString() || 'N/A'} | Unemployment ${censusData?.employment.unemploymentRate || 'N/A'}% | Home Value $${censusData?.housing.medianValue.toLocaleString() || 'N/A'}

Impact: ${story.impact.affected_population.toLocaleString()} affected | $${Math.abs(story.impact.economic).toLocaleString()} economic | ${story.impact.timeframe}

Target: ${story.aiAnalysis.demographicAppeal.join(', ')}

REQUIREMENTS: Be verbose, insightful, strategic. 2-3 sentences per point. Markdown format. Complete ALL sections.

SECTIONS:

## 1. EXECUTIVE SUMMARY
Campaign Title | Core Message (2-3 sent.) | Primary Objective (detailed) | Target Audience | Verification Status | Strategic Rationale (3-4 sent.)

## 2. STORY NARRATIVE
### Emotional Hook (2-3 para. on story's emotional core, resonance, psychological triggers)
### Compelling Details (5-8 with context - explain WHY each matters)
### Before/After (2-3 sent. each + emotional journey)
### Credibility (4-6 verification sources with analysis)

## 3. CREATIVE FORMATS
### TV 30s (Effectiveness X/10): Rationale (2-3 sent.) | Script (detailed) | Production Notes (3-4 sent.) | Impact (2-3 sent.)
### Digital Ads (Effectiveness X/10): Rationale | 3 Concepts (each: Description 3-4 sent. | Platform Strategy | Engagement Hooks)
### Radio 30s (Effectiveness X/10): Rationale | Script (detailed) | Production Notes

## 4. TARGET AUDIENCE
### Geographic: Primary/Secondary Markets + Insights (2-3 sent. each)
### Demographics (5-7 factors with campaign relevance)
### Psychographics (2-3 para.: values, beliefs, triggers, alignment)
### Persuadability (2-3 sent.)
### Reach: Primary/Secondary/Total/Penetration (with calculations)

## 5. PRODUCTION
### Visuals (4-6 concepts, 2-3 sent. each: psychological impact)
### Tone/Voice (2-3 para.)
### Music/Sound (4-5 sent.)
### B-Roll (6-10 shots with purpose)
### Color (psychology + recommendations)

## 6. BUDGET & TIMELINE
### Costs: Low/Med/High budgets (3-4 sent. each) | Recommended (4-5 sent.)
### Timeline (phase-by-phase, 5-7 points)
### Media Mix (% breakdowns with justification)
### Total Range (3-4 sent. with assumptions)

## 7. CTA
### Primary (3-4 sent.: why optimal, psychology, behavior)
### Secondary (3-5 options, 2-3 sent. each)
### Landing Page (6-8 specs with strategic purpose)

## 8. METRICS
### KPIs (6-10 with targets, 1-2 sent. each)
### Conversion Rates (funnel benchmarks, 4-5 sent.)

### Tools (platforms, methods, 2-3 sent.)
### Success Definition (2-3 para.: holistic view, theory of change)

## 9. LEGAL
### Disclaimers (exact text + placement)
### Sources (5-8 with citations, 2 sent. each)
### Fair Use (4-5 sent. on music, images, rights, mitigation)
### Compliance (5-7 FEC/state/platform requirements)

## NEXT STEPS
(8-12 steps with owners, deadlines, dependencies, 1-2 sent. each)

START NOW: Generate complete brief from "# CREATIVE BRIEF" to final "NEXT STEPS". No conversational text. Complete ALL 9 sections.`;
}

/**
 * Call Anthropic Claude API via backend proxy
 */
async function generateWithAnthropic(prompt) {
  // Call the backend proxy instead of Anthropic directly (to avoid CORS issues)
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

  const response = await fetch(`${API_URL}/api/generate-creative-brief`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      prompt: prompt,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    if (error.useMock) {
      throw new Error('API key not configured on server. Using mock data.');
    }
    throw new Error(`API error: ${error.error || response.statusText}`);
  }

  const data = await response.json();
  return data.brief;
}

/**
 * Call OpenAI API
 */
async function generateWithOpenAI(prompt) {
  if (!OPENAI_API_KEY) {
    throw new Error('OpenAI API key not configured. Set VITE_OPENAI_API_KEY in .env file.');
  }

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'gpt-4-turbo-preview',
      messages: [
        {
          role: 'system',
          content: 'You are a professional political campaign creative director specializing in generating comprehensive creative briefs.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      max_tokens: 4096,
      temperature: 0.7,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`OpenAI API error: ${error.error?.message || response.statusText}`);
  }

  const data = await response.json();
  return data.choices[0].message.content;
}

/**
 * Generate a mock creative brief (for testing without API keys)
 */
function generateMockBrief(story, censusData, verification) {
  const date = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return `# CREATIVE BRIEF

**Generated:** ${date} | **Story ID:** ${story.id}

---

## 1. EXECUTIVE SUMMARY

**Campaign Title:** "${story.headline.split(' ').slice(0, 4).join(' ')}"

**Core Message:** ${story.headline} This verified story demonstrates the real-world impact of federal policy changes on everyday Americans in ${story.location.city}, ${story.location.state}.

**Primary Objective:** Mobilize ${story.aiAnalysis.demographicAppeal.join(', ')} by highlighting the tangible consequences of policy decisions on local communities.

**Target Audience:** ${story.aiAnalysis.demographicAppeal.join(', ')} in ${story.location.district} and similar swing districts.

**Verification Status:**
- AI Verification Score: ${story.verificationScore}%
- Census Bureau Confidence: ${verification?.confidence || 75}%
- Message Resonance: ${story.aiAnalysis.messageResonance}%
- Competitive Vulnerability: ${story.aiAnalysis.competitiveVulnerability}

---

## 2. STORY NARRATIVE

**Key Emotional Hook:**
Real people in ${story.location.city} are experiencing immediate, measurable impacts from federal policy changes. This is not abstract politics - it affects ${story.impact.affected_population.toLocaleString()} people in their daily lives.

**Most Compelling Details:**
${story.story.split('.').slice(0, 3).map(s => `- ${s.trim()}`).join('\n')}

**Before/After Framing:**
- BEFORE: Stable community services, predictable outcomes
- AFTER: Disruption within ${story.impact.timeframe}, ${story.impact.affected_population.toLocaleString()} people affected

**Credibility Elements:**
- Verified by US Census Bureau (${verification?.confidence || 75}% confidence)
- Real ZIP code data: ${censusData?.population.total.toLocaleString() || '66,000+'} residents
- Economic impact: $${Math.abs(story.impact.economic / 1000000).toFixed(1)}M
- Specific timeframe: ${story.impact.timeframe}

---

## 3. RECOMMENDED CREATIVE FORMATS

### TV Commercial (30-second) - **Effectiveness: 9/10**

**Script Outline:**
\`\`\`
[0:00-0:05] OPEN: Establishing shot of ${story.location.city}
SUPER: "${story.location.city}, ${story.location.state}"

[0:05-0:15] NARRATOR VO: "${story.headline}"
B-ROLL: Visual evidence of impact

[0:15-0:22] TESTIMONIAL: Local resident shares personal story
SUPER: Real impact statistics

[0:22-0:28] CALL TO ACTION: "Our communities deserve better."
SUPER: Contact information

[0:28-0:30] LEGAL: Paid for by... / Learn more at...
\`\`\`

### Digital Ad Series (Social Media) - **Effectiveness: 10/10**

**Concept 1: "By The Numbers"**
- Static infographic showing Census data + impact metrics
- Headline: "${story.impact.affected_population.toLocaleString()} Neighbors Affected"
- 15-second version for Instagram/Facebook Stories

**Concept 2: "Real Stories"**
- User-generated style video testimonial
- Authentic, unpolished feel
- Text overlay with verification checkmarks
- 30-second for Facebook/YouTube

**Concept 3: "Before & After"**
- Split-screen comparison
- Show measurable change over ${story.impact.timeframe}
- Shareable carousel format for Instagram

### Radio Spot (30-second) - **Effectiveness: 7/10**

**Script:**
\`\`\`
[SFX: Ambient community sounds]

NARRATOR: In ${story.location.city}, ${story.impact.affected_population.toLocaleString()} people
just experienced something they never expected.

[PAUSE]

${story.headline}

Verified by the US Census Bureau. Real people. Real impact. Real consequences.

Learn more about how policy affects your community at [website].

[LEGAL TAG]
\`\`\`

---

## 4. TARGET AUDIENCE SPECIFICATION

**Geographic Targeting:**
- Primary: ${story.location.district} (${story.location.county} County, ${story.location.state})
- Secondary: Similar districts with comparable demographics
- ZIP Codes: ${story.location.zip} and surrounding areas

**Demographic Profile:**
- Age: ${story.demographics?.age || '35-55'} ± 10 years (core: 25-55)
- Income: $${censusData?.income.medianHousehold.toLocaleString() || '45,000-75,000'}
- Education: ${story.demographics?.education?.replace('_', ' ') || 'High school to college educated'}
- Party: ${story.demographics?.party || 'Independent'}, swing voters, independents

**Psychographic Profile:**
- Values: Community stability, family security, local services
- Concerns: Economic uncertainty, service quality, future outlook
- Voting Behavior: Persuadable, issue-focused, evidence-driven
- Media Consumption: Mix of traditional and digital, Facebook-heavy

**Estimated Reach:**
- Primary audience: ${Math.floor(story.impact.affected_population * 3).toLocaleString()} (3x affected population)
- Secondary audience: ${Math.floor(story.impact.affected_population * 10).toLocaleString()} (similar districts)
- Total potential impressions: 2.5M - 4M

---

## 5. VISUAL & PRODUCTION GUIDANCE

**Key Visual Concepts:**
- Actual locations in ${story.location.city} (establishing authenticity)
- Real community members (not actors, if possible)
- Documentary-style cinematography (iPhone aesthetic acceptable)
- Data visualizations showing Census verification

**Tone and Voice:**
- Empathetic but not melodramatic
- Factual, verified, credible
- Conversational, accessible language
- Avoid political jargon

**Music/Sound:**
- Subtle, emotional underscore (not manipulative)
- Real ambient sounds from location
- Natural dialogue, minimal processing

**B-Roll Requirements:**
- ${story.location.city} street scenes, community spaces
- Related visuals specific to ${story.policyArea}
- Census data graphics, verification badges
- User-generated content (with permissions)

**Color Palette:**
- Warm, trustworthy tones
- Blues (credibility, verification)
- Greens (growth, hope, action)
- Avoid red/orange (too aggressive)

---

## 6. BUDGET & TIMELINE

**Production Costs:**
- Low Budget: $15,000 - $25,000 (UGC-style, minimal crew)
- Medium Budget: $35,000 - $55,000 (professional production, local crew)
- High Budget: $75,000 - $120,000 (full production, multiple formats)

**Recommended:** Medium budget for credibility while maintaining authenticity

**Production Timeline:**
- Pre-production: 3-5 days (location scouting, permissions, scripting)
- Production: 1-2 days (filming in ${story.location.city})
- Post-production: 5-7 days (editing, sound, graphics)
- Review/revisions: 2-3 days
- **Total: 14-17 business days**

**Media Buy Allocation:**
- Digital/Social: 60% ($120K-$180K)
- TV (local cable): 30% ($60K-$90K)
- Radio: 10% ($20K-$30K)
- **Total Media Budget: $200K-$300K**

**Total Campaign Budget Range: $235K-$375K**

---

## 7. CALL TO ACTION OPTIONS

**Primary CTA (Recommended):**
"Learn how policy affects your community. Visit [website]"
- Drives to landing page with full story + Census data
- Email capture for follow-up
- Social sharing built in

**Secondary CTA Options:**
- "Contact your representative at [phone/link]"
- "Share your story at [website]"
- "See the verified data at [Census link]"
- "Text FACTS to [number] for more information"

**Landing Page Requirements:**
- Full citizen story with verification details
- Interactive Census data visualization
- Additional stories from the district
- Email signup and social sharing
- Representative contact information

---

## 8. METRICS & SUCCESS CRITERIA

**Key Performance Indicators:**
- **Reach:** 2.5M+ impressions
- **Engagement:** 8%+ engagement rate (digital)
- **Website Traffic:** 50K+ landing page visits
- **Email Captures:** 5K+ new subscribers
- **Social Shares:** 10K+ organic shares
- **Representative Contacts:** 2K+ calls/emails to officials

**Expected Conversion Rates:**
- Impression → Click: 2-3%
- Click → Landing Page Visit: 75%
- Visit → Action (email/call/share): 10-15%

**Measurement Tools:**
- Google Analytics (website traffic, conversions)
- Facebook Ads Manager (social metrics)
- Call tracking numbers (phone responses)
- Email platform analytics (subscriber growth)

**Success Criteria:**
Campaign is successful if it achieves:
- ✓ 80%+ reach of target audience
- ✓ Above-average engagement rates for political ads
- ✓ Measurable increase in constituent contacts to representatives
- ✓ Positive sentiment in social mentions (>70%)

---

## 9. LEGAL & COMPLIANCE

**Required Disclaimers:**
\`\`\`
"Paid for by [Organization Name]"
"Not authorized by any candidate or candidate's committee"
"Visit [website] for sources and verification"
\`\`\`

**Fact-Checking Verification Sources:**
- US Census Bureau ACS ${censusData?.dataYear || '2022'} 5-Year Estimates (public record)
- Congressional District ${story.location.district} official boundaries
- Story verified ${story.verificationScore}% by AI cross-reference with government data
- Economic impact calculated from federal spending databases

**Fair Use Considerations:**
- All Census data is public domain
- Citizen story submitted with consent for political use
- No copyrighted music or imagery without licenses
- Location footage requires standard location releases
- Testimonial releases required for any named individuals

**Regulatory Compliance:**
- FEC disclaimer requirements (if applicable)
- State campaign finance law compliance
- Platform-specific advertising policies (Facebook, Google, etc.)
- Accessibility requirements (closed captions for all video)

---

## NEXT STEPS

1. **Review & Approve:** Stakeholder review of creative brief
2. **Budget Approval:** Secure funding for $235K-$375K total campaign
3. **Production Team:** Hire creative team or agency
4. **Location Permissions:** Secure filming rights in ${story.location.city}
5. **Legal Review:** Ensure all compliance requirements met
6. **Production:** Execute 14-17 day production schedule
7. **Media Buy:** Reserve inventory for digital/TV/radio placement
8. **Launch:** Coordinate multi-platform campaign launch
9. **Monitor:** Real-time tracking and optimization
10. **Report:** Weekly performance reporting against KPIs

---

**Document Generated by:** Democratic Accountability Platform AI
**Data Sources:** US Census Bureau, Federal Government APIs, AI Verification System
**Verification Confidence:** ${verification?.confidence || 75}%
**Campaign Readiness:** Production-ready upon approval
`;
}

/**
 * Main function to generate a creative brief
 * @param {Object} story - The citizen story
 * @param {Object} censusData - Census demographic data
 * @param {Object} verification - Census verification results
 * @param {boolean} useMock - Use mock data instead of real AI (for testing)
 * @returns {Promise<string>} The generated creative brief in markdown format
 */
export async function generateCreativeBrief(story, censusData, verification, useMock = false) {
  try {
    // Use mock for development/testing without API keys
    if (useMock || (!ANTHROPIC_API_KEY && !OPENAI_API_KEY)) {
      console.log('Using mock creative brief generator (no API keys configured)');
      return generateMockBrief(story, censusData, verification);
    }

    const prompt = buildCreativeBriefPrompt(story, censusData, verification);

    let briefContent;
    if (AI_PROVIDER === 'anthropic') {
      briefContent = await generateWithAnthropic(prompt);
    } else if (AI_PROVIDER === 'openai') {
      briefContent = await generateWithOpenAI(prompt);
    } else {
      throw new Error(`Unknown AI provider: ${AI_PROVIDER}`);
    }

    return briefContent;
  } catch (error) {
    console.error('Error generating creative brief:', error);
    // Fallback to mock if AI fails
    console.log('Falling back to mock creative brief due to error');
    return generateMockBrief(story, censusData, verification);
  }
}

export default {
  generateCreativeBrief,
};
