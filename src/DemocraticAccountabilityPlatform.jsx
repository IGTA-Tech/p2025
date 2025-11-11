import React, { useState, useEffect, useMemo } from 'react';
import {
  Users, Shield, Brain, MapPin, TrendingUp, AlertCircle, Eye, Target,
  Clock, Database, Zap, Search, Filter, Bell, DollarSign, BarChart3,
  FileText, Camera, Lock, Check, X, Star, Globe, MessageSquare,
  Play, Pause, Settings, Download, Share2, Mail, Phone, Calendar,
  Layers, Activity, Wifi, ChevronRight, ChevronDown, ExternalLink,
  Award, Briefcase, Building, Flag, Heart, Home, Scale, Gavel, CheckCircle2,
  Copy, FileDown, Sparkles, Cloud, AlertTriangle, Mic, Video, PhoneCall, Type,
  Moon, Sun
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { getDemographicsByZip, verifyStoryDemographics } from './services/censusApi';
import { generateCreativeBrief } from './services/creativeBriefAI';
import { getStateEnergyData, verifyEnergyStory } from './services/eiaApi';
import { getStateClimateData, verifyClimateStory } from './services/ncdcApi';
import { getStateHousingData, verifyHousingStory } from './services/hudApi';
import { getStateInfrastructureData, verifyInfrastructureStory } from './services/dotApi';
import { getStateEmergencyData, verifyEmergencyStory } from './services/femaApi';
import { getVictimizationByYear, verifyCrimeStory } from './services/bjsNcvsApi';
import { searchCandidates, searchCommittees, searchContributions, verifyCampaignFinanceStory } from './services/fecApi';
import { submitStory, fetchStories, subscribeToStories } from './services/supabaseClient';
import { analyzeStory } from './services/storyAnalyzer';
import { verifyStory } from './services/storyVerification';

// Comprehensive data models for the platform
const policyAreas = [
  { id: 'education', name: 'Education', icon: Award, color: '#059669', stories: 847, verified: 731, impact: 'critical' },
  { id: 'healthcare', name: 'Healthcare', icon: Heart, color: '#dc2626', stories: 623, verified: 487, impact: 'high' },
  { id: 'employment', name: 'Employment', icon: Briefcase, color: '#2563eb', stories: 1203, verified: 967, impact: 'critical' },
  { id: 'housing', name: 'Housing', icon: Home, color: '#7c3aed', stories: 456, verified: 312, impact: 'medium' },
  { id: 'environment', name: 'Environment', icon: Globe, color: '#16a34a', stories: 789, verified: 634, impact: 'high' },
  { id: 'immigration', name: 'Immigration', icon: Flag, color: '#ea580c', stories: 1456, verified: 1127, impact: 'critical' },
  { id: 'infrastructure', name: 'Infrastructure', icon: Building, color: '#0891b2', stories: 234, verified: 187, impact: 'low' },
  { id: 'justice', name: 'Justice', icon: Scale, color: '#be185d', stories: 345, verified: 278, impact: 'medium' },
  { id: 'election', name: 'Election', icon: CheckCircle2, color: '#16a34a', stories: 156, verified: 124, impact: 'high' }
];

const initialCitizenStories = [
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
  const [activeView, setActiveView] = useState('citizen');
  const [selectedStory, setSelectedStory] = useState(null);
  const [selectedPolicyArea, setSelectedPolicyArea] = useState('all');
  const [clientTier, setClientTier] = useState('enterprise');
  const [darkMode, setDarkMode] = useState(false);
  const [realTimeEnabled, setRealTimeEnabled] = useState(true);
  const [notifications, setNotifications] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [citizenStories, setCitizenStories] = useState(initialCitizenStories);

  // Citizen Portal Form State
  const [formData, setFormData] = useState({
    zipCode: '',
    policyArea: '',
    story: '',
    consent: false,
    voiceFile: null,
    videoFile: null,
    callbackPhone: '',
    callbackPreferredTime: ''
  });
  const [inputMethod, setInputMethod] = useState('text'); // 'text', 'voice', 'callback', 'video'
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submissionProgress, setSubmissionProgress] = useState({
    show: false,
    stage: '',
    progress: 0,
    steps: [],
    submittedStory: null
  });
  const [censusData, setCensusData] = useState(null);
  const [censusLoading, setCensusLoading] = useState(false);
  const [censusVerification, setCensusVerification] = useState(null);
  const [eiaData, setEiaData] = useState(null);
  const [eiaLoading, setEiaLoading] = useState(false);
  const [eiaVerification, setEiaVerification] = useState(null);
  const [ncdcData, setNcdcData] = useState(null);
  const [ncdcLoading, setNcdcLoading] = useState(false);
  const [ncdcVerification, setNcdcVerification] = useState(null);
  const [hudData, setHudData] = useState(null);
  const [hudLoading, setHudLoading] = useState(false);
  const [hudVerification, setHudVerification] = useState(null);
  const [dotData, setDotData] = useState(null);
  const [dotLoading, setDotLoading] = useState(false);
  const [dotVerification, setDotVerification] = useState(null);
  const [femaData, setFemaData] = useState(null);
  const [femaLoading, setFemaLoading] = useState(false);
  const [femaVerification, setFemaVerification] = useState(null);
  const [ncvsData, setNcvsData] = useState(null);
  const [ncvsLoading, setNcvsLoading] = useState(false);
  const [ncvsVerification, setNcvsVerification] = useState(null);
  const [fecData, setFecData] = useState(null);
  const [fecLoading, setFecLoading] = useState(false);
  const [fecVerification, setFecVerification] = useState(null);
  const [creativeBrief, setCreativeBrief] = useState(null);
  const [briefLoading, setBriefLoading] = useState(false);
  const [showBriefModal, setShowBriefModal] = useState(false);
  
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

  // Load stories from Supabase on mount
  useEffect(() => {
    const loadStories = async () => {
      try {
        console.log('Loading stories from Supabase...');
        const stories = await fetchStories();
        console.log(`Loaded ${stories.length} stories from Supabase`);
        setCitizenStories(stories);
      } catch (error) {
        console.error('Failed to load stories from Supabase:', error);
        console.log('Using initial stories from code');
        // Keep initial stories if Supabase fails
      }
    };

    loadStories();
  }, []); // Run once on mount

  // Subscribe to real-time updates from Supabase
  useEffect(() => {
    console.log('Setting up real-time subscription...');

    const subscription = subscribeToStories((update) => {
      console.log('Real-time update:', update);

      if (update.type === 'INSERT') {
        // New story added - check if it's not already in our list (avoid duplicates)
        setCitizenStories(prev => {
          const exists = prev.some(s => s.id === update.story.id);
          if (exists) return prev;
          return [update.story, ...prev];
        });

        // Show notification
        setNotifications(prev => [{
          id: Date.now(),
          type: 'new_story',
          title: 'New Story Submitted',
          message: `${update.story.headline.substring(0, 60)}...`,
          timestamp: new Date(),
          severity: 'info'
        }, ...prev.slice(0, 9)]);
      } else if (update.type === 'UPDATE') {
        // Story updated - replace in list
        setCitizenStories(prev =>
          prev.map(s => s.id === update.story.id ? update.story : s)
        );
      } else if (update.type === 'DELETE') {
        // Story deleted - remove from list
        setCitizenStories(prev => prev.filter(s => s.id !== update.storyId));
      }
    });

    // Cleanup subscription on unmount
    return () => {
      console.log('Cleaning up real-time subscription');
      subscription.unsubscribe();
    };
  }, []); // Run once on mount

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

  // Fetch Census, EIA, and NCDC data when a story is selected
  useEffect(() => {
    if (selectedStory) {
      const fetchVerificationData = async () => {
        // Fetch Census data
        setCensusLoading(true);
        setCensusData(null);
        setCensusVerification(null);

        try {
          const demographics = await getDemographicsByZip(selectedStory.location.zip);
          const verification = verifyStoryDemographics(selectedStory, demographics);

          setCensusData(demographics);
          setCensusVerification(verification);
        } catch (error) {
          console.error('Failed to fetch Census data:', error);
        } finally {
          setCensusLoading(false);
        }

        // Fetch EIA energy data
        setEiaLoading(true);
        setEiaData(null);
        setEiaVerification(null);

        try {
          const energyData = await getStateEnergyData(selectedStory.location.state);
          const energyVerification = verifyEnergyStory(selectedStory, energyData);

          setEiaData(energyData);
          setEiaVerification(energyVerification);
        } catch (error) {
          console.error('Failed to fetch EIA data:', error);
        } finally {
          setEiaLoading(false);
        }

        // Fetch NCDC climate data
        setNcdcLoading(true);
        setNcdcData(null);
        setNcdcVerification(null);

        try {
          const climateData = await getStateClimateData(selectedStory.location.state);
          const climateVerification = verifyClimateStory(selectedStory, climateData);

          setNcdcData(climateData);
          setNcdcVerification(climateVerification);
        } catch (error) {
          console.error('Failed to fetch NCDC data:', error);
        } finally {
          setNcdcLoading(false);
        }

        // Fetch HUD housing data
        setHudLoading(true);
        setHudData(null);
        setHudVerification(null);

        try {
          const zip = selectedStory.location.zip || null;
          const housingData = await getStateHousingData(selectedStory.location.state, zip);
          const housingVerification = verifyHousingStory(selectedStory, housingData);

          setHudData(housingData);
          setHudVerification(housingVerification);
        } catch (error) {
          console.error('Failed to fetch HUD data:', error);
        } finally {
          setHudLoading(false);
        }

        // Fetch DOT infrastructure data
        setDotLoading(true);
        setDotData(null);
        setDotVerification(null);

        try {
          const infrastructureData = await getStateInfrastructureData(selectedStory.location.state);
          const infraVerification = verifyInfrastructureStory(selectedStory, infrastructureData);

          setDotData(infrastructureData);
          setDotVerification(infraVerification);
        } catch (error) {
          console.error('Failed to fetch DOT data:', error);
        } finally {
          setDotLoading(false);
        }

        // Fetch FEMA emergency/disaster data
        setFemaLoading(true);
        setFemaData(null);
        setFemaVerification(null);

        try {
          const emergencyData = await getStateEmergencyData(selectedStory.location.state);
          const emergencyVerification = verifyEmergencyStory(selectedStory, emergencyData);

          setFemaData(emergencyData);
          setFemaVerification(emergencyVerification);
        } catch (error) {
          console.error('Failed to fetch FEMA data:', error);
        } finally {
          setFemaLoading(false);
        }

        // Fetch BJS NCVS crime victimization data
        setNcvsLoading(true);
        setNcvsData(null);
        setNcvsVerification(null);

        try {
          // Get victimization data for current year (or most recent available)
          const currentYear = new Date().getFullYear() - 2; // NCVS data has 2-year lag
          const victimizationData = await getVictimizationByYear(String(currentYear), 'personal');
          const crimeVerification = verifyCrimeStory(selectedStory, victimizationData);

          setNcvsData(victimizationData);
          setNcvsVerification(crimeVerification);
        } catch (error) {
          console.error('Failed to fetch NCVS data:', error);
        } finally {
          setNcvsLoading(false);
        }

        // Fetch FEC campaign finance data (only for election-related stories)
        if (selectedStory.policyArea === 'election') {
          setFecLoading(true);
          setFecData(null);
          setFecVerification(null);

          try {
            // Search for relevant FEC data based on story content
            const [candidates, committees, contributions] = await Promise.all([
              searchCandidates('', { state: selectedStory.location.state, cycle: 2024, perPage: 10 }),
              searchCommittees({ state: selectedStory.location.state, cycle: 2024, perPage: 10 }),
              searchContributions({ contributorState: selectedStory.location.state, perPage: 10 }),
            ]);

            const fecDataCombined = {
              candidates,
              committees,
              contributions,
              state: selectedStory.location.state,
            };

            const fecVerif = verifyCampaignFinanceStory(selectedStory, fecDataCombined);

            setFecData(fecDataCombined);
            setFecVerification(fecVerif);
          } catch (error) {
            console.error('Failed to fetch FEC data:', error);
          } finally {
            setFecLoading(false);
          }
        }
      };

      fetchVerificationData();
    }
  }, [selectedStory]);

  // Handle creative brief generation
  const handleGenerateCreativeBrief = async () => {
    if (!selectedStory) return;

    setBriefLoading(true);
    try {
      const brief = await generateCreativeBrief(selectedStory, censusData, censusVerification, false);
      setCreativeBrief(brief);
      setShowBriefModal(true);
    } catch (error) {
      console.error('Failed to generate creative brief:', error);
      alert('Failed to generate creative brief. Please try again.');
    } finally {
      setBriefLoading(false);
    }
  };

  // Copy brief to clipboard
  const copyBriefToClipboard = () => {
    if (!creativeBrief) return;
    navigator.clipboard.writeText(creativeBrief);
    alert('Creative brief copied to clipboard!');
  };

  // Download brief as text file
  const downloadBrief = () => {
    if (!creativeBrief || !selectedStory) return;

    const blob = new Blob([creativeBrief], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `creative-brief-${selectedStory.id}-${new Date().toISOString().split('T')[0]}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Helper function to update submission progress
  const updateProgress = (stage, progress, stepText, status = 'loading') => {
    setSubmissionProgress(prev => ({
      ...prev,
      show: true,
      stage,
      progress,
      steps: [...prev.steps, { text: stepText, status, timestamp: new Date() }]
    }));
  };

  // Handle citizen story submission
  const handleSubmitStory = async (e) => {
    e.preventDefault();

    // Validation
    if (!formData.zipCode || !formData.policyArea || !formData.story || !formData.consent) {
      alert('Please fill out all required fields and accept the consent.');
      return;
    }

    if (formData.zipCode.length !== 5 || !/^\d{5}$/.test(formData.zipCode)) {
      alert('Please enter a valid 5-digit ZIP code.');
      return;
    }

    setSubmitting(true);
    setSubmissionProgress({
      show: true,
      stage: 'starting',
      progress: 0,
      steps: [],
      submittedStory: null
    });

    try {
      updateProgress('starting', 5, 'Submitting your story...', 'loading');
      // Generate a simple headline from the first sentence or first 80 characters
      const firstSentence = formData.story.split('.')[0];
      const headline = firstSentence.length > 80
        ? firstSentence.substring(0, 77) + '...'
        : firstSentence;

      // Generate new story ID
      const storyId = `CS-2025-${String(citizenStories.length + 1).padStart(6, '0')}`;

      // Get demographics and location data from Census API
      let locationData = {
        zip: formData.zipCode,
        city: 'Unknown',
        state: 'Unknown',
        county: 'Unknown',
        district: 'Unknown'
      };
      let demographicsData = {};

      updateProgress('location', 15, 'Looking up your location details...', 'loading');
      try {
        console.log('Fetching demographics for ZIP:', formData.zipCode);
        const censusData = await getDemographicsByZip(formData.zipCode);
        if (censusData && !censusData.error) {
          locationData = {
            zip: formData.zipCode,
            city: censusData.city || 'Unknown',
            state: censusData.state || 'Unknown',
            county: censusData.county || 'Unknown',
            district: censusData.district || 'Unknown'
          };
          demographicsData = censusData.demographics || {};
          console.log('Census data retrieved:', locationData);
          updateProgress('location', 25, `Location identified: ${locationData.city}, ${locationData.state}`, 'success');
        } else {
          updateProgress('location', 25, 'Using ZIP code only', 'warning');
        }
      } catch (censusError) {
        console.error('Census API failed:', censusError);
        updateProgress('location', 25, 'Location lookup partial', 'warning');
        // Continue with default location data
      }

      // Create new story object
      const newStory = {
        id: storyId,
        submittedAt: new Date().toISOString(),
        location: locationData,
        policyArea: formData.policyArea,
        severity: 'medium', // Default severity
        verificationStatus: 'pending',
        verificationScore: 0,
        headline: headline,
        story: formData.story,
        evidence: [],
        demographics: demographicsData,
        impact: {
          economic: 0,
          affected_population: 0,
          timeframe: 'unknown',
          correlation_confidence: 0
        },
        aiAnalysis: {
          messageResonance: 0,
          demographicAppeal: [],
          recommendedTalkingPoints: [],
          competitiveVulnerability: 'unknown'
        }
      };

      // Run AI analysis on the story
      updateProgress('analysis', 35, 'Analyzing story with AI...', 'loading');
      console.log('Running AI analysis on new story...');
      try {
        const analysis = await analyzeStory(newStory);
        newStory.aiAnalysis = {
          messageResonance: analysis.messageResonance,
          demographicAppeal: analysis.demographicAppeal,
          recommendedTalkingPoints: analysis.recommendedTalkingPoints,
          competitiveVulnerability: analysis.competitiveVulnerability
        };
        console.log('AI analysis completed:', analysis.analysisMethod);
        updateProgress('analysis', 50, 'AI analysis complete', 'success');
      } catch (analysisError) {
        console.error('AI analysis failed:', analysisError);
        updateProgress('analysis', 50, 'AI analysis skipped', 'warning');
        // Continue with default values
      }

      // Run story verification using federal APIs
      updateProgress('verification', 55, 'Verifying with federal data sources...', 'loading');
      console.log('Running story verification...');
      try {
        const verification = await verifyStory(newStory);

        // Update story with verification results
        newStory.verificationStatus = verification.verified ? 'verified' : 'pending';
        newStory.verificationScore = verification.confidence || 0;
        newStory.verificationDataSource = verification.dataSource;
        newStory.verificationInsights = verification.insights;
        newStory.verificationFlags = verification.flags;

        console.log('Story verification completed:', {
          verified: verification.verified,
          confidence: verification.confidence,
          dataSource: verification.dataSource,
          insightsCount: verification.insights?.length || 0
        });

        const verificationMsg = verification.verified
          ? `Verification complete: ${verification.confidence}% confidence`
          : 'Verification pending additional data';
        updateProgress('verification', 75, verificationMsg, verification.verified ? 'success' : 'warning');
      } catch (verificationError) {
        console.error('Story verification failed:', verificationError);
        updateProgress('verification', 75, 'Verification will continue in background', 'warning');
        // Continue with default verification values (score: 0, status: pending)
      }

      // Save to Supabase
      updateProgress('saving', 85, 'Saving to secure database...', 'loading');
      let supabaseSaveSuccessful = false;
      try {
        await submitStory(newStory);
        console.log('✅ Story saved to Supabase successfully');
        supabaseSaveSuccessful = true;
        updateProgress('saving', 95, 'Story saved successfully', 'success');
      } catch (supabaseError) {
        console.error('❌ Supabase save failed:', supabaseError);
        console.error('Story will only be in local state and will be lost on refresh!');
        updateProgress('saving', 95, 'Database save failed - story is temporary', 'error');

        // Show warning to user
        const shouldContinue = confirm(
          `⚠️ WARNING: Database save failed!\n\n` +
          `Your story could not be saved to the database. ` +
          `It will appear temporarily but will be lost when you refresh the page.\n\n` +
          `Error: ${supabaseError.message}\n\n` +
          `Would you like to try submitting again? Click OK to retry, or Cancel to continue anyway.`
        );

        if (shouldContinue) {
          // User wants to retry - stop submission
          setSubmitting(false);
          setSubmissionProgress({ show: false, stage: '', progress: 0, steps: [], submittedStory: null });
          return;
        }
        // User chose to continue anyway - story will be in local state only
      }

      // Add new story to the beginning of the array (most recent first)
      setCitizenStories(prev => [newStory, ...prev]);

      // Complete progress and show success
      updateProgress('complete', 100, 'Story submitted successfully!', 'success');

      // Store the submitted story for the modal
      setSubmissionProgress(prev => ({
        ...prev,
        stage: 'complete',
        progress: 100,
        submittedStory: newStory
      }));

      if (!supabaseSaveSuccessful) {
        // Add notification about database save failure
        setNotifications(prev => [{
          id: Date.now(),
          type: 'warning',
          title: '⚠️ Database Save Failed',
          message: 'Story is temporarily visible but will be lost on page refresh',
          timestamp: new Date(),
          severity: 'warning'
        }, ...prev.slice(0, 9)]);
      }

      // Reset form
      setFormData({
        zipCode: '',
        policyArea: '',
        story: '',
        consent: false
      });

    } catch (error) {
      console.error('Error submitting story:', error);
      updateProgress('error', 0, `Submission failed: ${error.message}`, 'error');
      alert('Failed to submit story. Please try again.');
      setSubmissionProgress({ show: false, stage: '', progress: 0, steps: [], submittedStory: null });
    } finally {
      setSubmitting(false);
    }
  };

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
      <div className={`rounded-2xl shadow-2xl p-8 mb-8 relative overflow-hidden transition-all duration-300 ${
        darkMode
          ? 'glass-dark border border-gray-700'
          : 'glass border border-white/30'
      }`}>
        {/* Animated gradient background */}
        <div className={`absolute inset-0 animated-gradient -z-10 ${darkMode ? 'opacity-10' : 'opacity-20'}`}></div>

        <div className="text-center mb-8 fade-in">
          <div className="flex justify-center mb-4">
            <div className={`rounded-full p-4 float shimmer hover-lift transition-all duration-300 ${
              darkMode
                ? 'bg-gradient-to-br from-blue-900 to-blue-700'
                : 'bg-gradient-to-br from-biblical-parchment to-biblical-sand'
            }`}>
              <Users className={`w-12 h-12 transition-colors duration-300 ${darkMode ? 'text-blue-300' : 'text-biblical-deepblue'}`} />
            </div>
          </div>
          <h2 className={`text-4xl md:text-5xl font-bold mb-4 font-serif slide-in-left transition-colors duration-300 ${
            darkMode ? 'text-white' : 'text-biblical-deepblue'
          }`}>Your Voice. Your Story. Your Impact.</h2>
          <p className={`text-lg max-w-3xl mx-auto fade-in transition-colors duration-300 ${
            darkMode ? 'text-gray-300' : 'text-gray-600'
          }`}>
            Share how federal policies are affecting your life, family, and community. Your story helps hold our government accountable to real people.
          </p>
        </div>

        <div className="grid grid-cols-3 gap-6 mb-8">
          <div className="text-center fade-in hover-lift">
            <div className={`rounded-xl p-4 mb-3 border-l-4 transition-all duration-300 group ${
              darkMode
                ? 'glass-dark border-yellow-500 hover:border-blue-400'
                : 'glass border-biblical-gold hover:border-biblical-deepblue'
            }`}>
              <Shield className={`w-8 h-8 mx-auto group-hover:scale-110 transition-all duration-300 ${
                darkMode ? 'text-blue-400' : 'text-biblical-deepblue'
              }`} />
            </div>
            <h3 className={`font-semibold transition-colors duration-300 ${darkMode ? 'text-blue-300' : 'text-biblical-deepblue'}`}>Privacy Protected</h3>
            <p className={`text-sm transition-colors duration-300 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Your identity is encrypted and protected. Share anonymously or with attribution - your choice.</p>
          </div>
          <div className="text-center fade-in hover-lift" style={{animationDelay: '0.1s'}}>
            <div className={`rounded-xl p-4 mb-3 border-l-4 transition-all duration-300 group ${
              darkMode
                ? 'glass-dark border-yellow-500 hover:border-blue-400'
                : 'glass border-biblical-gold hover:border-biblical-deepblue'
            }`}>
              <Brain className={`w-8 h-8 mx-auto group-hover:scale-110 transition-all duration-300 ${
                darkMode ? 'text-blue-400' : 'text-biblical-deepblue'
              }`} />
            </div>
            <h3 className={`font-semibold transition-colors duration-300 ${darkMode ? 'text-blue-300' : 'text-biblical-deepblue'}`}>AI Verification</h3>
            <p className={`text-sm transition-colors duration-300 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Our AI cross-references your story with government data to verify authenticity and impact.</p>
          </div>
          <div className="text-center fade-in hover-lift" style={{animationDelay: '0.2s'}}>
            <div className={`rounded-xl p-4 mb-3 border-l-4 transition-all duration-300 group ${
              darkMode
                ? 'glass-dark border-yellow-500 hover:border-blue-400'
                : 'glass border-biblical-gold hover:border-biblical-deepblue'
            }`}>
              <Target className={`w-8 h-8 mx-auto group-hover:scale-110 transition-all duration-300 ${
                darkMode ? 'text-blue-400' : 'text-biblical-deepblue'
              }`} />
            </div>
            <h3 className={`font-semibold transition-colors duration-300 ${darkMode ? 'text-blue-300' : 'text-biblical-deepblue'}`}>Political Impact</h3>
            <p className={`text-sm transition-colors duration-300 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Your verified story becomes data that influences political strategies and holds leaders accountable.</p>
          </div>
        </div>

        {/* Input Method Selection Cards */}
        <div className="mb-8 fade-in">
          <h3 className={`text-lg font-semibold mb-4 slide-in-left transition-colors duration-300 ${
            darkMode ? 'text-white' : 'text-gray-900'
          }`}>Choose How to Share Your Story</h3>
          <div className="grid grid-cols-4 gap-4">
            {/* Text Story Card */}
            <button
              type="button"
              onClick={() => setInputMethod('text')}
              className={`p-6 rounded-xl border-2 transition-all duration-300 hover-lift group ${
                inputMethod === 'text'
                  ? darkMode
                    ? 'border-blue-500 glass-dark glow scale-105'
                    : 'border-biblical-gold glass glow scale-105'
                  : darkMode
                    ? 'border-gray-600 glass-dark hover:border-gray-500'
                    : 'border-gray-200 glass hover:border-biblical-sand'
              }`}
            >
              <div className={`rounded-full p-4 mb-4 mx-auto w-fit transition-all duration-300 ${
                inputMethod === 'text'
                  ? 'animated-gradient-gold'
                  : darkMode
                    ? 'bg-gray-700 group-hover:bg-gray-600'
                    : 'bg-gray-100 group-hover:bg-biblical-parchment'
              }`}>
                <Type className={`w-8 h-8 transition-all duration-300 ${
                  inputMethod === 'text'
                    ? darkMode ? 'text-white scale-110' : 'text-biblical-deepblue scale-110'
                    : darkMode ? 'text-gray-300 group-hover:scale-110' : 'text-gray-600 group-hover:scale-110'
                }`} />
              </div>
              <h4 className={`font-semibold mb-2 transition-colors duration-300 ${darkMode ? 'text-white' : 'text-gray-900'}`}>Write Story</h4>
              <p className={`text-sm transition-colors duration-300 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Type your story in the form below</p>
            </button>

            {/* Voice Memo Card */}
            <button
              type="button"
              onClick={() => setInputMethod('voice')}
              className={`p-6 rounded-xl border-2 transition-all duration-300 hover-lift group ${
                inputMethod === 'voice'
                  ? darkMode ? 'border-blue-500 glass-dark glow scale-105' : 'border-biblical-gold glass glow scale-105'
                  : darkMode ? 'border-gray-600 glass-dark hover:border-gray-500' : 'border-gray-200 glass hover:border-biblical-sand'
              }`}
              style={{animationDelay: '0.1s'}}
            >
              <div className={`rounded-full p-4 mb-4 mx-auto w-fit transition-all duration-300 ${
                inputMethod === 'voice'
                  ? 'animated-gradient-gold'
                  : darkMode ? 'bg-gray-700 group-hover:bg-gray-600' : 'bg-gray-100 group-hover:bg-biblical-parchment'
              }`}>
                <Mic className={`w-8 h-8 transition-all duration-300 ${
                  inputMethod === 'voice'
                    ? darkMode ? 'text-white scale-110 pulse-slow' : 'text-biblical-deepblue scale-110 pulse-slow'
                    : darkMode ? 'text-gray-300 group-hover:scale-110' : 'text-gray-600 group-hover:scale-110'
                }`} />
              </div>
              <h4 className={`font-semibold mb-2 transition-colors duration-300 ${darkMode ? 'text-white' : 'text-gray-900'}`}>Voice Memo</h4>
              <p className={`text-sm transition-colors duration-300 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Record or upload an audio file</p>
            </button>

            {/* Callback Request Card */}
            <button
              type="button"
              onClick={() => setInputMethod('callback')}
              className={`p-6 rounded-xl border-2 transition-all duration-300 hover-lift group ${
                inputMethod === 'callback'
                  ? darkMode ? 'border-blue-500 glass-dark glow scale-105' : 'border-biblical-gold glass glow scale-105'
                  : darkMode ? 'border-gray-600 glass-dark hover:border-gray-500' : 'border-gray-200 glass hover:border-biblical-sand'
              }`}
              style={{animationDelay: '0.2s'}}
            >
              <div className={`rounded-full p-4 mb-4 mx-auto w-fit transition-all duration-300 ${
                inputMethod === 'callback'
                  ? 'animated-gradient-gold'
                  : darkMode ? 'bg-gray-700 group-hover:bg-gray-600' : 'bg-gray-100 group-hover:bg-biblical-parchment'
              }`}>
                <PhoneCall className={`w-8 h-8 transition-all duration-300 ${
                  inputMethod === 'callback'
                    ? darkMode ? 'text-white scale-110' : 'text-biblical-deepblue scale-110'
                    : darkMode ? 'text-gray-300 group-hover:scale-110' : 'text-gray-600 group-hover:scale-110'
                }`} />
              </div>
              <h4 className={`font-semibold mb-2 transition-colors duration-300 ${darkMode ? 'text-white' : 'text-gray-900'}`}>Request Callback</h4>
              <p className={`text-sm transition-colors duration-300 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>We'll call you to record your story</p>
            </button>

            {/* Video Upload Card */}
            <button
              type="button"
              onClick={() => setInputMethod('video')}
              className={`p-6 rounded-xl border-2 transition-all duration-300 hover-lift group ${
                inputMethod === 'video'
                  ? darkMode ? 'border-blue-500 glass-dark glow scale-105' : 'border-biblical-gold glass glow scale-105'
                  : darkMode ? 'border-gray-600 glass-dark hover:border-gray-500' : 'border-gray-200 glass hover:border-biblical-sand'
              }`}
              style={{animationDelay: '0.3s'}}
            >
              <div className={`rounded-full p-4 mb-4 mx-auto w-fit transition-all duration-300 ${
                inputMethod === 'video'
                  ? 'animated-gradient-gold'
                  : darkMode ? 'bg-gray-700 group-hover:bg-gray-600' : 'bg-gray-100 group-hover:bg-biblical-parchment'
              }`}>
                <Video className={`w-8 h-8 transition-all duration-300 ${
                  inputMethod === 'video'
                    ? darkMode ? 'text-white scale-110' : 'text-biblical-deepblue scale-110'
                    : darkMode ? 'text-gray-300 group-hover:scale-110' : 'text-gray-600 group-hover:scale-110'
                }`} />
              </div>
              <h4 className={`font-semibold mb-2 transition-colors duration-300 ${darkMode ? 'text-white' : 'text-gray-900'}`}>Video Story</h4>
              <p className={`text-sm transition-colors duration-300 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Upload a recorded video message</p>
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmitStory} className="space-y-6 fade-in">
          <div className="grid grid-cols-2 gap-4">
            <div className="slide-in-left">
              <label className={`block text-sm font-medium mb-2 transition-colors duration-300 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Your Location</label>
              <input
                type="text"
                placeholder="ZIP Code"
                value={formData.zipCode}
                onChange={(e) => setFormData(prev => ({ ...prev, zipCode: e.target.value }))}
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:border-transparent transition-all duration-300 focus:scale-105 ${
                  darkMode
                    ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:ring-blue-500 hover:border-gray-500'
                    : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400 focus:ring-biblical-gold hover:border-biblical-sand'
                }`}
                maxLength={5}
                required
              />
            </div>
            <div className="slide-in-left" style={{animationDelay: '0.1s'}}>
              <label className={`block text-sm font-medium mb-2 transition-colors duration-300 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Policy Area Most Affected</label>
              <select
                value={formData.policyArea}
                onChange={(e) => setFormData(prev => ({ ...prev, policyArea: e.target.value }))}
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:border-transparent transition-all duration-300 focus:scale-105 ${
                  darkMode
                    ? 'bg-gray-700 border-gray-600 text-white focus:ring-blue-500 hover:border-gray-500'
                    : 'bg-white border-gray-300 text-gray-900 focus:ring-biblical-gold hover:border-biblical-sand'
                }`}
                required
              >
                <option value="">Select area...</option>
                {policyAreas.map(area => (
                  <option key={area.id} value={area.id}>{area.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Conditional Story Input Based on Selected Method */}
          {inputMethod === 'text' && (
            <div className="fade-in">
              <label className={`block text-sm font-medium mb-2 transition-colors duration-300 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Your Story</label>
              <textarea
                rows={6}
                placeholder="Tell us how federal policy changes have affected you, your family, or your community. Be specific about what changed, when it happened, and how it impacts your daily life."
                value={formData.story}
                onChange={(e) => setFormData(prev => ({ ...prev, story: e.target.value }))}
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:border-transparent transition-all duration-300 resize-none focus:scale-[1.02] ${
                  darkMode
                    ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:ring-blue-500 hover:border-gray-500'
                    : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400 focus:ring-biblical-gold hover:border-biblical-sand'
                }`}
                required
              />
            </div>
          )}

          {inputMethod === 'voice' && (
            <div className="fade-in">
              <label className={`block text-sm font-medium mb-2 transition-colors duration-300 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Voice Memo</label>
              <div className={`border-2 border-dashed rounded-xl p-8 text-center relative overflow-hidden group transition-all duration-300 ${
                darkMode ? 'border-gray-600 glass-dark' : 'border-biblical-sand glass'
              }`}>
                <div className={`absolute inset-0 animated-gradient -z-10 ${darkMode ? 'opacity-5' : 'opacity-10'}`}></div>
                <Mic className={`w-16 h-16 mx-auto mb-4 opacity-60 float pulse-slow transition-colors duration-300 ${
                  darkMode ? 'text-blue-400' : 'text-biblical-deepblue'
                }`} />
                <h4 className={`font-semibold mb-2 transition-colors duration-300 ${darkMode ? 'text-white' : 'text-gray-900'}`}>Upload or Record Your Story</h4>
                <p className={`mb-4 transition-colors duration-300 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>Share your experience through voice - we'll transcribe it for you</p>
                <p className={`text-sm mb-4 transition-colors duration-300 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Accepted formats: MP3, M4A, WAV, OGG • Max 50MB • Up to 10 minutes</p>
                {formData.voiceFile ? (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                    <div className="flex items-center justify-center gap-2 text-green-700">
                      <CheckCircle2 className="w-5 h-5" />
                      <span className="font-medium">{formData.voiceFile.name}</span>
                      <button
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, voiceFile: null }))}
                        className="ml-2 text-red-600 hover:text-red-700"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ) : null}
                <div className="flex gap-3 justify-center">
                  <label className="px-6 py-3 bg-biblical-deepblue text-white rounded-lg hover:bg-biblical-gold hover:text-biblical-deepblue transition-all duration-300 font-medium cursor-pointer hover-lift scale-on-hover">
                    <input
                      type="file"
                      accept="audio/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) setFormData(prev => ({ ...prev, voiceFile: file }));
                      }}
                      className="hidden"
                    />
                    Upload Audio File
                  </label>
                  <button
                    type="button"
                    className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all duration-300 font-medium flex items-center gap-2 hover-lift scale-on-hover"
                    onClick={() => alert('Recording feature coming soon! For now, please use the upload option.')}
                  >
                    <Mic className="w-4 h-4 group-hover:scale-110 transition-transform" />
                    Record Now
                  </button>
                </div>
              </div>
            </div>
          )}

          {inputMethod === 'callback' && (
            <div className="space-y-4 fade-in">
              <label className="block text-sm font-medium text-gray-700 mb-2">Request a Callback</label>
              <div className="border-2 border-biblical-sand rounded-xl p-6 glass relative overflow-hidden">
                <div className="absolute inset-0 animated-gradient-blue opacity-10 -z-10"></div>
                <PhoneCall className="w-16 h-16 text-biblical-deepblue mx-auto mb-4 opacity-60 float" />
                <h4 className="font-semibold text-gray-900 mb-2 text-center">We'll Call You</h4>
                <p className="text-gray-600 mb-6 text-center">One of our trained staff members will call you to record your story over the phone</p>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
                    <input
                      type="tel"
                      placeholder="(555) 123-4567"
                      value={formData.callbackPhone}
                      onChange={(e) => setFormData(prev => ({ ...prev, callbackPhone: e.target.value }))}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-biblical-gold focus:border-transparent transition-all"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Preferred Call Time</label>
                    <select
                      value={formData.callbackPreferredTime}
                      onChange={(e) => setFormData(prev => ({ ...prev, callbackPreferredTime: e.target.value }))}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-biblical-gold focus:border-transparent transition-all"
                      required
                    >
                      <option value="">Select preferred time...</option>
                      <option value="morning">Morning (8am - 12pm)</option>
                      <option value="afternoon">Afternoon (12pm - 5pm)</option>
                      <option value="evening">Evening (5pm - 8pm)</option>
                      <option value="anytime">Anytime</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Brief Summary (Optional)</label>
                    <textarea
                      rows={3}
                      placeholder="Give us a brief idea of what you'd like to discuss so we can prepare..."
                      value={formData.story}
                      onChange={(e) => setFormData(prev => ({ ...prev, story: e.target.value }))}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-biblical-gold focus:border-transparent transition-all resize-none"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {inputMethod === 'video' && (
            <div className="fade-in">
              <label className="block text-sm font-medium text-gray-700 mb-2">Video Story</label>
              <div className="border-2 border-dashed border-biblical-sand rounded-xl p-8 text-center glass relative overflow-hidden">
                <div className="absolute inset-0 animated-gradient opacity-10 -z-10"></div>
                <Video className="w-16 h-16 text-biblical-deepblue mx-auto mb-4 opacity-60 float" />
                <h4 className="font-semibold text-gray-900 mb-2">Upload Your Video Story</h4>
                <p className="text-gray-600 mb-4">Share your experience on camera for maximum impact</p>
                <p className="text-sm text-gray-500 mb-4">Accepted formats: MP4, MOV, AVI, WebM • Max 500MB • Up to 5 minutes</p>
                {formData.videoFile ? (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                    <div className="flex items-center justify-center gap-2 text-green-700">
                      <CheckCircle2 className="w-5 h-5" />
                      <span className="font-medium">{formData.videoFile.name}</span>
                      <button
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, videoFile: null }))}
                        className="ml-2 text-red-600 hover:text-red-700"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                    <p className="text-sm text-gray-600 mt-2">Size: {(formData.videoFile.size / 1024 / 1024).toFixed(2)} MB</p>
                  </div>
                ) : null}
                <label className="inline-block px-6 py-3 bg-biblical-deepblue text-white rounded-lg hover:bg-biblical-gold hover:text-biblical-deepblue transition-all duration-300 font-medium cursor-pointer hover-lift scale-on-hover">
                  <input
                    type="file"
                    accept="video/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        if (file.size > 500 * 1024 * 1024) {
                          alert('File size must be under 500MB');
                          return;
                        }
                        setFormData(prev => ({ ...prev, videoFile: file }));
                      }
                    }}
                    className="hidden"
                  />
                  Choose Video File
                </label>
                <p className="text-xs text-gray-500 mt-4">
                  Tips: Find a quiet location, speak clearly, and tell your story in 2-5 minutes
                </p>
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Supporting Evidence (Optional)</label>
            <div className="border-2 border-dashed border-biblical-sand rounded-lg p-6 text-center bg-gradient-to-br from-white to-biblical-parchment">
              <Camera className="w-12 h-12 text-biblical-deepblue mx-auto mb-4 opacity-60" />
              <p className="text-gray-600 mb-2">Upload photos, documents, or other evidence</p>
              <p className="text-sm text-gray-500">Photos, PDFs, screenshots accepted. Max 10MB per file.</p>
              <button type="button" className="mt-4 px-6 py-2 bg-biblical-sand text-gray-700 rounded-lg hover:bg-biblical-gold hover:text-biblical-deepblue transition-all font-medium">
                Choose Files
              </button>
            </div>
          </div>

          <div className="border-t border-biblical-sand pt-6">
            <div className="flex items-start gap-3">
              <input
                type="checkbox"
                checked={formData.consent}
                onChange={(e) => setFormData(prev => ({ ...prev, consent: e.target.checked }))}
                className="mt-1 w-4 h-4 text-biblical-gold focus:ring-biblical-gold"
                required
              />
              <div className="text-sm text-gray-600">
                <p>I consent to my story being used for political analysis and advocacy. My personal information will be protected and I can request removal at any time.</p>
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className={`w-full py-4 rounded-xl font-semibold text-lg transition-all duration-300 shadow-lg hover:shadow-2xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 hover-lift glow group relative overflow-hidden ${
              darkMode
                ? 'bg-blue-600 text-white hover:bg-blue-500'
                : 'bg-biblical-deepblue text-white hover:bg-biblical-gold hover:text-biblical-deepblue'
            }`}
          >
            {/* Shimmer effect on hover */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>

            {submitting ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                Submitting...
              </>
            ) : (
              <>
                {inputMethod === 'text' && (
                  <>
                    <FileText className="w-5 h-5 group-hover:scale-110 transition-transform duration-300" />
                    Submit Your Story
                  </>
                )}
                {inputMethod === 'voice' && (
                  <>
                    <Mic className="w-5 h-5 group-hover:scale-110 transition-transform duration-300" />
                    Submit Voice Memo
                  </>
                )}
                {inputMethod === 'callback' && (
                  <>
                    <PhoneCall className="w-5 h-5 group-hover:scale-110 transition-transform duration-300" />
                    Request Callback
                  </>
                )}
                {inputMethod === 'video' && (
                  <>
                    <Video className="w-5 h-5 group-hover:scale-110 transition-transform duration-300" />
                    Submit Video Story
                  </>
                )}
              </>
            )}
          </button>
        </form>
      </div>

      <div className="grid grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-lg p-4 shadow border border-biblical-sand">
          <div className="text-2xl font-bold text-biblical-deepblue">{liveMetrics.totalStories.toLocaleString()}</div>
          <div className="text-sm text-gray-600">Stories Submitted</div>
        </div>
        <div className="bg-white rounded-lg p-4 shadow border border-biblical-sand">
          <div className="text-2xl font-bold text-biblical-gold">{liveMetrics.verifiedStories.toLocaleString()}</div>
          <div className="text-sm text-gray-600">Stories Verified</div>
        </div>
        <div className="bg-white rounded-lg p-4 shadow border border-biblical-sand">
          <div className="text-2xl font-bold text-biblical-deepblue">{liveMetrics.storiesThisHour}</div>
          <div className="text-sm text-gray-600">Stories This Hour</div>
        </div>
        <div className="bg-white rounded-lg p-4 shadow border border-biblical-sand">
          <div className="text-2xl font-bold text-biblical-gold">94.7%</div>
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
                    {story.aiAnalysis.competitiveVulnerability !== 'unknown' ? (
                      <>
                        <span className="font-medium capitalize">{story.aiAnalysis.competitiveVulnerability}</span> vulnerability
                        <span className="text-gray-400">•</span>
                        <span>{story.aiAnalysis.messageResonance}% resonance</span>
                      </>
                    ) : (
                      <span className="text-gray-400">Analysis pending...</span>
                    )}
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
    <div className={`min-h-screen transition-colors duration-300 ${darkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
      {/* Navigation */}
      <nav className={`shadow-sm border-b transition-colors duration-300 ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-8">
              <div className="flex items-center gap-3">
                <div className={`rounded-lg p-2 transition-colors duration-300 ${darkMode ? 'bg-blue-500' : 'bg-blue-600'}`}>
                  <Activity className="w-6 h-6 text-white" />
                </div>
                <div>
                  <div className={`font-bold transition-colors duration-300 ${darkMode ? 'text-white' : 'text-gray-900'}`}>Democratic Accountability Platform</div>
                  <div className={`text-xs transition-colors duration-300 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Real-time Political Intelligence</div>
                </div>
              </div>
              
              <div className="flex gap-1">
                <button
                  onClick={() => setActiveView('citizen')}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-all duration-300 ${
                    activeView === 'citizen'
                      ? darkMode ? 'bg-blue-900 text-blue-200' : 'bg-blue-100 text-blue-800'
                      : darkMode ? 'text-gray-300 hover:text-white hover:bg-gray-700' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  Citizen Portal
                </button>
                <button
                  onClick={() => setActiveView('dashboard')}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-all duration-300 ${
                    activeView === 'dashboard'
                      ? darkMode ? 'bg-blue-900 text-blue-200' : 'bg-blue-100 text-blue-800'
                      : darkMode ? 'text-gray-300 hover:text-white hover:bg-gray-700' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  Intelligence Dashboard
                </button>
                <button
                  onClick={() => setActiveView('creative')}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-all duration-300 ${
                    activeView === 'creative'
                      ? darkMode ? 'bg-blue-900 text-blue-200' : 'bg-blue-100 text-blue-800'
                      : darkMode ? 'text-gray-300 hover:text-white hover:bg-gray-700' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  Creative Services
                </button>
                <button
                  onClick={() => setActiveView('business')}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-all duration-300 ${
                    activeView === 'business'
                      ? darkMode ? 'bg-blue-900 text-blue-200' : 'bg-blue-100 text-blue-800'
                      : darkMode ? 'text-gray-300 hover:text-white hover:bg-gray-700' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  Business Intelligence
                </button>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>Live: {liveMetrics.storiesThisHour}/hr</span>
              </div>
              <button
                onClick={() => setRealTimeEnabled(!realTimeEnabled)}
                className={`p-2 rounded-md transition-all duration-300 hover-lift ${realTimeEnabled ? 'text-green-600' : 'text-gray-400'}`}
              >
                {realTimeEnabled ? <Wifi className="w-5 h-5" /> : <X className="w-5 h-5" />}
              </button>
              <button
                onClick={() => setDarkMode(!darkMode)}
                className={`p-2 rounded-md transition-all duration-300 hover-lift ${darkMode ? 'text-yellow-400 bg-gray-700' : 'text-gray-600 hover:bg-gray-100'}`}
                title={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              >
                {darkMode ? <Sun className="w-5 h-5 rotate-slow" /> : <Moon className="w-5 h-5" />}
              </button>
              <div className="relative">
                <Bell className={`w-5 h-5 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`} />
                {notifications.length > 0 && (
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full text-xs"></div>
                )}
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Main content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative">
        {/* Animated background for citizen portal */}
        {activeView === 'citizen' && (
          <div className="fixed inset-0 -z-20 overflow-hidden pointer-events-none">
            <div className="absolute top-0 left-0 w-96 h-96 bg-biblical-gold/10 rounded-full blur-3xl animate-pulse" style={{animation: 'float 8s ease-in-out infinite'}}></div>
            <div className="absolute bottom-0 right-0 w-96 h-96 bg-biblical-deepblue/10 rounded-full blur-3xl animate-pulse" style={{animation: 'float 10s ease-in-out infinite', animationDelay: '2s'}}></div>
            <div className="absolute top-1/2 left-1/2 w-96 h-96 bg-biblical-parchment/20 rounded-full blur-3xl animate-pulse" style={{animation: 'float 12s ease-in-out infinite', animationDelay: '4s'}}></div>
          </div>
        )}
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
                    <div className="text-lg font-semibold text-purple-600 capitalize">
                      {selectedStory.aiAnalysis.competitiveVulnerability !== 'unknown'
                        ? selectedStory.aiAnalysis.competitiveVulnerability
                        : <span className="text-gray-400 text-sm">Pending analysis</span>
                      }
                    </div>
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

              {/* Census Bureau Verification */}
              <div className="border-t pt-6">
                <div className="flex items-center gap-2 mb-3">
                  <CheckCircle2 className="w-5 h-5 text-green-600" />
                  <div className="text-sm font-medium text-gray-700">US Census Bureau Verification</div>
                </div>

                {censusLoading && (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-3"></div>
                    <div className="text-sm text-gray-600">Fetching Census data for ZIP {selectedStory.location.zip}...</div>
                  </div>
                )}

                {!censusLoading && censusData && censusVerification && (
                  <div className="space-y-4">
                    <div className="bg-gradient-to-br from-green-50 to-blue-50 rounded-lg p-4 border border-green-200">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <div className="font-semibold text-gray-900">Census Confidence Score</div>
                          <div className="text-xs text-gray-600">Based on {censusData.dataYear} ACS 5-Year Estimates</div>
                        </div>
                        <div className="text-3xl font-bold text-green-600">{censusVerification.confidence}%</div>
                      </div>

                      <div className="grid grid-cols-4 gap-3 mb-3">
                        <div className="bg-white rounded p-2 text-center">
                          <div className="text-xs text-gray-500">Population</div>
                          <div className="font-semibold text-gray-900">{censusData.population.total.toLocaleString()}</div>
                        </div>
                        <div className="bg-white rounded p-2 text-center">
                          <div className="text-xs text-gray-500">Median Income</div>
                          <div className="font-semibold text-gray-900">${(censusData.income.medianHousehold / 1000).toFixed(0)}k</div>
                        </div>
                        <div className="bg-white rounded p-2 text-center">
                          <div className="text-xs text-gray-500">Unemployment</div>
                          <div className="font-semibold text-gray-900">{censusData.employment.unemploymentRate}%</div>
                        </div>
                        <div className="bg-white rounded p-2 text-center">
                          <div className="text-xs text-gray-500">Home Value</div>
                          <div className="font-semibold text-gray-900">${(censusData.housing.medianValue / 1000).toFixed(0)}k</div>
                        </div>
                      </div>

                      {censusVerification.insights.length > 0 && (
                        <div className="space-y-1">
                          <div className="text-xs font-medium text-gray-700 mb-1">Verification Insights:</div>
                          {censusVerification.insights.map((insight, i) => (
                            <div key={i} className="flex items-start gap-2 text-xs text-gray-700 bg-white rounded p-2">
                              <Check className="w-3 h-3 text-green-600 mt-0.5 flex-shrink-0" />
                              <span>{insight.message}</span>
                            </div>
                          ))}
                        </div>
                      )}

                      {censusVerification.flags.length > 0 && (
                        <div className="mt-2 space-y-1">
                          <div className="text-xs font-medium text-gray-700 mb-1">Verification Flags:</div>
                          {censusVerification.flags.map((flag, i) => (
                            <div key={i} className={`flex items-start gap-2 text-xs rounded p-2 ${
                              flag.severity === 'high' ? 'bg-red-50 text-red-700' :
                              flag.severity === 'medium' ? 'bg-yellow-50 text-yellow-700' :
                              'bg-gray-50 text-gray-700'
                            }`}>
                              <AlertCircle className={`w-3 h-3 mt-0.5 flex-shrink-0 ${
                                flag.severity === 'high' ? 'text-red-600' :
                                flag.severity === 'medium' ? 'text-yellow-600' :
                                'text-gray-600'
                              }`} />
                              <span>[{flag.severity}] {flag.message}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {!censusLoading && !censusData && (
                  <div className="text-center py-4 text-sm text-red-600">
                    Failed to load Census data for ZIP {selectedStory.location.zip}
                  </div>
                )}
              </div>

              {/* EIA Energy Verification */}
              <div className="border-t pt-6">
                <div className="flex items-center gap-2 mb-3">
                  <Zap className="w-5 h-5 text-yellow-600" />
                  <div className="text-sm font-medium text-gray-700">EIA Energy Data Verification</div>
                </div>

                {eiaLoading && (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-600 mx-auto mb-3"></div>
                    <div className="text-sm text-gray-600">Fetching energy data for {selectedStory.location.state}...</div>
                  </div>
                )}

                {!eiaLoading && eiaData && eiaVerification && (
                  <div className="space-y-4">
                    <div className="bg-gradient-to-br from-yellow-50 to-orange-50 rounded-lg p-4 border border-yellow-200">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <div className="font-semibold text-gray-900">Energy Verification Score</div>
                          <div className="text-xs text-gray-600">Based on {eiaData.dataYear} EIA Data</div>
                        </div>
                        <div className="text-3xl font-bold text-yellow-600">{eiaVerification.confidence}%</div>
                      </div>

                      <div className="grid grid-cols-4 gap-3 mb-3">
                        <div className="bg-white rounded p-2 text-center">
                          <div className="text-xs text-gray-500">Electricity</div>
                          <div className="font-semibold text-gray-900">{eiaData.electricity.prices.residential}¢/kWh</div>
                        </div>
                        <div className="bg-white rounded p-2 text-center">
                          <div className="text-xs text-gray-500">Natural Gas</div>
                          <div className="font-semibold text-gray-900">${eiaData.naturalGas.prices.residential}/Mcf</div>
                        </div>
                        <div className="bg-white rounded p-2 text-center">
                          <div className="text-xs text-gray-500">Gasoline</div>
                          <div className="font-semibold text-gray-900">${eiaData.gasoline.price}/gal</div>
                        </div>
                        <div className="bg-white rounded p-2 text-center">
                          <div className="text-xs text-gray-500">Monthly Cost</div>
                          <div className="font-semibold text-gray-900">${eiaData.typicalHouseholdCosts.totalMonthlyEnergy}</div>
                        </div>
                      </div>

                      {eiaVerification.insights && eiaVerification.insights.length > 0 && (
                        <div className="space-y-1">
                          <div className="text-xs font-medium text-gray-700 mb-1">Energy Insights:</div>
                          {eiaVerification.insights.map((insight, i) => (
                            <div key={i} className="flex items-start gap-2 text-xs text-gray-700 bg-white rounded p-2">
                              <Zap className="w-3 h-3 text-yellow-600 mt-0.5 flex-shrink-0" />
                              <span>{insight.message}</span>
                            </div>
                          ))}
                        </div>
                      )}

                      <div className="mt-3 text-xs text-gray-600 border-t border-yellow-200 pt-2">
                        <strong>State:</strong> {eiaData.stateName} |
                        <strong className="ml-2">Annual Energy Costs:</strong> ${eiaData.typicalHouseholdCosts.annualEnergy}
                      </div>
                    </div>
                  </div>
                )}

                {!eiaLoading && !eiaData && (
                  <div className="text-center py-4 text-sm text-gray-500">
                    Energy data not available for {selectedStory.location.state}
                  </div>
                )}
              </div>

              {/* NCDC Climate Verification */}
              <div className="border-t pt-6">
                <div className="flex items-center gap-2 mb-3">
                  <Cloud className="w-5 h-5 text-blue-600" />
                  <div className="text-sm font-medium text-gray-700">NOAA Climate Data Verification</div>
                </div>

                {ncdcLoading && (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-3"></div>
                    <div className="text-sm text-gray-600">Fetching climate data for {selectedStory.location.state}...</div>
                  </div>
                )}

                {!ncdcLoading && ncdcData && ncdcVerification && (
                  <div className="space-y-4">
                    <div className="bg-gradient-to-br from-blue-50 to-sky-50 rounded-lg p-4 border border-blue-200">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <div className="font-semibold text-gray-900">Climate Verification Score</div>
                          <div className="text-xs text-gray-600">Based on {ncdcData.year} NOAA Data</div>
                        </div>
                        <div className="text-3xl font-bold text-blue-600">{ncdcVerification.confidence}%</div>
                      </div>

                      <div className="grid grid-cols-4 gap-3 mb-3">
                        <div className="bg-white rounded p-2 text-center">
                          <div className="text-xs text-gray-500">Avg Temp</div>
                          <div className="font-semibold text-gray-900">{ncdcData.temperature.annual}°F</div>
                        </div>
                        <div className="bg-white rounded p-2 text-center">
                          <div className="text-xs text-gray-500">Precipitation</div>
                          <div className="font-semibold text-gray-900">{ncdcData.precipitation.annual}"</div>
                        </div>
                        <div className="bg-white rounded p-2 text-center">
                          <div className="text-xs text-gray-500">Days &gt;90°F</div>
                          <div className="font-semibold text-gray-900">{ncdcData.temperature.daysAbove90}</div>
                        </div>
                        <div className="bg-white rounded p-2 text-center">
                          <div className="text-xs text-gray-500">Severe Events</div>
                          <div className="font-semibold text-gray-900">{ncdcData.severeWeather.events}/yr</div>
                        </div>
                      </div>

                      {ncdcVerification.insights && ncdcVerification.insights.length > 0 && (
                        <div className="space-y-1">
                          <div className="text-xs font-medium text-gray-700 mb-1">Climate Insights:</div>
                          {ncdcVerification.insights.map((insight, i) => (
                            <div key={i} className="flex items-start gap-2 text-xs text-gray-700 bg-white rounded p-2">
                              <Cloud className="w-3 h-3 text-blue-600 mt-0.5 flex-shrink-0" />
                              <span>{insight.message}</span>
                            </div>
                          ))}
                        </div>
                      )}

                      <div className="mt-3 text-xs text-gray-600 border-t border-blue-200 pt-2">
                        <strong>State:</strong> {ncdcData.stateName} |
                        <strong className="ml-2">Temp Trend:</strong> {ncdcData.trends.temperatureTrend} |
                        <strong className="ml-2">Precip Trend:</strong> {ncdcData.trends.precipitationTrend}
                      </div>
                    </div>
                  </div>
                )}

                {!ncdcLoading && !ncdcData && (
                  <div className="text-center py-4 text-sm text-gray-500">
                    Climate data not available for {selectedStory.location.state}
                  </div>
                )}
              </div>

              {/* HUD Housing Verification */}
              <div className="border-t pt-6">
                <div className="flex items-center gap-2 mb-3">
                  <Home className="w-5 h-5 text-purple-600" />
                  <div className="text-sm font-medium text-gray-700">HUD Housing Data Verification</div>
                </div>

                {hudLoading && (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto mb-3"></div>
                    <div className="text-sm text-gray-600">Fetching housing data for {selectedStory.location.state}...</div>
                  </div>
                )}

                {!hudLoading && hudData && hudVerification && (
                  <div className="space-y-4">
                    <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg p-4 border border-purple-200">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <div className="font-semibold text-gray-900">Housing Verification Score</div>
                          <div className="text-xs text-gray-600">Based on {hudData.year} HUD Data</div>
                        </div>
                        <div className="text-3xl font-bold text-purple-600">{hudVerification.confidence}%</div>
                      </div>

                      <div className="grid grid-cols-4 gap-3 mb-3">
                        <div className="bg-white rounded p-2 text-center">
                          <div className="text-xs text-gray-500">FMR 2BR</div>
                          <div className="font-semibold text-gray-900">${hudData.fairMarketRents.fmrRates.twoBedroom}</div>
                        </div>
                        <div className="bg-white rounded p-2 text-center">
                          <div className="text-xs text-gray-500">Median Income</div>
                          <div className="font-semibold text-gray-900">${(hudData.incomeLimits.incomeLimits.median / 1000).toFixed(0)}k</div>
                        </div>
                        <div className="bg-white rounded p-2 text-center">
                          <div className="text-xs text-gray-500">Rent Burden</div>
                          <div className="font-semibold text-gray-900">{hudData.affordabilityMetrics.rentBurdenRatio.toFixed(0)}%</div>
                        </div>
                        <div className="bg-white rounded p-2 text-center">
                          <div className="text-xs text-gray-500">Burden Level</div>
                          <div className={`font-semibold ${
                            hudData.affordabilityMetrics.housingCostBurden === 'High' ? 'text-red-600' :
                            hudData.affordabilityMetrics.housingCostBurden === 'Moderate' ? 'text-yellow-600' :
                            'text-green-600'
                          }`}>
                            {hudData.affordabilityMetrics.housingCostBurden}
                          </div>
                        </div>
                      </div>

                      {hudVerification.insights && hudVerification.insights.length > 0 && (
                        <div className="space-y-1">
                          <div className="text-xs font-medium text-gray-700 mb-1">Housing Insights:</div>
                          {hudVerification.insights.map((insight, i) => (
                            <div key={i} className="flex items-start gap-2 text-xs text-gray-700 bg-white rounded p-2">
                              <Home className="w-3 h-3 text-purple-600 mt-0.5 flex-shrink-0" />
                              <span>{insight.message}</span>
                            </div>
                          ))}
                        </div>
                      )}

                      {hudVerification.flags && hudVerification.flags.length > 0 && (
                        <div className="mt-2 space-y-1">
                          <div className="text-xs font-medium text-gray-700 mb-1">Housing Flags:</div>
                          {hudVerification.flags.map((flag, i) => (
                            <div key={i} className="flex items-start gap-2 text-xs bg-red-50 text-red-700 rounded p-2">
                              <AlertCircle className="w-3 h-3 text-red-600 mt-0.5 flex-shrink-0" />
                              <span>{flag}</span>
                            </div>
                          ))}
                        </div>
                      )}

                      <div className="mt-3 text-xs text-gray-600 border-t border-purple-200 pt-2">
                        <strong>State:</strong> {hudData.stateName} |
                        <strong className="ml-2">Affordable Rent (30% rule):</strong> ${hudData.affordabilityMetrics.affordableMonthlyRent.toFixed(0)}/mo |
                        <strong className="ml-2">Fair Market Rent:</strong> ${hudData.affordabilityMetrics.fairMarketRent2BR}/mo
                      </div>
                    </div>
                  </div>
                )}

                {!hudLoading && !hudData && (
                  <div className="text-center py-4 text-sm text-gray-500">
                    Housing data not available for {selectedStory.location.state}
                  </div>
                )}
              </div>

              {/* DOT Infrastructure Verification */}
              <div className="border-t pt-6">
                <div className="flex items-center gap-2 mb-3">
                  <Building className="w-5 h-5 text-cyan-600" />
                  <div className="text-sm font-medium text-gray-700">DOT Infrastructure Data Verification</div>
                </div>

                {dotLoading && (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-600 mx-auto mb-3"></div>
                    <div className="text-sm text-gray-600">Fetching infrastructure data for {selectedStory.location.state}...</div>
                  </div>
                )}

                {!dotLoading && dotData && dotVerification && (
                  <div className="space-y-4">
                    <div className="bg-gradient-to-br from-cyan-50 to-teal-50 rounded-lg p-4 border border-cyan-200">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <div className="font-semibold text-gray-900">Infrastructure Verification Score</div>
                          <div className="text-xs text-gray-600">Based on {dotData.year} DOT Data</div>
                        </div>
                        <div className="text-3xl font-bold text-cyan-600">{dotVerification.confidence}%</div>
                      </div>

                      <div className="grid grid-cols-4 gap-3 mb-3">
                        <div className="bg-white rounded p-2 text-center">
                          <div className="text-xs text-gray-500">Total Bridges</div>
                          <div className="font-semibold text-gray-900">{dotData.bridges.total.toLocaleString()}</div>
                        </div>
                        <div className="bg-white rounded p-2 text-center">
                          <div className="text-xs text-gray-500">Deficient</div>
                          <div className="font-semibold text-red-600">{dotData.bridges.deficientPercentage}%</div>
                        </div>
                        <div className="bg-white rounded p-2 text-center">
                          <div className="text-xs text-gray-500">Road Condition</div>
                          <div className="font-semibold text-gray-900">{dotData.roads.averageCondition}</div>
                        </div>
                        <div className="bg-white rounded p-2 text-center">
                          <div className="text-xs text-gray-500">Transit Systems</div>
                          <div className="font-semibold text-gray-900">{dotData.transit.systems}</div>
                        </div>
                      </div>

                      {dotVerification.insights && dotVerification.insights.length > 0 && (
                        <div className="space-y-1">
                          <div className="text-xs font-medium text-gray-700 mb-1">Infrastructure Insights:</div>
                          {dotVerification.insights.map((insight, i) => (
                            <div key={i} className="flex items-start gap-2 text-xs text-gray-700 bg-white rounded p-2">
                              <Building className="w-3 h-3 text-cyan-600 mt-0.5 flex-shrink-0" />
                              <span>{insight.message}</span>
                            </div>
                          ))}
                        </div>
                      )}

                      {dotVerification.flags && dotVerification.flags.length > 0 && (
                        <div className="mt-2 space-y-1">
                          <div className="text-xs font-medium text-gray-700 mb-1">Infrastructure Flags:</div>
                          {dotVerification.flags.map((flag, i) => (
                            <div key={i} className="flex items-start gap-2 text-xs bg-orange-50 text-orange-700 rounded p-2">
                              <AlertCircle className="w-3 h-3 text-orange-600 mt-0.5 flex-shrink-0" />
                              <span>{flag.replace(/_/g, ' ')}</span>
                            </div>
                          ))}
                        </div>
                      )}

                      <div className="mt-3 text-xs text-gray-600 border-t border-cyan-200 pt-2">
                        <strong>State:</strong> {dotData.stateName} |
                        <strong className="ml-2">Federal Funding:</strong> ${(dotData.funding.federalAnnual / 1000000).toFixed(0)}M/year |
                        <strong className="ml-2">Transit Riders:</strong> {(dotData.transit.ridersPerYear / 1000000).toFixed(1)}M/year
                      </div>
                    </div>
                  </div>
                )}

                {!dotLoading && !dotData && (
                  <div className="text-center py-4 text-sm text-gray-500">
                    Infrastructure data not available for {selectedStory.location.state}
                  </div>
                )}
              </div>

              {/* FEMA Emergency/Disaster Verification */}
              <div className="border-t pt-6">
                <div className="flex items-center gap-2 mb-3">
                  <AlertTriangle className="w-5 h-5 text-red-600" />
                  <div className="text-sm font-medium text-gray-700">FEMA Emergency & Disaster Verification</div>
                </div>

                {femaLoading && (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600 mx-auto mb-3"></div>
                    <div className="text-sm text-gray-600">Fetching disaster data for {selectedStory.location.state}...</div>
                  </div>
                )}

                {!femaLoading && femaData && femaVerification && (
                  <div className="space-y-4">
                    <div className="bg-gradient-to-br from-red-50 to-orange-50 rounded-lg p-4 border border-red-200">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <div className="font-semibold text-gray-900">Emergency Verification Score</div>
                          <div className="text-xs text-gray-600">Based on FEMA Disaster Declarations</div>
                        </div>
                        <div className="text-3xl font-bold text-red-600">{femaVerification.confidence}%</div>
                      </div>

                      <div className="grid grid-cols-4 gap-3 mb-3">
                        <div className="bg-white rounded p-2 text-center">
                          <div className="text-xs text-gray-500">Total Disasters</div>
                          <div className="font-semibold text-gray-900">{femaData.summary.totalDisasters}</div>
                        </div>
                        <div className="bg-white rounded p-2 text-center">
                          <div className="text-xs text-gray-500">Most Common</div>
                          <div className="font-semibold text-gray-900 text-xs">{femaData.summary.mostCommonDisasterType}</div>
                        </div>
                        <div className="bg-white rounded p-2 text-center">
                          <div className="text-xs text-gray-500">Assistance Recipients</div>
                          <div className="font-semibold text-gray-900">{(femaData.summary.housingAssistanceRecipients / 1000).toFixed(0)}k</div>
                        </div>
                        <div className="bg-white rounded p-2 text-center">
                          <div className="text-xs text-gray-500">Total Aid</div>
                          <div className="font-semibold text-gray-900">${(femaData.summary.totalAssistanceAmount / 1000000).toFixed(0)}M</div>
                        </div>
                      </div>

                      {femaVerification.insights && femaVerification.insights.length > 0 && (
                        <div className="space-y-1">
                          <div className="text-xs font-medium text-gray-700 mb-1">Emergency Insights:</div>
                          {femaVerification.insights.map((insight, i) => (
                            <div key={i} className="flex items-start gap-2 text-xs text-gray-700 bg-white rounded p-2">
                              <AlertTriangle className="w-3 h-3 text-red-600 mt-0.5 flex-shrink-0" />
                              <span>{insight.message}</span>
                            </div>
                          ))}
                        </div>
                      )}

                      {femaVerification.flags && femaVerification.flags.length > 0 && (
                        <div className="mt-2 space-y-1">
                          <div className="text-xs font-medium text-gray-700 mb-1">Emergency Flags:</div>
                          {femaVerification.flags.map((flag, i) => (
                            <div key={i} className="flex items-start gap-2 text-xs bg-red-100 text-red-800 rounded p-2">
                              <AlertCircle className="w-3 h-3 text-red-700 mt-0.5 flex-shrink-0" />
                              <span>{flag.replace(/_/g, ' ')}</span>
                            </div>
                          ))}
                        </div>
                      )}

                      <div className="mt-3 text-xs text-gray-600 border-t border-red-200 pt-2">
                        <strong>State:</strong> {femaData.stateName} |
                        <strong className="ml-2">Source:</strong> FEMA Open API (Real Data)
                      </div>
                    </div>
                  </div>
                )}

                {!femaLoading && !femaData && (
                  <div className="text-center py-4 text-sm text-gray-500">
                    Emergency data not available for {selectedStory.location.state}
                  </div>
                )}
              </div>

              {/* BJS NCVS Crime Victimization Verification */}
              <div className="border-t pt-6">
                <div className="flex items-center gap-2 mb-3">
                  <Shield className="w-5 h-5 text-red-600" />
                  <div className="text-sm font-medium text-gray-700">BJS Crime Victimization Data</div>
                </div>

                {ncvsLoading && (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600 mx-auto mb-3"></div>
                    <div className="text-sm text-gray-600">Fetching crime victimization data...</div>
                  </div>
                )}

                {!ncvsLoading && ncvsData && ncvsVerification && (
                  <div className="space-y-4">
                    <div className="bg-gradient-to-br from-red-50 to-orange-50 rounded-lg p-4 border border-red-200">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <div className="font-semibold text-gray-900">Crime Verification Score</div>
                          <div className="text-xs text-gray-600">Based on {ncvsData.year} NCVS Victim Survey Data</div>
                        </div>
                        <div className="text-3xl font-bold text-red-600">{ncvsVerification.confidence}%</div>
                      </div>

                      {ncvsVerification.crimeMetrics && ncvsVerification.crimeMetrics.dataAvailable && (
                        <div className="grid grid-cols-4 gap-3 mb-3">
                          <div className="bg-white rounded p-2 text-center">
                            <div className="text-xs text-gray-500">Total Victimizations</div>
                            <div className="font-semibold text-gray-900">{ncvsVerification.crimeMetrics.totalVictimizations.toLocaleString()}</div>
                          </div>
                          <div className="bg-white rounded p-2 text-center">
                            <div className="text-xs text-gray-500">Reported Rate</div>
                            <div className="font-semibold text-gray-900">{ncvsVerification.crimeMetrics.reportingRate}%</div>
                          </div>
                          <div className="bg-white rounded p-2 text-center">
                            <div className="text-xs text-gray-500">Unreported Rate</div>
                            <div className="font-semibold text-red-600">{ncvsVerification.crimeMetrics.unreportedRate}%</div>
                          </div>
                          <div className="bg-white rounded p-2 text-center">
                            <div className="text-xs text-gray-500">Data Year</div>
                            <div className="font-semibold text-gray-900">{ncvsVerification.crimeMetrics.year}</div>
                          </div>
                        </div>
                      )}

                      {ncvsVerification.insights && ncvsVerification.insights.length > 0 && (
                        <div className="space-y-1">
                          <div className="text-xs font-medium text-gray-700 mb-1">Crime Verification Insights:</div>
                          {ncvsVerification.insights.map((insight, i) => (
                            <div key={i} className="flex items-start gap-2 text-xs text-gray-700 bg-white rounded p-2">
                              <Shield className="w-3 h-3 text-red-600 mt-0.5 flex-shrink-0" />
                              <span>{insight.message}</span>
                            </div>
                          ))}
                        </div>
                      )}

                      {ncvsVerification.flags && ncvsVerification.flags.length > 0 && (
                        <div className="mt-2 space-y-1">
                          <div className="text-xs font-medium text-gray-700 mb-1">Crime Flags:</div>
                          {ncvsVerification.flags.map((flag, i) => (
                            <div key={i} className="flex items-start gap-2 text-xs bg-red-50 text-red-700 rounded p-2">
                              <AlertCircle className="w-3 h-3 text-red-600 mt-0.5 flex-shrink-0" />
                              <span>{flag}</span>
                            </div>
                          ))}
                        </div>
                      )}

                      <div className="mt-3 text-xs text-gray-600 border-t border-red-200 pt-2">
                        <strong>Source:</strong> BJS National Crime Victimization Survey (NCVS) |
                        <strong className="ml-2">Data Type:</strong> Victim-reported (includes unreported crimes) |
                        <strong className="ml-2">Critical Advantage:</strong> Captures crimes NOT reported to police
                      </div>
                    </div>
                  </div>
                )}

                {!ncvsLoading && !ncvsData && (
                  <div className="text-center py-4 text-sm text-gray-500">
                    Crime victimization data not available
                  </div>
                )}
              </div>

              {/* FEC Campaign Finance Verification (Election stories only) */}
              {selectedStory.policyArea === 'election' && (
                <div className="border-t pt-6">
                  <div className="flex items-center gap-2 mb-3">
                    <DollarSign className="w-5 h-5 text-green-600" />
                    <div className="text-sm font-medium text-gray-700">FEC Campaign Finance Data</div>
                  </div>

                {fecLoading && (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto mb-3"></div>
                    <div className="text-sm text-gray-600">Fetching campaign finance data for {selectedStory.location.state}...</div>
                  </div>
                )}

                {!fecLoading && fecData && fecVerification && (
                  <div className="space-y-4">
                    <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg p-4 border border-green-200">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <div className="font-semibold text-gray-900">Campaign Finance Verification Score</div>
                          <div className="text-xs text-gray-600">Based on 2024 FEC Election Cycle Data</div>
                        </div>
                        <div className="text-3xl font-bold text-green-600">{fecVerification.confidence}%</div>
                      </div>

                      {fecVerification.campaignFinanceMetrics && (
                        <div className="grid grid-cols-4 gap-3 mb-3">
                          <div className="bg-white rounded p-2 text-center">
                            <div className="text-xs text-gray-500">Candidates</div>
                            <div className="font-semibold text-gray-900">{fecVerification.campaignFinanceMetrics.candidatesFound}</div>
                          </div>
                          <div className="bg-white rounded p-2 text-center">
                            <div className="text-xs text-gray-500">Committees</div>
                            <div className="font-semibold text-gray-900">{fecVerification.campaignFinanceMetrics.committeesFound}</div>
                          </div>
                          <div className="bg-white rounded p-2 text-center">
                            <div className="text-xs text-gray-500">Contributions</div>
                            <div className="font-semibold text-gray-900">{fecVerification.campaignFinanceMetrics.contributionsFound.toLocaleString()}</div>
                          </div>
                          <div className="bg-white rounded p-2 text-center">
                            <div className="text-xs text-gray-500">Disbursements</div>
                            <div className="font-semibold text-gray-900">{fecVerification.campaignFinanceMetrics.disbursementsFound}</div>
                          </div>
                        </div>
                      )}

                      {fecVerification.insights && fecVerification.insights.length > 0 && (
                        <div className="space-y-1">
                          <div className="text-xs font-medium text-gray-700 mb-1">Campaign Finance Insights:</div>
                          {fecVerification.insights.map((insight, i) => (
                            <div key={i} className="flex items-start gap-2 text-xs text-gray-700 bg-white rounded p-2">
                              <DollarSign className="w-3 h-3 text-green-600 mt-0.5 flex-shrink-0" />
                              <span>{insight.message}</span>
                            </div>
                          ))}
                        </div>
                      )}

                      {fecVerification.flags && fecVerification.flags.length > 0 && (
                        <div className="mt-2 space-y-1">
                          <div className="text-xs font-medium text-gray-700 mb-1">Verification Flags:</div>
                          {fecVerification.flags.map((flag, i) => (
                            <div key={i} className={`flex items-start gap-2 text-xs rounded p-2 ${
                              flag.severity === 'high' ? 'bg-red-50 text-red-700' :
                              flag.severity === 'medium' ? 'bg-yellow-50 text-yellow-700' :
                              'bg-gray-50 text-gray-700'
                            }`}>
                              <AlertCircle className={`w-3 h-3 mt-0.5 flex-shrink-0 ${
                                flag.severity === 'high' ? 'text-red-600' :
                                flag.severity === 'medium' ? 'text-yellow-600' :
                                'text-gray-600'
                              }`} />
                              <span>[{flag.severity}] {flag.message}</span>
                            </div>
                          ))}
                        </div>
                      )}

                      <div className="mt-3 text-xs text-gray-600 border-t border-green-200 pt-2">
                        <strong>State:</strong> {fecData.state} |
                        <strong className="ml-2">Source:</strong> FEC OpenFEC API (Real Data) |
                        <strong className="ml-2">Cycle:</strong> 2024
                      </div>
                    </div>
                  </div>
                )}

                {!fecLoading && !fecData && (
                  <div className="text-center py-4 text-sm text-gray-500">
                    Campaign finance data not available for {selectedStory.location.state}
                  </div>
                )}
                </div>
              )}

              <div className="flex gap-3 pt-4">
                <button
                  onClick={handleGenerateCreativeBrief}
                  disabled={briefLoading}
                  className="flex-1 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {briefLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Generating...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      Generate Creative Brief
                    </>
                  )}
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

      {/* Submission Progress Modal */}
      {submissionProgress.show && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className={`rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden shadow-2xl transition-all duration-300 ${
            darkMode ? 'bg-gray-800' : 'bg-white'
          }`}>
            {/* Modal Header */}
            <div className={`p-6 border-b ${
              submissionProgress.stage === 'complete'
                ? 'bg-gradient-to-r from-green-50 to-blue-50'
                : 'bg-gradient-to-r from-blue-50 to-purple-50'
            } ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`rounded-lg p-2 ${
                    submissionProgress.stage === 'complete'
                      ? 'bg-green-600'
                      : 'bg-blue-600'
                  }`}>
                    {submissionProgress.stage === 'complete' ? (
                      <CheckCircle2 className="w-6 h-6 text-white" />
                    ) : (
                      <Clock className="w-6 h-6 text-white animate-pulse" />
                    )}
                  </div>
                  <div>
                    <h2 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                      {submissionProgress.stage === 'complete' ? 'Story Submitted!' : 'Processing Your Story...'}
                    </h2>
                    <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      {submissionProgress.stage === 'complete'
                        ? 'Thank you for sharing your experience'
                        : 'Please wait while we verify your story'}
                    </p>
                  </div>
                </div>
                {submissionProgress.stage === 'complete' && (
                  <button
                    onClick={() => setSubmissionProgress({ show: false, stage: '', progress: 0, steps: [], submittedStory: null })}
                    className="p-2 hover:bg-white rounded-md transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                )}
              </div>
            </div>

            {/* Modal Body */}
            <div className="overflow-y-auto max-h-[calc(90vh-200px)] p-6">
              {/* Progress Bar */}
              <div className="mb-6">
                <div className="flex justify-between items-center mb-2">
                  <span className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Progress
                  </span>
                  <span className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    {submissionProgress.progress}%
                  </span>
                </div>
                <div className={`w-full h-3 rounded-full overflow-hidden ${darkMode ? 'bg-gray-700' : 'bg-gray-200'}`}>
                  <div
                    className="h-full bg-gradient-to-r from-blue-600 to-green-600 transition-all duration-500 ease-out"
                    style={{ width: `${submissionProgress.progress}%` }}
                  />
                </div>
              </div>

              {/* Processing Steps */}
              <div className="space-y-3 mb-6">
                {submissionProgress.steps.map((step, index) => (
                  <div key={index} className={`flex items-start gap-3 p-3 rounded-lg ${
                    darkMode ? 'bg-gray-700/50' : 'bg-gray-50'
                  }`}>
                    <div className="mt-0.5">
                      {step.status === 'success' && (
                        <CheckCircle2 className="w-5 h-5 text-green-600" />
                      )}
                      {step.status === 'loading' && (
                        <Clock className="w-5 h-5 text-blue-600 animate-spin" />
                      )}
                      {step.status === 'warning' && (
                        <AlertTriangle className="w-5 h-5 text-yellow-600" />
                      )}
                      {step.status === 'error' && (
                        <X className="w-5 h-5 text-red-600" />
                      )}
                    </div>
                    <div className="flex-1">
                      <p className={`text-sm font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                        {step.text}
                      </p>
                      <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                        {step.timestamp.toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Success Content */}
              {submissionProgress.stage === 'complete' && submissionProgress.submittedStory && (
                <div className="space-y-6">
                  {/* Story Summary */}
                  <div className={`p-4 rounded-lg border ${
                    darkMode ? 'bg-gray-700/30 border-gray-600' : 'bg-blue-50 border-blue-200'
                  }`}>
                    <h3 className={`font-semibold mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                      Your Story
                    </h3>
                    <p className={`text-sm mb-3 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      {submissionProgress.submittedStory.story.substring(0, 200)}
                      {submissionProgress.submittedStory.story.length > 200 && '...'}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      <span className="inline-flex items-center gap-1 px-2 py-1 bg-white rounded-md text-xs">
                        <MapPin className="w-3 h-3" />
                        {submissionProgress.submittedStory.location.city}, {submissionProgress.submittedStory.location.state}
                      </span>
                      <span className="inline-flex items-center gap-1 px-2 py-1 bg-white rounded-md text-xs">
                        <FileText className="w-3 h-3" />
                        {policyAreas.find(p => p.id === submissionProgress.submittedStory.policyArea)?.name}
                      </span>
                      {submissionProgress.submittedStory.verificationScore > 0 && (
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-800 rounded-md text-xs font-medium">
                          <Shield className="w-3 h-3" />
                          {submissionProgress.submittedStory.verificationScore}% Verified
                        </span>
                      )}
                    </div>
                  </div>

                  {/* What Happens Next */}
                  <div className={`p-4 rounded-lg border ${
                    darkMode ? 'bg-gray-700/30 border-gray-600' : 'bg-purple-50 border-purple-200'
                  }`}>
                    <h3 className={`font-semibold mb-3 flex items-center gap-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                      <Sparkles className="w-5 h-5 text-purple-600" />
                      What Happens Next
                    </h3>
                    <div className="space-y-3">
                      <div className="flex gap-3">
                        <div className="flex-shrink-0 w-8 h-8 bg-purple-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                          1
                        </div>
                        <div>
                          <p className={`text-sm font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                            Ongoing Verification
                          </p>
                          <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                            Our AI continues to cross-reference your story with federal data sources for accuracy
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-3">
                        <div className="flex-shrink-0 w-8 h-8 bg-purple-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                          2
                        </div>
                        <div>
                          <p className={`text-sm font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                            Intelligence Dashboard
                          </p>
                          <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                            Your story is now visible to political campaigns and advocacy organizations
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-3">
                        <div className="flex-shrink-0 w-8 h-8 bg-purple-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                          3
                        </div>
                        <div>
                          <p className={`text-sm font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                            Real-World Impact
                          </p>
                          <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                            Your experience helps inform campaign messaging and policy advocacy
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            {submissionProgress.stage === 'complete' && (
              <div className={`p-6 border-t flex gap-3 ${darkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-gray-50'}`}>
                <button
                  onClick={() => {
                    setSubmissionProgress({ show: false, stage: '', progress: 0, steps: [], submittedStory: null });
                  }}
                  className="flex-1 px-4 py-2 bg-white text-gray-700 rounded-lg hover:bg-gray-100 transition-colors font-medium"
                >
                  Submit Another Story
                </button>
                <button
                  onClick={() => {
                    setSubmissionProgress({ show: false, stage: '', progress: 0, steps: [], submittedStory: null });
                    setActiveView('dashboard');
                  }}
                  className="flex-1 px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-colors font-medium"
                >
                  View Dashboard
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Creative Brief Modal */}
      {showBriefModal && creativeBrief && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-5xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            {/* Modal Header */}
            <div className="p-6 border-b flex items-center justify-between bg-gradient-to-r from-blue-50 to-purple-50">
              <div className="flex items-center gap-3">
                <div className="bg-blue-600 rounded-lg p-2">
                  <FileText className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Creative Brief Generated</h2>
                  <p className="text-sm text-gray-600">Story ID: {selectedStory?.id}</p>
                </div>
              </div>
              <button
                onClick={() => setShowBriefModal(false)}
                className="p-2 hover:bg-white rounded-md transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Action Buttons */}
            <div className="px-6 py-3 border-b bg-gray-50 flex gap-3">
              <button
                onClick={copyBriefToClipboard}
                className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 font-medium text-sm"
              >
                <Copy className="w-4 h-4" />
                Copy to Clipboard
              </button>
              <button
                onClick={downloadBrief}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium text-sm"
              >
                <FileDown className="w-4 h-4" />
                Download as Markdown
              </button>
              <div className="flex-1"></div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <CheckCircle2 className="w-4 h-4 text-green-600" />
                <span>Based on verified Census data</span>
              </div>
            </div>

            {/* Modal Content */}
            <div className="flex-1 overflow-y-auto p-6 bg-gray-50">
              <div className="prose prose-slate max-w-none prose-headings:font-bold prose-h1:text-3xl prose-h1:mb-6 prose-h1:mt-8 prose-h1:pb-3 prose-h1:border-b-2 prose-h1:border-blue-200 prose-h2:text-2xl prose-h2:mt-8 prose-h2:mb-4 prose-h2:text-blue-900 prose-h3:text-xl prose-h3:mt-6 prose-h3:mb-3 prose-h3:text-gray-800 prose-p:text-gray-700 prose-p:leading-relaxed prose-p:mb-4 prose-ul:my-4 prose-ul:space-y-2 prose-ol:my-4 prose-ol:space-y-2 prose-li:text-gray-700 prose-strong:text-gray-900 prose-strong:font-semibold prose-code:bg-gray-100 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-sm prose-code:text-gray-800 prose-pre:bg-gray-800 prose-pre:text-gray-100 prose-hr:my-8 prose-hr:border-gray-300 prose-blockquote:border-l-4 prose-blockquote:border-blue-500 prose-blockquote:bg-blue-50 prose-blockquote:py-2 prose-blockquote:px-4 prose-blockquote:my-4 prose-a:text-blue-600 prose-a:no-underline hover:prose-a:underline bg-white rounded-lg shadow-sm p-8">
                <ReactMarkdown
                  components={{
                    h1: ({node, ...props}) => <h1 className="text-3xl font-bold mb-6 mt-8 pb-3 border-b-2 border-blue-200 text-gray-900" {...props} />,
                    h2: ({node, ...props}) => <h2 className="text-2xl font-bold mt-8 mb-4 text-blue-900" {...props} />,
                    h3: ({node, ...props}) => <h3 className="text-xl font-semibold mt-6 mb-3 text-gray-800" {...props} />,
                    h4: ({node, ...props}) => <h4 className="text-lg font-semibold mt-4 mb-2 text-gray-700" {...props} />,
                    p: ({node, ...props}) => <p className="text-gray-700 leading-relaxed mb-4" {...props} />,
                    ul: ({node, ...props}) => <ul className="list-disc list-inside my-4 space-y-2 ml-4" {...props} />,
                    ol: ({node, ...props}) => <ol className="list-decimal list-inside my-4 space-y-2 ml-4" {...props} />,
                    li: ({node, ...props}) => <li className="text-gray-700 leading-relaxed" {...props} />,
                    strong: ({node, ...props}) => <strong className="font-semibold text-gray-900" {...props} />,
                    em: ({node, ...props}) => <em className="italic text-gray-800" {...props} />,
                    code: ({node, inline, ...props}) =>
                      inline
                        ? <code className="bg-gray-100 px-1.5 py-0.5 rounded text-sm text-gray-800 font-mono" {...props} />
                        : <code className="block bg-gray-800 text-gray-100 p-4 rounded-lg my-4 overflow-x-auto font-mono text-sm" {...props} />,
                    pre: ({node, ...props}) => <pre className="bg-gray-800 text-gray-100 p-4 rounded-lg my-4 overflow-x-auto" {...props} />,
                    hr: ({node, ...props}) => <hr className="my-8 border-t-2 border-gray-300" {...props} />,
                    blockquote: ({node, ...props}) => <blockquote className="border-l-4 border-blue-500 bg-blue-50 py-2 px-4 my-4 italic text-gray-700" {...props} />,
                    a: ({node, ...props}) => <a className="text-blue-600 hover:underline" {...props} />,
                  }}
                >
                  {creativeBrief}
                </ReactMarkdown>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t bg-gray-50 flex justify-between items-center">
              <div className="text-sm text-gray-600">
                Generated by Democratic Accountability Platform AI
              </div>
              <button
                onClick={() => setShowBriefModal(false)}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 font-medium"
              >
                Close
              </button>
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