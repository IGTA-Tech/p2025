import React, { useState } from 'react'
import DemocraticAccountabilityPlatform from './DemocraticAccountabilityPlatform.jsx'
import ConversationalInput from './ConversationalInput.jsx'
import NearbyStories from './components/NearbyStories.jsx'
import { MessageSquare, BarChart3, Shield, Database, Users, Zap, MapIcon, TrendingUp } from 'lucide-react'
import { submitStory } from './services/supabaseClient'

export default function App() {
  const [view, setView] = useState('landing') // 'landing', 'citizen', 'admin', 'nearby'
  const [adminView, setAdminView] = useState('dashboard') // 'citizen', 'dashboard', 'creative', 'business'
  const [submittedLocation, setSubmittedLocation] = useState(null) // Store location for nearby stories
  const [submittedStoryId, setSubmittedStoryId] = useState(null) // Store ID to exclude from nearby

  // Handle story submission to Supabase
  const handleStorySubmit = async (conversationalStory) => {
    try {
      console.log('=== Story Submission Debug ===');
      console.log('Full conversationalStory object:', conversationalStory);
      console.log('Location data received:', conversationalStory.location);

      // Generate unique ID
      const storyId = `story_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      // Extract first user message as headline (truncate if too long)
      const headline = conversationalStory.messages[0]?.text?.slice(0, 200) || 'Citizen Story';

      // Combine all user messages into the full story
      const fullStory = conversationalStory.messages.map(m => m.text).join('\n\n');

      // Infer policy area from story content (basic keyword matching)
      const storyLower = fullStory.toLowerCase();
      let policyArea = 'other';

      if (storyLower.includes('health') || storyLower.includes('hospital') || storyLower.includes('insurance') || storyLower.includes('medicaid') || storyLower.includes('medicare')) {
        policyArea = 'healthcare';
      } else if (storyLower.includes('school') || storyLower.includes('teacher') || storyLower.includes('education') || storyLower.includes('student')) {
        policyArea = 'education';
      } else if (storyLower.includes('job') || storyLower.includes('work') || storyLower.includes('employ') || storyLower.includes('salary')) {
        policyArea = 'employment';
      } else if (storyLower.includes('immigration') || storyLower.includes('border') || storyLower.includes('visa')) {
        policyArea = 'immigration';
      } else if (storyLower.includes('environment') || storyLower.includes('climate') || storyLower.includes('pollution')) {
        policyArea = 'environment';
      } else if (storyLower.includes('housing') || storyLower.includes('rent') || storyLower.includes('evict')) {
        policyArea = 'housing';
      }

      // Determine severity based on verification score
      let severity = 'medium';
      if (conversationalStory.score?.overall >= 90) {
        severity = 'critical';
      } else if (conversationalStory.score?.overall >= 80) {
        severity = 'high';
      } else if (conversationalStory.score?.overall < 70) {
        severity = 'low';
      }

      // Build story object in the format Supabase expects
      const locationToUse = conversationalStory.location || {
        zip: '00000',
        city: null,
        state: null,
        county: null,
        district: null,
      };

      console.log('Location being used for submission:', locationToUse);

      const storyToSubmit = {
        id: storyId,
        submittedAt: conversationalStory.timestamp.toISOString(),
        location: locationToUse,
        policyArea: policyArea,
        severity: severity,
        headline: headline,
        story: fullStory,
        verificationStatus: 'verified',
        verificationScore: conversationalStory.score?.overall || 0,
        evidence: [],
        demographics: {},
        impact: {
          economic: 0,
          affected_population: 1,
          timeframe: 'recent',
          correlation_confidence: conversationalStory.score?.policyCorrelation || 0,
        },
        aiAnalysis: {
          dataMatch: conversationalStory.score?.dataMatch || 0,
          timelineConsistency: conversationalStory.score?.timelineConsistency || 0,
          geographicVerification: conversationalStory.score?.geographicVerification || 0,
          policyCorrelation: conversationalStory.score?.policyCorrelation || 0,
        },
      };

      // Submit to Supabase
      console.log('Submitting story to Supabase:', storyToSubmit);
      const result = await submitStory(storyToSubmit);
      console.log('Story submitted successfully:', result);

      // Store location and story ID for nearby stories page
      setSubmittedLocation(locationToUse);
      setSubmittedStoryId(storyId);

      // Navigate to nearby stories after a delay to let user see verification results
      setTimeout(() => {
        setView('nearby');
      }, 3000);

    } catch (error) {
      console.error('Error submitting story to Supabase:', error);
      // Still store location for nearby stories even if DB submission fails
      const locationToUse = conversationalStory.location || {
        zip: '00000',
        city: null,
        state: null,
        county: null,
        district: null,
      };
      setSubmittedLocation(locationToUse);

      // Navigate to nearby stories after a delay
      setTimeout(() => {
        setView('nearby');
      }, 3000);
    }
  };

  // Landing Page View
  if (view === 'landing') {
    return (
      <div className="min-h-screen relative overflow-x-hidden">
        {/* Navigation */}
        <nav className="fixed top-0 left-0 right-0 z-50 glass-card mx-2 sm:mx-4 mt-2 sm:mt-4">
          <div className="max-w-7xl mx-auto px-3 sm:px-6 py-3 sm:py-4 flex items-center justify-between">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl gradient-bg flex items-center justify-center text-xl sm:text-2xl">
                📍
              </div>
              <span className="text-base sm:text-xl font-bold animated-gradient-text">Project Pain Point</span>
            </div>

            <button
              onClick={() => setView('admin')}
              className="text-xs sm:text-sm text-gray-400 hover:text-white transition-colors"
            >
              Admin →
            </button>
          </div>
        </nav>

        {/* Hero Section */}
        <section className="pt-24 sm:pt-32 pb-12 sm:pb-20 px-4">
          <div className="max-w-5xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 glass-card px-3 sm:px-4 py-2 rounded-full mb-4 sm:mb-6">
              <div className="pulse-dot"></div>
              <span className="text-xs sm:text-sm">247,831 Citizens Sharing Real Experiences</span>
            </div>

            <h1 className="text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-black mb-4 sm:mb-6 leading-tight">
              <span className="animated-gradient-text">Your Story.</span><br />
              <span className="animated-gradient-text">Real Data.</span><br />
              <span className="text-white">Instant Accountability.</span>
            </h1>

            <p className="text-base sm:text-xl md:text-2xl text-gray-300 mb-6 sm:mb-8 max-w-3xl mx-auto leading-relaxed px-2">
              We collect your real experiences with federal policies and connect them to live government data,
              news coverage, and thousands of other citizen voices. See exactly what's happening in your
              community—with facts, evidence, and transparency that creates real accountability.
            </p>

            {/* Primary CTA */}
            <button
              onClick={() => setView('citizen')}
              className="gradient-bg text-white px-6 sm:px-12 py-4 sm:py-5 rounded-2xl text-base sm:text-xl font-bold hover:opacity-90 transition-opacity glow-button mb-4 inline-flex items-center gap-2 sm:gap-3"
            >
              <MessageSquare className="w-5 h-5 sm:w-6 sm:h-6" />
              Enter Citizen Portal
            </button>

            <p className="text-xs sm:text-sm text-gray-500">
              Share your story in under 60 seconds
            </p>
          </div>
        </section>

        {/* How It Works */}
        <section className="py-12 sm:py-20 px-4 bg-opacity-50">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-center mb-3 sm:mb-4 gradient-text">
              Your Voice. Amplified by Intelligence.
            </h2>
            <p className="text-center text-gray-400 mb-8 sm:mb-16 text-sm sm:text-lg max-w-2xl mx-auto px-2">
              We don't just collect stories—we verify them, connect them to data, and show decision-makers
              the real impact of policy decisions.
            </p>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-8">
              <div className="impact-card text-center p-4 sm:p-6">
                <div className="w-12 h-12 sm:w-16 sm:h-16 gradient-bg rounded-xl sm:rounded-2xl flex items-center justify-center mx-auto mb-3 sm:mb-4">
                  <MessageSquare className="w-6 h-6 sm:w-8 sm:h-8" />
                </div>
                <h3 className="font-bold text-sm sm:text-lg mb-1 sm:mb-2">1. Share Experience</h3>
                <p className="text-xs sm:text-sm text-gray-400">
                  Tell us what changed in your community.
                </p>
              </div>

              <div className="impact-card text-center p-4 sm:p-6">
                <div className="w-12 h-12 sm:w-16 sm:h-16 gradient-bg rounded-xl sm:rounded-2xl flex items-center justify-center mx-auto mb-3 sm:mb-4">
                  <Shield className="w-6 h-6 sm:w-8 sm:h-8" />
                </div>
                <h3 className="font-bold text-sm sm:text-lg mb-1 sm:mb-2">2. AI Verification</h3>
                <p className="text-xs sm:text-sm text-gray-400">
                  AI cross-references 20+ government databases.
                </p>
              </div>

              <div className="impact-card text-center p-4 sm:p-6">
                <div className="w-12 h-12 sm:w-16 sm:h-16 gradient-bg rounded-xl sm:rounded-2xl flex items-center justify-center mx-auto mb-3 sm:mb-4">
                  <Database className="w-6 h-6 sm:w-8 sm:h-8" />
                </div>
                <h3 className="font-bold text-sm sm:text-lg mb-1 sm:mb-2">3. Pattern Detection</h3>
                <p className="text-xs sm:text-sm text-gray-400">
                  Match your story with thousands of others.
                </p>
              </div>

              <div className="impact-card text-center p-4 sm:p-6">
                <div className="w-12 h-12 sm:w-16 sm:h-16 gradient-bg rounded-xl sm:rounded-2xl flex items-center justify-center mx-auto mb-3 sm:mb-4">
                  <Zap className="w-6 h-6 sm:w-8 sm:h-8" />
                </div>
                <h3 className="font-bold text-sm sm:text-lg mb-1 sm:mb-2">4. Create Change</h3>
                <p className="text-xs sm:text-sm text-gray-400">
                  Your voice becomes undeniable data.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Real-Time Intelligence Section */}
        <section className="py-12 sm:py-20 px-4">
          <div className="max-w-6xl mx-auto text-center">
            <div className="glass-card p-6 sm:p-12 rounded-2xl sm:rounded-3xl">
              <div className="w-14 h-14 sm:w-20 sm:h-20 gradient-bg rounded-2xl sm:rounded-3xl flex items-center justify-center mx-auto mb-4 sm:mb-6">
                <TrendingUp className="w-7 h-7 sm:w-10 sm:h-10" />
              </div>
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-black mb-3 sm:mb-4 gradient-text">
                Real-Time Pain Point Intelligence
              </h2>
              <p className="text-sm sm:text-xl text-gray-400 mb-6 sm:mb-8 max-w-2xl mx-auto px-2">
                Every story is instantly connected to live government data, verified by AI, and mapped to thousands of similar experiences across the nation.
              </p>
              <button
                onClick={() => setView('admin')}
                className="gradient-bg text-white px-6 sm:px-8 py-3 sm:py-4 rounded-xl font-semibold hover:opacity-90 transition-opacity inline-flex items-center gap-2 text-sm sm:text-base"
              >
                <BarChart3 className="w-4 h-4 sm:w-5 sm:h-5" />
                <span>View Dashboard</span>
                <span>→</span>
              </button>
            </div>
          </div>
        </section>

        {/* Stats Section */}
        <section className="py-12 sm:py-20 px-4">
          <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-6">
              <div className="impact-card text-center p-4 sm:p-8">
                <div className="text-2xl sm:text-4xl md:text-5xl font-black gradient-text mb-1 sm:mb-2">247K+</div>
                <div className="text-xs sm:text-sm text-gray-400">Verified Stories</div>
                <div className="badge success mt-2 text-xs">94.7% Accuracy</div>
              </div>
              <div className="impact-card text-center p-4 sm:p-8">
                <div className="text-2xl sm:text-4xl md:text-5xl font-black gradient-text mb-1 sm:mb-2">50</div>
                <div className="text-xs sm:text-sm text-gray-400">States Covered</div>
                <div className="badge info mt-2 text-xs">Real-Time</div>
              </div>
              <div className="impact-card text-center p-4 sm:p-8">
                <div className="text-2xl sm:text-4xl md:text-5xl font-black gradient-text mb-1 sm:mb-2">20+</div>
                <div className="text-xs sm:text-sm text-gray-400">Gov't APIs</div>
                <div className="badge high mt-2 text-xs">Live Data</div>
              </div>
              <div className="impact-card text-center p-4 sm:p-8">
                <div className="text-2xl sm:text-4xl md:text-5xl font-black gradient-text mb-1 sm:mb-2">$287B</div>
                <div className="text-xs sm:text-sm text-gray-400">Economic Impact</div>
                <div className="badge critical mt-2 text-xs">Tracked</div>
              </div>
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="py-12 sm:py-20 px-4">
          <div className="max-w-4xl mx-auto glass-card p-6 sm:p-12 text-center rounded-2xl sm:rounded-3xl">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-black mb-3 sm:mb-4 animated-gradient-text">
              Your Experience Matters
            </h2>
            <p className="text-base sm:text-xl text-gray-300 mb-6 sm:mb-8 px-2">
              Join 247,831 citizens creating accountability through transparency
            </p>
            <button
              onClick={() => setView('citizen')}
              className="gradient-bg text-white px-6 sm:px-12 py-4 sm:py-5 rounded-2xl text-base sm:text-xl font-bold hover:opacity-90 transition-opacity inline-flex items-center gap-2 sm:gap-3"
            >
              <MessageSquare className="w-5 h-5 sm:w-6 sm:h-6" />
              Share Your Story Now
            </button>
          </div>
        </section>

        {/* Footer */}
        <footer className="py-8 px-4 border-t border-gray-800">
          <div className="max-w-6xl mx-auto text-center text-sm text-gray-500">
            <p>Project Pain Point - Citizen Voice Intelligence Platform</p>
            <p className="mt-2">Powered by AI-verified data from 20+ federal sources</p>
          </div>
        </footer>
      </div>
    );
  }

  // Citizen Portal View
  if (view === 'citizen') {
    return (
      <div className="min-h-screen relative">
        <nav className="fixed top-0 left-0 right-0 z-50 glass-card mx-2 sm:mx-4 mt-2 sm:mt-4">
          <div className="max-w-6xl mx-auto px-3 sm:px-6 py-3 sm:py-4 flex items-center justify-between">
            <button onClick={() => setView('landing')} className="flex items-center gap-2 sm:gap-3">
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl gradient-bg flex items-center justify-center text-xl sm:text-2xl">
                📍
              </div>
              <span className="text-base sm:text-xl font-bold animated-gradient-text hidden sm:inline">Project Pain Point</span>
            </button>

            <div className="live-indicator text-xs sm:text-sm">
              <span>Citizen Portal</span>
            </div>
          </div>
        </nav>

        <div className="pt-20 sm:pt-24 pb-8 sm:pb-12 px-3 sm:px-4">
          <div className="slide-up-animation">
            <div className="text-center mb-8 sm:mb-12 max-w-4xl mx-auto">
              <h1 className="text-2xl sm:text-4xl md:text-5xl font-black mb-3 sm:mb-4 animated-gradient-text">
                Your Story Changes Everything
              </h1>
              <p className="text-sm sm:text-lg md:text-xl text-gray-400 px-2">
                Share what's really happening in your community. AI verifies your experience
                and connects it with thousands of others to create real political change.
              </p>
            </div>

            <ConversationalInput
              onStorySubmit={handleStorySubmit}
            />
          </div>
        </div>
      </div>
    );
  }

  // Nearby Stories View (shown after story submission)
  if (view === 'nearby') {
    return (
      <div className="min-h-screen relative">
        <nav className="fixed top-0 left-0 right-0 z-50 glass-card mx-2 sm:mx-4 mt-2 sm:mt-4">
          <div className="max-w-6xl mx-auto px-3 sm:px-6 py-3 sm:py-4 flex items-center justify-between">
            <button onClick={() => setView('landing')} className="flex items-center gap-2 sm:gap-3">
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl gradient-bg flex items-center justify-center text-xl sm:text-2xl">
                📍
              </div>
              <span className="text-base sm:text-xl font-bold animated-gradient-text hidden sm:inline">Project Pain Point</span>
            </button>

            <div className="live-indicator text-xs sm:text-sm">
              <span>Community Stories</span>
            </div>
          </div>
        </nav>

        <div className="pt-20 sm:pt-24">
          <NearbyStories
            location={submittedLocation}
            submittedStoryId={submittedStoryId}
            onBack={() => setView('citizen')}
          />
        </div>
      </div>
    );
  }

  // Admin View
  return (
    <div className="min-h-screen relative">
      <nav className="fixed top-0 left-0 right-0 z-50 glass-card mx-2 sm:mx-4 mt-2 sm:mt-4">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 py-3 sm:py-4">
          {/* Desktop layout */}
          <div className="hidden md:flex items-center justify-between">
            <button onClick={() => setView('landing')} className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl gradient-bg flex items-center justify-center text-2xl">
                📍
              </div>
              <span className="text-xl font-bold animated-gradient-text">Project Pain Point</span>
            </button>

            <div className="flex gap-2">
              <button
                onClick={() => setAdminView('dashboard')}
                className={`glass-card px-4 py-2 rounded-full font-semibold hover:bg-opacity-20 flex items-center gap-2 ${adminView === 'dashboard' ? 'ring-2 ring-blue-500' : ''}`}
              >
                <BarChart3 className="w-4 h-4" />
                Intelligence
              </button>
              <button
                onClick={() => setAdminView('creative')}
                className={`glass-card px-4 py-2 rounded-full font-semibold hover:bg-opacity-20 flex items-center gap-2 ${adminView === 'creative' ? 'ring-2 ring-blue-500' : ''}`}
              >
                <TrendingUp className="w-4 h-4" />
                Creative
              </button>
              <button
                onClick={() => setAdminView('business')}
                className={`glass-card px-4 py-2 rounded-full font-semibold hover:bg-opacity-20 flex items-center gap-2 ${adminView === 'business' ? 'ring-2 ring-blue-500' : ''}`}
              >
                <Users className="w-4 h-4" />
                Business
              </button>
            </div>

            <div className="live-indicator">
              <span>Admin View</span>
            </div>
          </div>

          {/* Mobile layout */}
          <div className="md:hidden">
            <div className="flex items-center justify-between mb-3">
              <button onClick={() => setView('landing')} className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl gradient-bg flex items-center justify-center text-xl">
                  📍
                </div>
              </button>
              <div className="live-indicator text-xs">
                <span>Admin</span>
              </div>
            </div>
            <div className="flex gap-1 overflow-x-auto pb-1 -mx-1 px-1">
              <button
                onClick={() => setAdminView('dashboard')}
                className={`glass-card px-3 py-1.5 rounded-full text-xs font-semibold hover:bg-opacity-20 flex items-center gap-1.5 whitespace-nowrap ${adminView === 'dashboard' ? 'ring-2 ring-blue-500' : ''}`}
              >
                <BarChart3 className="w-3 h-3" />
                Intel
              </button>
              <button
                onClick={() => setAdminView('creative')}
                className={`glass-card px-3 py-1.5 rounded-full text-xs font-semibold hover:bg-opacity-20 flex items-center gap-1.5 whitespace-nowrap ${adminView === 'creative' ? 'ring-2 ring-blue-500' : ''}`}
              >
                <TrendingUp className="w-3 h-3" />
                Creative
              </button>
              <button
                onClick={() => setAdminView('business')}
                className={`glass-card px-3 py-1.5 rounded-full text-xs font-semibold hover:bg-opacity-20 flex items-center gap-1.5 whitespace-nowrap ${adminView === 'business' ? 'ring-2 ring-blue-500' : ''}`}
              >
                <Users className="w-3 h-3" />
                Business
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="pt-28 sm:pt-24">
        <DemocraticAccountabilityPlatform key={adminView} initialView={adminView} />
      </div>
    </div>
  );
}
