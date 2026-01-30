import React, { useState, useEffect, useMemo } from 'react';
import {
  MapPin, Users, Check, AlertCircle, Search, Filter, Eye,
  ChevronLeft, TrendingUp, Clock, Building2, Heart,
  GraduationCap, Briefcase, Home, TreeDeciduous, Scale, Vote, Package
} from 'lucide-react';
import { fetchStories } from '../services/supabaseClient';
import { filterStoriesByDistance } from '../services/geoUtils';

// Policy area icons mapping
const policyIcons = {
  healthcare: Heart,
  education: GraduationCap,
  employment: Briefcase,
  housing: Home,
  environment: TreeDeciduous,
  justice: Scale,
  immigration: Users,
  infrastructure: Building2,
  election: Vote,
  other: Package
};

// Policy area colors
const policyColors = {
  healthcare: '#ef4444',
  education: '#3b82f6',
  employment: '#f59e0b',
  housing: '#8b5cf6',
  environment: '#22c55e',
  justice: '#64748b',
  immigration: '#06b6d4',
  infrastructure: '#f97316',
  election: '#ec4899',
  other: '#6b7280'
};

const NearbyStories = ({ location, onBack, submittedStoryId }) => {
  const [stories, setStories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPolicyArea, setSelectedPolicyArea] = useState('all');
  const [selectedStory, setSelectedStory] = useState(null);

  const radiusMiles = 50;

  // Fetch and filter stories on mount
  useEffect(() => {
    async function loadNearbyStories() {
      if (!location?.zip) {
        setError('No zip code provided');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        // Fetch all stories from database
        const allStories = await fetchStories();

        // Exclude the story that was just submitted
        const otherStories = submittedStoryId
          ? allStories.filter(s => s.id !== submittedStoryId)
          : allStories;

        // Filter to stories within 50 miles
        const nearbyStories = await filterStoriesByDistance(
          otherStories,
          location.zip,
          radiusMiles
        );

        setStories(nearbyStories);
      } catch (err) {
        console.error('Error loading nearby stories:', err);
        setError('Unable to load nearby stories. Please try again later.');
      } finally {
        setLoading(false);
      }
    }

    loadNearbyStories();
  }, [location?.zip, submittedStoryId]);

  // Filter stories by search and policy area
  const filteredStories = useMemo(() => {
    return stories.filter(story => {
      const matchesSearch = searchQuery === '' ||
        story.headline?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        story.story?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        story.location?.city?.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesPolicy = selectedPolicyArea === 'all' ||
        story.policyArea === selectedPolicyArea;

      return matchesSearch && matchesPolicy;
    });
  }, [stories, searchQuery, selectedPolicyArea]);

  // Get unique policy areas from nearby stories
  const policyAreasInStories = useMemo(() => {
    const areas = new Set(stories.map(s => s.policyArea).filter(Boolean));
    return [...areas];
  }, [stories]);

  // Aggregate stats
  const stats = useMemo(() => {
    const verified = stories.filter(s => s.verificationStatus === 'verified').length;
    const criticalCount = stories.filter(s => s.severity === 'critical' || s.severity === 'high').length;
    const avgDistance = stories.length > 0
      ? (stories.reduce((sum, s) => sum + (s.distance || 0), 0) / stories.length).toFixed(1)
      : 0;

    return {
      total: stories.length,
      verified,
      critical: criticalCount,
      avgDistance
    };
  }, [stories]);

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'critical': return 'bg-red-100 text-red-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getVerificationBadge = (status, score) => {
    if (status === 'verified') {
      return {
        text: `${score}% verified`,
        color: 'bg-green-100 text-green-800 border-green-200'
      };
    }
    return {
      text: 'Pending',
      color: 'bg-yellow-100 text-yellow-800 border-yellow-200'
    };
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="glass-card p-8 rounded-2xl text-center">
          <div className="w-12 h-12 rounded-full border-4 border-blue-500 border-t-transparent animate-spin mx-auto mb-4"></div>
          <p className="text-lg font-semibold gradient-text">Finding stories near you...</p>
          <p className="text-sm text-gray-400 mt-2">
            Searching within {radiusMiles} miles of {location?.city || location?.zip}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="glass-card p-6 rounded-2xl">
        <div className="flex items-center justify-between mb-6">
          <div>
            <button
              onClick={onBack}
              className="flex items-center gap-2 text-gray-400 hover:text-white mb-3 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
              Back to Portal
            </button>
            <h2 className="text-2xl font-bold gradient-text">Stories Near You</h2>
            <p className="text-gray-400">
              Verified stories within {radiusMiles} miles of {location?.city}, {location?.state} {location?.zip}
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <div className="text-sm text-gray-400">Your Location</div>
              <div className="text-lg font-bold text-white flex items-center gap-2">
                <MapPin className="w-4 h-4 text-blue-400" />
                {location?.city}, {location?.state}
              </div>
            </div>
            <div className="live-indicator">
              <span>Live Data</span>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-4">
          <div className="bg-gray-800/50 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <Users className="w-5 h-5 text-blue-400" />
              <span className="text-sm font-medium text-gray-300">Total Stories</span>
            </div>
            <div className="text-2xl font-bold text-blue-400">{stats.total}</div>
            <div className="text-xs text-gray-500">within {radiusMiles} miles</div>
          </div>

          <div className="bg-gray-800/50 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <Check className="w-5 h-5 text-green-400" />
              <span className="text-sm font-medium text-gray-300">Verified</span>
            </div>
            <div className="text-2xl font-bold text-green-400">{stats.verified}</div>
            <div className="text-xs text-gray-500">
              {stats.total > 0 ? Math.round((stats.verified / stats.total) * 100) : 0}% rate
            </div>
          </div>

          <div className="bg-gray-800/50 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <AlertCircle className="w-5 h-5 text-red-400" />
              <span className="text-sm font-medium text-gray-300">High Impact</span>
            </div>
            <div className="text-2xl font-bold text-red-400">{stats.critical}</div>
            <div className="text-xs text-gray-500">critical stories</div>
          </div>

          <div className="bg-gray-800/50 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-5 h-5 text-purple-400" />
              <span className="text-sm font-medium text-gray-300">Avg Distance</span>
            </div>
            <div className="text-2xl font-bold text-purple-400">{stats.avgDistance} mi</div>
            <div className="text-xs text-gray-500">from your location</div>
          </div>
        </div>
      </div>

      {/* Search and filters */}
      <div className="glass-card p-4 rounded-xl">
        <div className="flex gap-4 items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 w-4 h-4" />
            <input
              type="text"
              placeholder="Search stories by location, keywords..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-2 w-full bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <select
            value={selectedPolicyArea}
            onChange={(e) => setSelectedPolicyArea(e.target.value)}
            className="px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Policy Areas</option>
            {policyAreasInStories.map(area => (
              <option key={area} value={area}>
                {area.charAt(0).toUpperCase() + area.slice(1)}
              </option>
            ))}
          </select>
          <button className="px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white hover:bg-gray-700 flex items-center gap-2">
            <Filter className="w-4 h-4" />
            Filters
          </button>
        </div>
      </div>

      {error && (
        <div className="glass-card p-4 rounded-xl border border-red-500/30 bg-red-500/10">
          <p className="text-red-400">{error}</p>
        </div>
      )}

      {/* Main content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Story feed */}
        <div className="lg:col-span-2 space-y-4">
          {filteredStories.length === 0 ? (
            <div className="glass-card p-8 rounded-xl text-center">
              <MapPin className="w-12 h-12 text-gray-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-300 mb-2">No Stories Found</h3>
              <p className="text-gray-500">
                {stories.length === 0
                  ? `No verified stories found within ${radiusMiles} miles of your location yet.`
                  : 'No stories match your current filters.'}
              </p>
              <p className="text-gray-500 mt-2">
                Be among the first to share what's happening in your community!
              </p>
            </div>
          ) : (
            filteredStories.map(story => {
              const verification = getVerificationBadge(story.verificationStatus, story.verificationScore);
              const PolicyIcon = policyIcons[story.policyArea] || Package;

              return (
                <div
                  key={story.id}
                  className="glass-card p-6 rounded-xl hover:border-blue-500/50 transition-all cursor-pointer"
                  onClick={() => setSelectedStory(story)}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3 flex-wrap">
                      <div className={`px-2 py-1 rounded-full text-xs font-medium ${getSeverityColor(story.severity)}`}>
                        {story.severity}
                      </div>
                      <span className={`px-2 py-1 rounded text-xs font-medium border ${verification.color}`}>
                        {verification.text}
                      </span>
                      <div className="flex items-center gap-1 text-xs text-gray-400">
                        <MapPin className="w-3 h-3" />
                        {story.location?.city}, {story.location?.state}
                        {story.distance !== undefined && (
                          <span className="ml-2 text-blue-400">
                            {story.distance.toFixed(1)} mi away
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <Clock className="w-3 h-3" />
                      {new Date(story.submittedAt).toLocaleDateString()}
                    </div>
                  </div>

                  <div className="flex items-start gap-3 mb-3">
                    <div
                      className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: `${policyColors[story.policyArea]}20` }}
                    >
                      <PolicyIcon
                        className="w-5 h-5"
                        style={{ color: policyColors[story.policyArea] }}
                      />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-white mb-1 line-clamp-2">
                        {story.headline}
                      </h3>
                      <span className="text-xs text-gray-400 capitalize">{story.policyArea}</span>
                    </div>
                  </div>

                  <p className="text-gray-400 mb-4 line-clamp-3">{story.story}</p>

                  <div className="grid grid-cols-3 gap-4 mb-4 text-sm">
                    <div className="text-center p-2 bg-gray-800/50 rounded-lg">
                      <div className="font-semibold text-white">
                        {story.impact?.affected_population?.toLocaleString() || '1'}
                      </div>
                      <div className="text-gray-500 text-xs">Affected</div>
                    </div>
                    <div className="text-center p-2 bg-gray-800/50 rounded-lg">
                      <div className="font-semibold text-blue-400">{story.verificationScore}%</div>
                      <div className="text-gray-500 text-xs">Confidence</div>
                    </div>
                    <div className="text-center p-2 bg-gray-800/50 rounded-lg">
                      <div className="font-semibold text-purple-400">
                        {story.distance?.toFixed(1) || '—'} mi
                      </div>
                      <div className="text-gray-500 text-xs">Distance</div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-gray-700">
                    <div className="flex items-center gap-2 text-sm text-gray-400">
                      <Eye className="w-4 h-4" />
                      <span>Click to view full story</span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Policy area breakdown */}
          <div className="glass-card rounded-xl overflow-hidden">
            <div className="p-4 border-b border-gray-700">
              <h3 className="font-semibold text-white">Policy Areas Nearby</h3>
            </div>
            <div className="p-4 space-y-3">
              {policyAreasInStories.length === 0 ? (
                <p className="text-gray-500 text-sm">No policy areas found</p>
              ) : (
                policyAreasInStories.map(area => {
                  const count = stories.filter(s => s.policyArea === area).length;
                  const IconComponent = policyIcons[area] || Package;
                  return (
                    <button
                      key={area}
                      onClick={() => setSelectedPolicyArea(selectedPolicyArea === area ? 'all' : area)}
                      className={`w-full flex items-center justify-between p-2 rounded-lg transition-colors ${
                        selectedPolicyArea === area
                          ? 'bg-blue-500/20 border border-blue-500/50'
                          : 'hover:bg-gray-800'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <IconComponent
                          className="w-5 h-5"
                          style={{ color: policyColors[area] }}
                        />
                        <span className="font-medium text-sm text-gray-300 capitalize">{area}</span>
                      </div>
                      <span className="text-sm text-gray-500">{count} stories</span>
                    </button>
                  );
                })
              )}
            </div>
          </div>

          {/* Community impact summary */}
          <div className="glass-card rounded-xl overflow-hidden">
            <div className="p-4 border-b border-gray-700">
              <h3 className="font-semibold text-white">Your Community</h3>
            </div>
            <div className="p-4 space-y-4">
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Stories in Area</span>
                <span className="font-semibold text-white">{stats.total}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Verified Rate</span>
                <span className="font-semibold text-green-400">
                  {stats.total > 0 ? Math.round((stats.verified / stats.total) * 100) : 0}%
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">High Impact Issues</span>
                <span className="font-semibold text-red-400">{stats.critical}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Coverage Radius</span>
                <span className="font-semibold text-blue-400">{radiusMiles} miles</span>
              </div>

              <div className="pt-4 border-t border-gray-700">
                <p className="text-xs text-gray-500 mb-3">
                  Your story has been added to this community's verified data.
                  Together, we're creating accountability.
                </p>
                <button
                  onClick={onBack}
                  className="w-full py-2 gradient-bg text-white rounded-lg text-sm font-medium hover:opacity-90 transition-opacity"
                >
                  Share Another Story
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Story detail modal */}
      {selectedStory && (
        <div
          className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50"
          onClick={() => setSelectedStory(null)}
        >
          <div
            className="glass-card p-6 rounded-2xl max-w-2xl w-full max-h-[80vh] overflow-y-auto"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className={`px-2 py-1 rounded-full text-xs font-medium ${getSeverityColor(selectedStory.severity)}`}>
                  {selectedStory.severity}
                </div>
                <span className={`px-2 py-1 rounded text-xs font-medium border ${getVerificationBadge(selectedStory.verificationStatus, selectedStory.verificationScore).color}`}>
                  {getVerificationBadge(selectedStory.verificationStatus, selectedStory.verificationScore).text}
                </span>
              </div>
              <button
                onClick={() => setSelectedStory(null)}
                className="text-gray-400 hover:text-white text-2xl"
              >
                &times;
              </button>
            </div>

            <h2 className="text-xl font-bold text-white mb-2">{selectedStory.headline}</h2>

            <div className="flex items-center gap-4 text-sm text-gray-400 mb-4">
              <div className="flex items-center gap-1">
                <MapPin className="w-4 h-4" />
                {selectedStory.location?.city}, {selectedStory.location?.state}
              </div>
              {selectedStory.distance !== undefined && (
                <span className="text-blue-400">{selectedStory.distance.toFixed(1)} miles away</span>
              )}
              <div className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                {new Date(selectedStory.submittedAt).toLocaleDateString()}
              </div>
            </div>

            <p className="text-gray-300 mb-6 whitespace-pre-wrap">{selectedStory.story}</p>

            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-gray-800/50 p-4 rounded-lg">
                <div className="text-sm text-gray-400 mb-1">Policy Area</div>
                <div className="font-semibold text-white capitalize">{selectedStory.policyArea}</div>
              </div>
              <div className="bg-gray-800/50 p-4 rounded-lg">
                <div className="text-sm text-gray-400 mb-1">Verification Score</div>
                <div className="font-semibold text-green-400">{selectedStory.verificationScore}%</div>
              </div>
            </div>

            <button
              onClick={() => setSelectedStory(null)}
              className="w-full py-3 bg-gray-800 text-white rounded-lg font-medium hover:bg-gray-700 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default NearbyStories;
