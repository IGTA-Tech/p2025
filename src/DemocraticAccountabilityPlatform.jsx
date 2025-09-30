import React, { useState, useEffect, useMemo } from 'react';
import { 
  Users, Shield, Brain, MapPin, TrendingUp, AlertCircle, Eye, Target, 
  Clock, Database, Zap, Search, Filter, Bell, DollarSign, BarChart3, 
  FileText, Camera, Lock, Check, X, Star, Globe, MessageSquare,
  Play, Pause, Settings, Download, Share2, Mail, Phone, Calendar,
  Layers, Activity, Wifi, ChevronRight, ChevronDown, ExternalLink,
  Award, Briefcase, Building, Flag, Heart, Home, Scale, Gavel
} from 'lucide-react';

// Comprehensive data models for the platform
const policyAreas = [
  { id: 'education', name: 'Education', icon: Award, color: '#059669', stories: 847, verified: 731, impact: 'critical' },
  { id: 'healthcare', name: 'Healthcare', icon: Heart, color: '#dc2626', stories: 623, verified: 487, impact: 'high' },
  { id: 'employment', name: 'Employment', icon: Briefcase, color: '#2563eb', stories: 1203, verified: 967, impact: 'critical' },
  { id: 'housing', name: 'Housing', icon: Home, color: '#7c3aed', stories: 456, verified: 312, impact: 'medium' },
  { id: 'environment', name: 'Environment', icon: Globe, color: '#16a34a', stories: 789, verified: 634, impact: 'high' },
  { id: 'immigration', name: 'Immigration', icon: Flag, color: '#ea580c', stories: 1456, verified: 1127, impact: 'critical' },
  { id: 'infrastructure', name: 'Infrastructure', icon: Building, color: '#0891b2', stories: 234, verified: 187, impact: 'low' },
  { id: 'justice', name: 'Justice', icon: Scale, color: '#be185d', stories: 345, verified: 278, impact: 'medium' }
];

const citizenStories = [
  {
    id: 'CS-2025-001847',
    submittedAt: '2025-01-28T14:32:00Z',
    location: { zip: '48197', city: 'Ypsilanti', state: 'MI', county: 'Washtenaw', district: 'MI-06' },
    policyArea: 'education',
    severity: 'high',
    verificationStatus: 'verified',
    verificationScore: 94,
    headline: 'Class sizes increased from 22 to 31 students after federal funding cuts',
    story: `My daughter's 3rd grade class at Carpenter Elementary went from 22 kids in December to 31 kids last week. The principal told us they had to combine classes because federal Title I funding was cut by $1.2M district-wide. My daughter's teacher is overwhelmed and kids aren't getting the attention they need. Her reading scores dropped from grade level to below grade level in just one month.`,
    evidence: ['school_letter.pdf', 'class_roster.jpg', 'reading_assessment.pdf'],
    demographics: { age: 34, income: '45-60k', education: 'some_college', party: 'independent' },
    impact: {
      economic: -1200000,
      affected_population: 2847,
      timeframe: '30_days',
      correlation_confidence: 0.94
    },
    aiAnalysis: {
      messageResonance: 87,
      demographicAppeal: ['suburban_parents', 'working_class', 'independents'],
      recommendedTalkingPoints: ['classroom_overcrowding', 'reading_achievement_gap', 'federal_education_cuts'],
      competitiveVulnerability: 'high'
    }
  },
  {
    id: 'CS-2025-002134',
    submittedAt: '2025-01-29T09:15:00Z',
    location: { zip: '75801', city: 'Huntsville', state: 'TX', county: 'Walker', district: 'TX-08' },
    policyArea: 'healthcare',
    severity: 'critical',
    verificationStatus: 'verified',
    verificationScore: 91,
    headline: 'Local clinic closed after federal rural health funding eliminated',
    story: `The Huntsville Rural Health Clinic closed permanently on January 15th after 23 years serving our community. They said federal rural health grants were eliminated and they couldn't afford to stay open. Now the nearest doctor is 45 minutes away in Conroe. My diabetic grandmother missed her last two appointments because we can't make that drive regularly. Three other elderly neighbors in our building are in the same situation.`,
    evidence: ['clinic_closure_notice.pdf', 'medical_records.pdf', 'appointment_cancellation.jpg'],
    demographics: { age: 28, income: '30-45k', education: 'high_school', party: 'democrat' },
    impact: {
      economic: -2400000,
      affected_population: 15600,
      timeframe: '15_days',
      correlation_confidence: 0.91
    },
    aiAnalysis: {
      messageResonance: 92,
      demographicAppeal: ['rural_voters', 'seniors', 'healthcare_advocates'],
      recommendedTalkingPoints: ['rural_healthcare_access', 'senior_care', 'federal_funding_cuts'],
      competitiveVulnerability: 'critical'
    }
  },
  {
    id: 'CS-2025-002456',
    submittedAt: '2025-01-30T16:22:00Z',
    location: { zip: '22031', city: 'Fairfax', state: 'VA', county: 'Fairfax', district: 'VA-11' },
    policyArea: 'employment',
    severity: 'high',
    verificationStatus: 'pending',
    verificationScore: 87,
    headline: 'Federal contracting company laid off 340 employees citing Schedule F uncertainties',
    story: `I've worked as a federal contractor for 12 years at DynCorp supporting the Department of Education. Last Friday, they laid off 340 of us citing "uncertainty around Schedule F reclassifications and federal workforce reductions." My mortgage payment is $3,400/month and I have two kids in college. We had stable contracts through 2027 but now everything is uncertain. Six families on my street are in the same situation - all federal contractors getting laid off because companies are scared of the new policies.`,
    evidence: ['layoff_notice.pdf', 'contract_documents.pdf', 'mortgage_statement.pdf'],
    demographics: { age: 44, income: '80-100k', education: 'bachelors', party: 'independent' },
    impact: {
      economic: -34000000,
      affected_population: 340,
      timeframe: '7_days',
      correlation_confidence: 0.87
    },
    aiAnalysis: {
      messageResonance: 89,
      demographicAppeal: ['federal_contractors', 'suburban_professionals', 'independents'],
      recommendedTalkingPoints: ['federal_workforce_stability', 'contractor_uncertainty', 'schedule_f_impacts'],
      competitiveVulnerability: 'high'
    }
  }
];

const clientAccounts = [
  {
    id: 'democratic-campaign-committee',
    name: 'Democratic Congressional Campaign Committee',
    type: 'campaign_committee',
    tier: 'enterprise',
    monthlyRevenue: 150000,
    storiesAccessed: 2847,
    creativeRequests: 23,
    activeAlerts: 47,
    lastLogin: '2025-01-30T18:45:00Z'
  },
  {
    id: 'center-american-progress',
    name: 'Center for American Progress',
    type: 'think_tank',
    tier: 'premium',
    monthlyRevenue: 75000,
    storiesAccessed: 1456,
    creativeRequests: 12,
    activeAlerts: 28,
    lastLogin: '2025-01-30T17:20:00Z'
  },
  {
    id: 'priorities-usa',
    name: 'Priorities USA Action',
    type: 'super_pac',
    tier: 'enterprise',
    monthlyRevenue: 200000,
    storiesAccessed: 3421,
    creativeRequests: 34,
    activeAlerts: 62,
    lastLogin: '2025-01-30T19:10:00Z'
  }
];

const creativeTemplates = [
  {
    id: 'education-overcrowding',
    title: 'Classroom Overcrowding Crisis',
    type: 'video_script',
    stories: 847,
    effectiveness: 87,
    demographic: 'suburban_parents',
    script: `[SCENE: Crowded classroom with 31 desks crammed together]
VOICEOVER: "Last month, Sarah's daughter had 22 classmates. Today, she has 31."
[CLOSE-UP: Teacher looking overwhelmed]
VOICEOVER: "When federal education funding was cut, class sizes exploded overnight."
[GRAPHIC: Reading scores dropping from grade level to below]
VOICEOVER: "Our children's futures shouldn't be political casualties."
[CALL TO ACTION: Contact your representative]`,
    targetAudience: 'Parents in suburban districts with federal education funding cuts',
    estimatedCost: '$45,000 - $65,000 for professional production',
    projectedReach: '2.3M suburban parents',
    messageResonance: 87
  },
  {
    id: 'rural-healthcare-access',
    title: 'Rural Healthcare Desert',
    type: 'digital_ad_series',
    stories: 456,
    effectiveness: 92,
    demographic: 'rural_voters',
    concept: `Series of 15-second social media ads featuring real rural residents discussing clinic closures and driving long distances for basic healthcare. Each ad ends with "Rural communities deserve healthcare access" and directs to action page.`,
    targetAudience: 'Rural voters in districts with clinic closures',
    estimatedCost: '$25,000 - $35,000 for creative production + placement',
    projectedReach: '890K rural voters',
    messageResonance: 92
  },
  {
    id: 'federal-contractor-uncertainty',
    title: 'Schedule F Economic Impact',
    type: 'tv_commercial',
    stories: 340,
    effectiveness: 89,
    demographic: 'federal_contractors',
    script: `[SCENE: Suburban neighborhood, moving trucks]
VOICEOVER: "In Northern Virginia, federal contractors are losing their jobs."
[TESTIMONIAL: Real contractor discussing layoffs]
"We had stable contracts through 2027. Now families are leaving."
[ECONOMIC DATA: $34M in local economic impact]
VOICEOVER: "When federal workers lose jobs, entire communities suffer."
[CALL TO ACTION: Stability for federal workforce]`,
    targetAudience: 'Federal employees and contractors in DC Metro area',
    estimatedCost: '$85,000 - $120,000 for full production and initial buy',
    projectedReach: '1.7M federal workforce and families',
    messageResonance: 89
  }
];

const DemocraticAccountabilityPlatform = () => {
  const [activeView, setActiveView] = useState('dashboard');
  const [selectedStory, setSelectedStory] = useState(null);
  const [selectedPolicyArea, setSelectedPolicyArea] = useState('all');
  const [clientTier, setClientTier] = useState('enterprise');
  const [realTimeEnabled, setRealTimeEnabled] = useState(true);
  const [notifications, setNotifications] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Real-time metrics simulation
  const [liveMetrics, setLiveMetrics] = useState({
    totalStories: 5847,
    verifiedStories: 4562,
    activeClients: 47,
    monthlyRevenue: 2340000,
    storiesThisHour: 23,
    lastUpdate: new Date()
  });

  useEffect(() => {
    if (realTimeEnabled) {
      const interval = setInterval(() => {
        setLiveMetrics(prev => ({
          ...prev,
          totalStories: prev.totalStories + Math.floor(Math.random() * 5),
          verifiedStories: prev.verifiedStories + Math.floor(Math.random() * 3),
          storiesThisHour: Math.floor(Math.random() * 8) + 15,
          lastUpdate: new Date()
        }));

        // Simulate new notifications
        if (Math.random() > 0.7) {
          const newNotification = {
            id: Date.now(),
            type: 'high_impact_story',
            title: 'High-Impact Story Verified',
            message: 'New healthcare access story from swing district TX-07 verified',
            timestamp: new Date(),
            severity: 'high'
          };
          setNotifications(prev => [newNotification, ...prev.slice(0, 9)]);
        }
      }, 8000);
      return () => clearInterval(interval);
    }
  }, [realTimeEnabled]);

  const filteredStories = useMemo(() => {
    return citizenStories.filter(story => {
      const matchesPolicy = selectedPolicyArea === 'all' || story.policyArea === selectedPolicyArea;
      const matchesSearch = searchQuery === '' || 
        story.headline.toLowerCase().includes(searchQuery.toLowerCase()) ||
        story.story.toLowerCase().includes(searchQuery.toLowerCase()) ||
        story.location.city.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesPolicy && matchesSearch;
    });
  }, [selectedPolicyArea, searchQuery]);

  const getVerificationBadge = (status, score) => {
    if (status === 'verified' && score >= 90) return { color: 'bg-green-100 text-green-800 border-green-300', text: 'Verified High' };
    if (status === 'verified' && score >= 80) return { color: 'bg-green-100 text-green-800 border-green-300', text: 'Verified' };
    if (status === 'pending') return { color: 'bg-yellow-100 text-yellow-800 border-yellow-300', text: 'Pending' };
    return { color: 'bg-gray-100 text-gray-800 border-gray-300', text: 'Unverified' };
  };

  const getSeverityColor = (severity) => {
    switch(severity) {
      case 'critical': return 'text-red-600 bg-red-50';
      case 'high': return 'text-orange-600 bg-orange-50';
      case 'medium': return 'text-yellow-600 bg-yellow-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const renderCitizenPortal = () => (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-lg shadow-lg border p-8 mb-8">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="bg-blue-100 rounded-full p-4">
              <Users className="w-12 h-12 text-blue-600" />
            </div>
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-3">Your Voice. Your Story. Your Impact.</h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Share how federal policies are affecting your life, family, and community. Your story helps hold our government accountable to real people.
          </p>
        </div>

        <div className="grid grid-cols-3 gap-6 mb-8">
          <div className="text-center">
            <div className="bg-green-50 rounded-lg p-4 mb-3">
              <Shield className="w-8 h-8 text-green-600 mx-auto" />
            </div>
            <h3 className="font-semibold text-gray-900">Privacy Protected</h3>
            <p className="text-sm text-gray-600">Your identity is encrypted and protected. Share anonymously or with attribution - your choice.</p>
          </div>
          <div className="text-center">
            <div className="bg-blue-50 rounded-lg p-4 mb-3">
              <Brain className="w-8 h-8 text-blue-600 mx-auto" />
            </div>
            <h3 className="font-semibold text-gray-900">AI Verification</h3>
            <p className="text-sm text-gray-600">Our AI cross-references your story with government data to verify authenticity and impact.</p>
          </div>
          <div className="text-center">
            <div className="bg-purple-50 rounded-lg p-4 mb-3">
              <Target className="w-8 h-8 text-purple-600 mx-auto" />
            </div>
            <h3 className="font-semibold text-gray-900">Political Impact</h3>
            <p className="text-sm text-gray-600">Your verified story becomes data that influences political strategies and holds leaders accountable.</p>
          </div>
        </div>

        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Your Location</label>
              <input type="text" placeholder="ZIP Code" className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Policy Area Most Affected</label>
              <select className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
                <option>Select area...</option>
                {policyAreas.map(area => (
                  <option key={area.id} value={area.id}>{area.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Your Story</label>
            <textarea 
              rows={6} 
              placeholder="Tell us how federal policy changes have affected you, your family, or your community. Be specific about what changed, when it happened, and how it impacts your daily life."
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Supporting Evidence (Optional)</label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
              <Camera className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 mb-2">Upload photos, documents, or other evidence</p>
              <p className="text-sm text-gray-500">Photos, PDFs, screenshots accepted. Max 10MB per file.</p>
              <button className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                Choose Files
              </button>
            </div>
          </div>

          <div className="border-t pt-6">
            <div className="flex items-start gap-3">
              <input type="checkbox" className="mt-1 w-4 h-4 text-blue-600" />
              <div className="text-sm text-gray-600">
                <p>I consent to my story being used for political analysis and advocacy. My personal information will be protected and I can request removal at any time.</p>
              </div>
            </div>
          </div>

          <button className="w-full py-4 bg-blue-600 text-white rounded-lg font-semibold text-lg hover:bg-blue-700 transition-colors">
            Submit Your Story
          </button>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-lg p-4 shadow border">
          <div className="text-2xl font-bold text-blue-600">{liveMetrics.totalStories.toLocaleString()}</div>
          <div className="text-sm text-gray-600">Stories Submitted</div>
        </div>
        <div className="bg-white rounded-lg p-4 shadow border">
          <div className="text-2xl font-bold text-green-600">{liveMetrics.verifiedStories.toLocaleString()}</div>
          <div className="text-sm text-gray-600">Stories Verified</div>
        </div>
        <div className="bg-white rounded-lg p-4 shadow border">
          <div className="text-2xl font-bold text-purple-600">{liveMetrics.storiesThisHour}</div>
          <div className="text-sm text-gray-600">Stories This Hour</div>
        </div>
        <div className="bg-white rounded-lg p-4 shadow border">
          <div className="text-2xl font-bold text-orange-600">94.7%</div>
          <div className="text-sm text-gray-600">Verification Rate</div>
        </div>
      </div>
    </div>
  );

  const renderClientDashboard = () => (
    <div className="space-y-6">
      {/* Header with real-time metrics */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Intelligence Command Center</h2>
            <p className="text-gray-600">Real-time political intelligence and creative services platform</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <div className="text-sm text-gray-500">Monthly Revenue</div>
              <div className="text-2xl font-bold text-green-600">${(liveMetrics.monthlyRevenue / 1000000).toFixed(1)}M</div>
            </div>
            <div className="flex items-center gap-2 bg-green-100 px-3 py-2 rounded-lg">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-sm font-medium text-green-800">Live Intelligence</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-5 gap-4">
          <div className="bg-blue-50 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Users className="w-5 h-5 text-blue-600" />
              <span className="text-sm font-medium text-gray-700">Active Stories</span>
            </div>
            <div className="text-2xl font-bold text-blue-600">{liveMetrics.totalStories.toLocaleString()}</div>
            <div className="text-xs text-blue-600">+{liveMetrics.storiesThisHour} this hour</div>
          </div>
          
          <div className="bg-green-50 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Check className="w-5 h-5 text-green-600" />
              <span className="text-sm font-medium text-gray-700">Verified</span>
            </div>
            <div className="text-2xl font-bold text-green-600">{liveMetrics.verifiedStories.toLocaleString()}</div>
            <div className="text-xs text-green-600">94.7% rate</div>
          </div>

          <div className="bg-purple-50 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Briefcase className="w-5 h-5 text-purple-600" />
              <span className="text-sm font-medium text-gray-700">Active Clients</span>
            </div>
            <div className="text-2xl font-bold text-purple-600">{liveMetrics.activeClients}</div>
            <div className="text-xs text-purple-600">Enterprise tier</div>
          </div>

          <div className="bg-orange-50 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Brain className="w-5 h-5 text-orange-600" />
              <span className="text-sm font-medium text-gray-700">Creative Requests</span>
            </div>
            <div className="text-2xl font-bold text-orange-600">156</div>
            <div className="text-xs text-orange-600">This week</div>
          </div>

          <div className="bg-red-50 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <AlertCircle className="w-5 h-5 text-red-600" />
              <span className="text-sm font-medium text-gray-700">High Impact</span>
            </div>
            <div className="text-2xl font-bold text-red-600">23</div>
            <div className="text-xs text-red-600">Critical stories</div>
          </div>
        </div>
      </div>

      {/* Search and filters */}
      <div className="bg-white rounded-lg shadow-sm border p-4">
        <div className="flex gap-4 items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search stories by location, policy area, keywords..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <select
            value={selectedPolicyArea}
            onChange={(e) => setSelectedPolicyArea(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Policy Areas</option>
            {policyAreas.map(area => (
              <option key={area.id} value={area.id}>{area.name}</option>
            ))}
          </select>
          <button className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center gap-2">
            <Filter className="w-4 h-4" />
            Advanced Filters
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main story feed */}
        <div className="lg:col-span-2 space-y-4">
          {filteredStories.map(story => {
            const verification = getVerificationBadge(story.verificationStatus, story.verificationScore);
            return (
              <div 
                key={story.id} 
                className="bg-white rounded-lg shadow-sm border p-6 hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => setSelectedStory(story)}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-start gap-3">
                    <div className={`px-2 py-1 rounded-full text-xs font-medium ${getSeverityColor(story.severity)}`}>
                      {story.severity}
                    </div>
                    <span className={`px-2 py-1 rounded text-xs font-medium border ${verification.color}`}>
                      {verification.text}
                    </span>
                    <div className="flex items-center gap-1 text-xs text-gray-500">
                      <MapPin className="w-3 h-3" />
                      {story.location.city}, {story.location.state} • {story.location.district}
                    </div>
                  </div>
                  <div className="text-xs text-gray-500">
                    {new Date(story.submittedAt).toLocaleDateString()}
                  </div>
                </div>

                <h3 className="text-lg font-semibold text-gray-900 mb-3">{story.headline}</h3>
                <p className="text-gray-600 mb-4 line-clamp-3">{story.story}</p>

                <div className="grid grid-cols-4 gap-4 mb-4 text-sm">
                  <div className="text-center p-2 bg-gray-50 rounded">
                    <div className="font-semibold text-gray-900">{story.impact.affected_population.toLocaleString()}</div>
                    <div className="text-gray-500">Affected</div>
                  </div>
                  <div className="text-center p-2 bg-gray-50 rounded">
                    <div className="font-semibold text-red-600">${Math.abs(story.impact.economic / 1000000).toFixed(1)}M</div>
                    <div className="text-gray-500">Economic Impact</div>
                  </div>
                  <div className="text-center p-2 bg-gray-50 rounded">
                    <div className="font-semibold text-blue-600">{story.verificationScore}%</div>
                    <div className="text-gray-500">Confidence</div>
                  </div>
                  <div className="text-center p-2 bg-gray-50 rounded">
                    <div className="font-semibold text-purple-600">{story.aiAnalysis.messageResonance}%</div>
                    <div className="text-gray-500">Resonance</div>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Eye className="w-4 h-4" />
                    AI Analysis: {story.aiAnalysis.competitiveVulnerability} vulnerability
                  </div>
                  <div className="flex gap-2">
                    <button className="px-3 py-1 bg-blue-100 text-blue-800 rounded text-sm font-medium hover:bg-blue-200">
                      Generate Creative
                    </button>
                    <button className="px-3 py-1 bg-green-100 text-green-800 rounded text-sm font-medium hover:bg-green-200">
                      Request Research
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Policy area breakdown */}
          <div className="bg-white rounded-lg shadow-sm border">
            <div className="p-4 border-b">
              <h3 className="font-semibold text-gray-900">Policy Area Intelligence</h3>
            </div>
            <div className="p-4 space-y-3">
              {policyAreas.map(area => {
                const IconComponent = area.icon;
                return (
                  <div key={area.id} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <IconComponent className="w-5 h-5" style={{color: area.color}} />
                      <div>
                        <div className="font-medium text-sm">{area.name}</div>
                        <div className="text-xs text-gray-500">{area.verified} verified stories</div>
                      </div>
                    </div>
                    <div className={`px-2 py-1 rounded text-xs font-medium ${
                      area.impact === 'critical' ? 'bg-red-100 text-red-800' :
                      area.impact === 'high' ? 'bg-orange-100 text-orange-800' :
                      area.impact === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {area.impact}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Live notifications */}
          <div className="bg-white rounded-lg shadow-sm border">
            <div className="p-4 border-b flex items-center gap-2">
              <Bell className="w-4 h-4 text-gray-600" />
              <h3 className="font-semibold text-gray-900">Live Intelligence Alerts</h3>
            </div>
            <div className="p-4 space-y-3 max-h-96 overflow-y-auto">
              {notifications.map(notif => (
                <div key={notif.id} className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg">
                  <div className={`w-2 h-2 rounded-full mt-2 ${
                    notif.severity === 'high' ? 'bg-red-500' :
                    notif.severity === 'medium' ? 'bg-yellow-500' : 'bg-blue-500'
                  }`}></div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm text-gray-900">{notif.title}</div>
                    <div className="text-sm text-gray-600">{notif.message}</div>
                    <div className="text-xs text-gray-500 mt-1">
                      {Math.floor((Date.now() - notif.timestamp.getTime()) / 60000)}m ago
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Client performance */}
          <div className="bg-white rounded-lg shadow-sm border">
            <div className="p-4 border-b">
              <h3 className="font-semibold text-gray-900">Your Account Performance</h3>
            </div>
            <div className="p-4 space-y-4">
              <div className="flex justify-between text-sm">
                <span>Stories Accessed</span>
                <span className="font-semibold">2,847</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Creative Requests</span>
                <span className="font-semibold">23 active</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Account Tier</span>
                <span className="font-semibold text-blue-600">Enterprise</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Monthly Spend</span>
                <span className="font-semibold text-green-600">$150,000</span>
              </div>
              <button className="w-full py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700">
                Upgrade Account
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderCreativeServices = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">AI-Powered Creative Intelligence</h2>
            <p className="text-gray-600">Transform verified citizen stories into winning political communications</p>
          </div>
          <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2">
            <Brain className="w-4 h-4" />
            New Creative Request
          </button>
        </div>

        <div className="grid grid-cols-3 gap-6 mb-8">
          <div className="text-center p-6 bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg">
            <div className="bg-blue-100 rounded-full p-3 w-16 h-16 mx-auto mb-4">
              <Brain className="w-10 h-10 text-blue-600" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">AI Story Analysis</h3>
            <p className="text-sm text-gray-600">Advanced AI identifies the most compelling elements of citizen stories for maximum political impact</p>
          </div>
          <div className="text-center p-6 bg-gradient-to-br from-green-50 to-blue-50 rounded-lg">
            <div className="bg-green-100 rounded-full p-3 w-16 h-16 mx-auto mb-4">
              <Target className="w-10 h-10 text-green-600" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">Demographic Targeting</h3>
            <p className="text-sm text-gray-600">Precision targeting based on story demographics and verified local impact data</p>
          </div>
          <div className="text-center p-6 bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg">
            <div className="bg-purple-100 rounded-full p-3 w-16 h-16 mx-auto mb-4">
              <Award className="w-10 h-10 text-purple-600" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">Professional Production</h3>
            <p className="text-sm text-gray-600">Full-service creative production from concept to camera-ready materials</p>
          </div>
        </div>
      </div>

      {/* Creative templates showcase */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {creativeTemplates.map(template => (
          <div key={template.id} className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="font-semibold text-lg text-gray-900">{template.title}</h3>
                <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                  <span className="flex items-center gap-1">
                    <Users className="w-4 h-4" />
                    {template.stories} stories
                  </span>
                  <span className="flex items-center gap-1">
                    <TrendingUp className="w-4 h-4" />
                    {template.effectiveness}% effective
                  </span>
                </div>
              </div>
              <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                template.type === 'video_script' ? 'bg-red-100 text-red-800' :
                template.type === 'digital_ad_series' ? 'bg-blue-100 text-blue-800' :
                'bg-purple-100 text-purple-800'
              }`}>
                {template.type.replace('_', ' ')}
              </div>
            </div>

            {template.script && (
              <div className="mb-4 p-4 bg-gray-50 rounded-lg">
                <div className="font-medium text-sm text-gray-900 mb-2">Video Script Preview:</div>
                <div className="text-sm text-gray-700 whitespace-pre-line font-mono">
                  {template.script.substring(0, 300)}...
                </div>
              </div>
            )}

            {template.concept && (
              <div className="mb-4 p-4 bg-gray-50 rounded-lg">
                <div className="font-medium text-sm text-gray-900 mb-2">Creative Concept:</div>
                <div className="text-sm text-gray-700">{template.concept}</div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
              <div>
                <div className="font-medium text-gray-900">Target Audience</div>
                <div className="text-gray-600">{template.targetAudience}</div>
              </div>
              <div>
                <div className="font-medium text-gray-900">Projected Reach</div>
                <div className="text-blue-600 font-medium">{template.projectedReach}</div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t">
              <div className="text-sm">
                <div className="font-medium text-gray-900">Production Cost</div>
                <div className="text-green-600 font-medium">{template.estimatedCost}</div>
              </div>
              <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium">
                Request Production
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Custom creative request form */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h3 className="font-semibold text-lg text-gray-900 mb-4">Custom Creative Request</h3>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Creative Type</label>
              <select className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500">
                <option>TV Commercial (30s)</option>
                <option>Digital Ad Series</option>
                <option>Social Media Campaign</option>
                <option>Radio Spots</option>
                <option>Print Advertisement</option>
                <option>Direct Mail Piece</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Target Demographic</label>
              <select className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500">
                <option>Suburban Parents</option>
                <option>Rural Voters</option>
                <option>Federal Contractors</option>
                <option>Healthcare Workers</option>
                <option>Senior Citizens</option>
                <option>Young Professionals</option>
              </select>
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Selected Stories (Choose from your verified stories)</label>
            <div className="border rounded-md p-3 max-h-32 overflow-y-auto bg-gray-50">
              {filteredStories.slice(0, 5).map(story => (
                <div key={story.id} className="flex items-center gap-2 mb-2">
                  <input type="checkbox" className="w-4 h-4 text-blue-600" />
                  <span className="text-sm text-gray-700">{story.headline}</span>
                </div>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Special Instructions</label>
            <textarea 
              rows={4} 
              placeholder="Additional requirements, tone preferences, specific messages to emphasize..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex items-center justify-between pt-4">
            <div className="text-sm text-gray-600">
              Estimated timeline: 5-7 business days • Cost: $25,000 - $85,000
            </div>
            <button className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium">
              Submit Creative Request
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  const renderBusinessIntelligence = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Business Intelligence Dashboard</h2>
        
        {/* Revenue metrics */}
        <div className="grid grid-cols-4 gap-6 mb-8">
          <div className="bg-green-50 rounded-lg p-6">
            <div className="flex items-center gap-2 mb-3">
              <DollarSign className="w-6 h-6 text-green-600" />
              <h3 className="font-semibold text-gray-900">Monthly Revenue</h3>
            </div>
            <div className="text-3xl font-bold text-green-600 mb-1">${(liveMetrics.monthlyRevenue / 1000000).toFixed(1)}M</div>
            <div className="text-sm text-green-600">+23% vs last month</div>
          </div>
          
          <div className="bg-blue-50 rounded-lg p-6">
            <div className="flex items-center gap-2 mb-3">
              <Users className="w-6 h-6 text-blue-600" />
              <h3 className="font-semibold text-gray-900">Active Clients</h3>
            </div>
            <div className="text-3xl font-bold text-blue-600 mb-1">{liveMetrics.activeClients}</div>
            <div className="text-sm text-blue-600">8 new this month</div>
          </div>

          <div className="bg-purple-50 rounded-lg p-6">
            <div className="flex items-center gap-2 mb-3">
              <Brain className="w-6 h-6 text-purple-600" />
              <h3 className="font-semibold text-gray-900">Creative Requests</h3>
            </div>
            <div className="text-3xl font-bold text-purple-600 mb-1">156</div>
            <div className="text-sm text-purple-600">$1.2M pipeline</div>
          </div>

          <div className="bg-orange-50 rounded-lg p-6">
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp className="w-6 h-6 text-orange-600" />
              <h3 className="font-semibold text-gray-900">Story Verification</h3>
            </div>
            <div className="text-3xl font-bold text-orange-600 mb-1">94.7%</div>
            <div className="text-sm text-orange-600">Industry leading</div>
          </div>
        </div>

        {/* Client breakdown */}
        <div className="grid grid-cols-2 gap-6">
          <div>
            <h3 className="font-semibold text-gray-900 mb-4">Top Clients by Revenue</h3>
            <div className="space-y-4">
              {clientAccounts.map(client => (
                <div key={client.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <div className="font-medium text-gray-900">{client.name}</div>
                    <div className="text-sm text-gray-600 capitalize">{client.type.replace('_', ' ')} • {client.tier}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold text-green-600">${(client.monthlyRevenue / 1000).toFixed(0)}K/mo</div>
                    <div className="text-xs text-gray-500">{client.storiesAccessed} stories accessed</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h3 className="font-semibold text-gray-900 mb-4">Revenue by Service Type</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <Database className="w-5 h-5 text-blue-600" />
                  <div>
                    <div className="font-medium text-gray-900">Intelligence Subscriptions</div>
                    <div className="text-sm text-gray-600">Base platform access</div>
                  </div>
                </div>
                <div className="text-lg font-bold text-blue-600">$1.4M</div>
              </div>
              
              <div className="flex items-center justify-between p-4 bg-purple-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <Brain className="w-5 h-5 text-purple-600" />
                  <div>
                    <div className="font-medium text-gray-900">Creative Services</div>
                    <div className="text-sm text-gray-600">Custom ad production</div>
                  </div>
                </div>
                <div className="text-lg font-bold text-purple-600">$680K</div>
              </div>

              <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <FileText className="w-5 h-5 text-green-600" />
                  <div>
                    <div className="font-medium text-gray-900">Custom Research</div>
                    <div className="text-sm text-gray-600">Bespoke analysis</div>
                  </div>
                </div>
                <div className="text-lg font-bold text-green-600">$260K</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-8">
              <div className="flex items-center gap-3">
                <div className="bg-blue-600 rounded-lg p-2">
                  <Activity className="w-6 h-6 text-white" />
                </div>
                <div>
                  <div className="font-bold text-gray-900">Democratic Accountability Platform</div>
                  <div className="text-xs text-gray-500">Real-time Political Intelligence</div>
                </div>
              </div>
              
              <div className="flex gap-1">
                <button
                  onClick={() => setActiveView('citizen')}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${'${'}
                    activeView === 'citizen' ? 'bg-blue-100 text-blue-800' : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Citizen Portal
                </button>
                <button
                  onClick={() => setActiveView('dashboard')}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${'${'}
                    activeView === 'dashboard' ? 'bg-blue-100 text-blue-800' : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Intelligence Dashboard
                </button>
                <button
                  onClick={() => setActiveView('creative')}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${'${'}
                    activeView === 'creative' ? 'bg-blue-100 text-blue-800' : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Creative Services
                </button>
                <button
                  onClick={() => setActiveView('business')}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${'${'}
                    activeView === 'business' ? 'bg-blue-100 text-blue-800' : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Business Intelligence
                </button>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-sm text-gray-600">Live: {liveMetrics.storiesThisHour}/hr</span>
              </div>
              <button
                onClick={() => setRealTimeEnabled(!realTimeEnabled)}
                className={`p-2 rounded-md ${'${'}realTimeEnabled ? 'text-green-600' : 'text-gray-400'}`}
              >
                {realTimeEnabled ? <Wifi className="w-5 h-5" /> : <X className="w-5 h-5" />}
              </button>
              <div className="relative">
                <Bell className="w-5 h-5 text-gray-600" />
                {notifications.length > 0 && (
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full text-xs"></div>
                )}
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Main content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeView === 'citizen' && renderCitizenPortal()}
        {activeView === 'dashboard' && renderClientDashboard()}
        {activeView === 'creative' && renderCreativeServices()}
        {activeView === 'business' && renderBusinessIntelligence()}
      </main>

      {/* Story detail modal */}
      {selectedStory && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">Story Details</h2>
              <button 
                onClick={() => setSelectedStory(null)}
                className="p-2 hover:bg-gray-100 rounded-md"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <div className="text-sm font-medium text-gray-500 mb-1">Story ID</div>
                  <div className="font-mono text-sm">{selectedStory.id}</div>
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-500 mb-1">Verification Score</div>
                  <div className="font-semibold text-green-600">{selectedStory.verificationScore}%</div>
                </div>
              </div>

              <div>
                <div className="text-sm font-medium text-gray-500 mb-2">Full Story</div>
                <div className="p-4 bg-gray-50 rounded-lg text-gray-800">
                  {selectedStory.story}
                </div>
              </div>

              <div>
                <div className="text-sm font-medium text-gray-500 mb-2">AI Analysis & Recommendations</div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <div className="font-medium text-blue-900 mb-2">Message Resonance</div>
                    <div className="text-2xl font-bold text-blue-600">{selectedStory.aiAnalysis.messageResonance}%</div>
                  </div>
                  <div className="p-4 bg-purple-50 rounded-lg">
                    <div className="font-medium text-purple-900 mb-2">Competitive Vulnerability</div>
                    <div className="text-lg font-semibold text-purple-600 capitalize">{selectedStory.aiAnalysis.competitiveVulnerability}</div>
                  </div>
                </div>
              </div>

              <div>
                <div className="text-sm font-medium text-gray-500 mb-2">Recommended Talking Points</div>
                <div className="flex flex-wrap gap-2">
                  {selectedStory.aiAnalysis.recommendedTalkingPoints.map(point => (
                    <span key={point} className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                      {point.replace(/_/g, ' ')}
                    </span>
                  ))}
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button className="flex-1 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700">
                  Generate Creative Brief
                </button>
                <button className="flex-1 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700">
                  Request Custom Research
                </button>
                <button className="px-6 py-3 border border-gray-300 rounded-lg font-medium hover:bg-gray-50">
                  Export Data
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="bg-white border-t mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-4">
              <Activity className="w-6 h-6 text-blue-600" />
              <span className="font-bold text-gray-900">Democratic Accountability Platform</span>
            </div>
            <p className="text-gray-600 mb-4">
              Transforming democratic accountability through real-time citizen impact intelligence and professional creative services
            </p>
            <div className="flex justify-center gap-8 text-sm text-gray-500">
              <div>Platform Status: <span className="text-green-600 font-medium">Operational</span></div>
              <div>Stories Processed: <span className="font-medium">{liveMetrics.totalStories.toLocaleString()}</span></div>
              <div>Verification Rate: <span className="font-medium">94.7%</span></div>
              <div>Last Update: <span className="font-medium">{liveMetrics.lastUpdate.toLocaleTimeString()}</span></div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default DemocraticAccountabilityPlatform;