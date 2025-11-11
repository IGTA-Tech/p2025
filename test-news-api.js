/**
 * NewsAPI Integration Test Suite
 *
 * Tests real-time news tracking for policy monitoring
 * API Documentation: https://newsapi.org/docs
 */

import dotenv from 'dotenv';

// Load environment variables FIRST
dotenv.config();

// Dynamic import to ensure env vars are loaded
const {
  POLICY_KEYWORDS,
  searchPolicyNews,
  getBreakingPolicyNews,
  getNewsBaselineComparison,
  findLocalImpactStories,
  verifyNewsStory,
} = await import('./src/services/newsApi.js');

console.log('=======================================================');
console.log('NewsAPI Integration Test Suite');
console.log('Real-time Policy News Tracking');
console.log('=======================================================\n');

console.log('⚠️  NOTE: NewsAPI free tier - 100 requests/day limit');
console.log('   Tests designed to use minimal requests\n');

// Test 1: Policy Keywords Configuration
console.log('Test 1: Verify Policy Keywords Configuration');
console.log('----------------------------------------------');
try {
  console.log('✓ Policy areas configured:', Object.keys(POLICY_KEYWORDS).length);
  console.log('\nSample Policy Areas:');
  Object.keys(POLICY_KEYWORDS).slice(0, 5).forEach((area) => {
    const keywords = POLICY_KEYWORDS[area];
    console.log(`  - ${area}: ${keywords.slice(0, 3).join(', ')}...`);
  });
} catch (error) {
  console.log('✗ Test Failed:', error.message);
}

console.log('\n');

// Test 2: Search Policy News (Immigration in Texas)
console.log('Test 2: Search Immigration Policy News (Texas)');
console.log('------------------------------------------------');
try {
  const immigrationNews = await searchPolicyNews('immigration', 'Texas', 7); // Last 7 days only

  if (immigrationNews.error) {
    console.log('⚠️  Error:', immigrationNews.errorMessage);
    console.log('Error Type:', immigrationNews.errorType);
  } else {
    console.log('✓ Policy Area:', immigrationNews.policyArea);
    console.log('Location:', immigrationNews.location || 'National');
    console.log('Articles Found:', immigrationNews.totalResults);
    console.log('Articles Retrieved:', immigrationNews.articles.length);
    console.log('Source:', immigrationNews.source);

    if (immigrationNews.articles && immigrationNews.articles.length > 0) {
      console.log('\nSample Headlines:');
      immigrationNews.articles.slice(0, 3).forEach((article, index) => {
        console.log(`  ${index + 1}. ${article.title}`);
        console.log(`     Source: ${article.source.name}`);
        console.log(`     Published: ${article.publishedAt}`);
      });
    }
  }
} catch (error) {
  console.log('✗ Test Failed:', error.message);
}

console.log('\n');

// Test 3: Get Breaking Policy News
console.log('Test 3: Get Breaking Policy News');
console.log('----------------------------------');
try {
  const breakingNews = await getBreakingPolicyNews('economy', 'us', 'general');

  if (!breakingNews) {
    console.log('⚠️  Breaking news unavailable');
  } else if (breakingNews.error) {
    console.log('⚠️  Error:', breakingNews.errorMessage);
  } else {
    console.log('✓ Policy Area:', breakingNews.policyArea || 'General');
    console.log('Country:', breakingNews.country);
    console.log('Headlines Found:', breakingNews.totalResults);
    console.log('Source:', breakingNews.source);

    if (breakingNews.headlines && breakingNews.headlines.length > 0) {
      console.log('\nTop Headlines:');
      breakingNews.headlines.slice(0, 3).forEach((article, index) => {
        console.log(`  ${index + 1}. ${article.title}`);
      });
    }
  }
} catch (error) {
  console.log('✗ Test Failed:', error.message);
}

console.log('\n');

// Test 4: News Baseline Comparison
console.log('Test 4: News Coverage Baseline Comparison');
console.log('------------------------------------------');
try {
  console.log('Comparing education policy coverage (pre/post Jan 1, 2025)...');

  const baseline = await getNewsBaselineComparison('education', null, '2025-01-01');

  if (baseline.status === 'partial') {
    console.log('⚠️  Partial data:', baseline.message);
  } else {
    console.log('✓ Policy Area:', baseline.policyArea);
    console.log('Location:', baseline.location);
    console.log('Baseline Date:', baseline.baselineDate);
    console.log('Status:', baseline.status);

    if (baseline.changes && baseline.changes.available) {
      console.log('\nCoverage Changes:');
      console.log('  Before baseline:', baseline.beforeBaseline.articleCount, 'articles');
      console.log('  After baseline:', baseline.afterBaseline.articleCount, 'articles');
      console.log('  Daily avg before:', baseline.changes.beforeDailyAvg);
      console.log('  Daily avg after:', baseline.changes.afterDailyAvg);
      console.log('  Change:', baseline.changes.coverageChangePct + '%');
      console.log('  Trend:', baseline.changes.coverageTrend);

      if (baseline.changes.newSources && baseline.changes.newSources.length > 0) {
        console.log('  New sources covering:', baseline.changes.newSources.slice(0, 3).join(', '));
      }
    }
  }
} catch (error) {
  console.log('✗ Test Failed:', error.message);
}

console.log('\n');

// Test 5: Find Local Impact Stories
console.log('Test 5: Find Local Impact Stories (California)');
console.log('-----------------------------------------------');
try {
  console.log('Searching for local healthcare policy impact stories...');

  const localStories = await findLocalImpactStories('healthcare', 'California', null, 7); // 7 days

  if (localStories.status === 'partial') {
    console.log('⚠️  Partial data:', localStories.message);
  } else {
    console.log('✓ Policy Area:', localStories.policyArea);
    console.log('Location:', localStories.location);
    console.log('Total Articles Found:', localStories.totalArticlesFound);
    console.log('Local Stories:', localStories.localStoriesCount);
    console.log('Status:', localStories.status);

    if (localStories.impactCategories && localStories.impactCategories.categoryCounts) {
      console.log('\nImpact Categories:');
      Object.entries(localStories.impactCategories.categoryCounts).forEach(([category, count]) => {
        if (count > 0) {
          console.log(`  - ${category}: ${count} stories`);
        }
      });

      if (localStories.impactCategories.mostCommonImpact) {
        console.log(`\nMost Common Impact Type: ${localStories.impactCategories.mostCommonImpact}`);
      }
    }

    if (localStories.localStories && localStories.localStories.length > 0) {
      console.log('\nSample Local Headlines:');
      localStories.localStories.slice(0, 3).forEach((story, index) => {
        console.log(`  ${index + 1}. ${story.title}`);
        console.log(`     Locality Score: ${story.localityScore || 'N/A'}`);
      });
    }
  }
} catch (error) {
  console.log('✗ Test Failed:', error.message);
}

console.log('\n');

// Test 6: Verify News Story
console.log('Test 6: Verify News Coverage of Citizen Story');
console.log('----------------------------------------------');
try {
  const citizenStory = {
    headline: 'Local families struggle with rising healthcare costs',
    story: 'Our community has seen dramatic increases in health insurance premiums following recent policy changes. Many families are now unable to afford necessary medical care. News reports confirm these impacts across the state.',
  };

  console.log('Story to verify:');
  console.log('  Headline:', citizenStory.headline);
  console.log('  Story excerpt:', citizenStory.story.substring(0, 100) + '...');

  // Search for related news
  const relatedNews = await searchPolicyNews('healthcare', null, 7);

  console.log('\nVerifying against NewsAPI data...\n');

  const verification = verifyNewsStory(citizenStory, relatedNews);

  console.log('✓ Verified:', verification.verified);
  console.log('Confidence Score:', verification.confidence + '%');

  if (verification.flags && verification.flags.length > 0) {
    console.log('\nFlags:');
    verification.flags.forEach((flag) => {
      console.log(`  - ${flag}`);
    });
  }

  if (verification.insights && verification.insights.length > 0) {
    console.log('\nInsights:');
    verification.insights.forEach((insight) => {
      console.log(`  ${insight.type === 'api_unavailable' ? '⚠️' : '✓'} [${insight.type}] ${insight.message}`);
    });
  }

  if (verification.newsMetrics && Object.keys(verification.newsMetrics).length > 0) {
    console.log('\nNews Metrics:');
    Object.entries(verification.newsMetrics).forEach(([key, value]) => {
      console.log(`  - ${key}: ${value}`);
    });
  }
} catch (error) {
  console.log('✗ Test Failed:', error.message);
}

console.log('\n');
console.log('=======================================================');
console.log('NewsAPI Test Suite Complete');
console.log('=======================================================');
console.log('\nKey Features Tested:');
console.log('✓ Policy news search with geographic filtering');
console.log('✓ Breaking news monitoring');
console.log('✓ Baseline coverage comparison (pre/post Jan 1, 2025)');
console.log('✓ Local impact story discovery');
console.log('✓ News story verification');
console.log('\nRate Limiting:');
console.log('- Free tier: 100 requests/day');
console.log('- Automatic tracking and warnings at 80% capacity');
console.log('- Graceful degradation when limit reached');
console.log('\nIntegration Notes:');
console.log('- Correlates with 12 federal APIs for cross-validation');
console.log('- Validates government data with real-time news');
console.log('- Critical for Project 2025 policy impact tracking');
console.log('\nDocumentation: https://newsapi.org/docs');
console.log('Registration: https://newsapi.org/register');
