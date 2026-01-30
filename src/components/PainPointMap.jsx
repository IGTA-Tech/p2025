import React, { useEffect, useRef, useState } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import {
  aggregateStoriesByZipCode,
  convertToGeoJSON,
  getColorByCount,
  filterStoriesByDate,
  getTopPolicyAreas,
  getMostActiveRegions
} from '../lib/mapUtils';
import { X, Calendar, Filter, MapPin } from 'lucide-react';

const PainPointMap = ({ stories = [], isPreview = false }) => {
  const mapContainer = useRef(null);
  const map = useRef(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedRegion, setSelectedRegion] = useState(null);
  const [dateFilter, setDateFilter] = useState('last30days');
  const [policyAreaFilter, setPolicyAreaFilter] = useState('all');
  const [filteredStories, setFilteredStories] = useState(stories);
  const [aggregatedData, setAggregatedData] = useState({});
  const [showFilters, setShowFilters] = useState(false);

  // Update filtered stories when filters change
  useEffect(() => {
    let filtered = [...stories];

    // Apply date filter
    filtered = filterStoriesByDate(filtered, dateFilter);

    // Apply policy area filter
    if (policyAreaFilter !== 'all') {
      filtered = filtered.filter(
        story => (story.policyArea || story.policy_area) === policyAreaFilter
      );
    }

    setFilteredStories(filtered);
  }, [stories, dateFilter, policyAreaFilter]);

  // Aggregate data when filtered stories change
  useEffect(() => {
    const aggregated = aggregateStoriesByZipCode(filteredStories);
    setAggregatedData(aggregated);
  }, [filteredStories]);

  // Initialize map
  useEffect(() => {
    if (map.current) return; // Initialize map only once

    map.current = new maplibregl.Map({
      container: mapContainer.current,
      style: 'https://demotiles.maplibre.org/style.json',
      center: [-98.5795, 39.8283], // Center of USA
      zoom: isPreview ? 3 : 4,
      pitch: 60, // 3D viewing angle
      bearing: -17.6,
      antialias: true
    });

    // Add navigation controls
    if (!isPreview) {
      map.current.addControl(new maplibregl.NavigationControl(), 'top-right');
    }

    map.current.on('load', () => {
      setIsLoading(false);
    });

    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, [isPreview]);

  // Update map data when aggregatedData changes
  useEffect(() => {
    if (!map.current || Object.keys(aggregatedData).length === 0) return;

    const geoJsonData = convertToGeoJSON(aggregatedData);

    // Wait for map to be loaded
    if (!map.current.loaded()) {
      map.current.once('load', () => updateMapData(geoJsonData));
    } else {
      updateMapData(geoJsonData);
    }
  }, [aggregatedData]);

  const updateMapData = (geoJsonData) => {
    // Remove existing layer and source if they exist
    if (map.current.getLayer('3d-pain-points')) {
      map.current.removeLayer('3d-pain-points');
    }
    if (map.current.getSource('pain-points')) {
      map.current.removeSource('pain-points');
    }

    // Add source
    map.current.addSource('pain-points', {
      type: 'geojson',
      data: geoJsonData
    });

    // Add 3D extrusion layer
    map.current.addLayer({
      id: '3d-pain-points',
      type: 'fill-extrusion',
      source: 'pain-points',
      paint: {
        'fill-extrusion-color': [
          'interpolate',
          ['linear'],
          ['get', 'story_count'],
          0, '#10b981',   // Green
          4, '#fbbf24',   // Yellow
          8, '#ef4444'    // Red
        ],
        'fill-extrusion-height': ['*', ['get', 'story_count'], 500],
        'fill-extrusion-base': 0,
        'fill-extrusion-opacity': 0.8
      }
    });

    // Add click handler
    map.current.on('click', '3d-pain-points', (e) => {
      if (e.features.length > 0) {
        const feature = e.features[0];
        setSelectedRegion(feature.properties);
      }
    });

    // Change cursor on hover
    map.current.on('mouseenter', '3d-pain-points', () => {
      map.current.getCanvas().style.cursor = 'pointer';
    });

    map.current.on('mouseleave', '3d-pain-points', () => {
      map.current.getCanvas().style.cursor = '';
    });
  };

  // Get unique policy areas from stories
  const policyAreas = [...new Set(stories.map(s => s.policyArea || s.policy_area))].filter(Boolean);

  const topPolicyAreas = getTopPolicyAreas(aggregatedData);
  const mostActiveRegions = getMostActiveRegions(aggregatedData, 5);
  const totalStories = filteredStories.length;

  return (
    <div className={`relative ${isPreview ? 'h-96' : 'h-screen'} w-full`}>
      {/* Loading State */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-900 bg-opacity-75 z-50">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mb-4"></div>
            <p className="text-white">Loading Pain Point Map...</p>
          </div>
        </div>
      )}

      {/* Map Container */}
      <div ref={mapContainer} className="absolute inset-0" />

      {/* Controls Overlay - Only show in full view */}
      {!isPreview && (
        <div className="absolute top-4 left-4 z-10 space-y-4">
          {/* Filter Toggle Button */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="glass-card px-4 py-2 flex items-center gap-2 hover:bg-opacity-20"
          >
            <Filter className="w-4 h-4" />
            <span className="font-semibold">Filters</span>
          </button>

          {/* Filter Panel */}
          {showFilters && (
            <div className="glass-card p-4 space-y-4 w-64">
              {/* Date Range Filter */}
              <div>
                <label className="flex items-center gap-2 text-sm font-semibold mb-2">
                  <Calendar className="w-4 h-4" />
                  Date Range
                </label>
                <select
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value)}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm"
                >
                  <option value="last7days">Last 7 Days</option>
                  <option value="last30days">Last 30 Days</option>
                  <option value="last90days">Last 90 Days</option>
                </select>
              </div>

              {/* Policy Area Filter */}
              <div>
                <label className="flex items-center gap-2 text-sm font-semibold mb-2">
                  <MapPin className="w-4 h-4" />
                  Policy Area
                </label>
                <select
                  value={policyAreaFilter}
                  onChange={(e) => setPolicyAreaFilter(e.target.value)}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm"
                >
                  <option value="all">All Areas</option>
                  {policyAreas.map(area => (
                    <option key={area} value={area}>{area}</option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* Data Summary Panel */}
          <div className="glass-card p-4 space-y-3 w-64">
            <h3 className="font-bold text-sm uppercase tracking-wide">Data Summary</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-400">Total Stories:</span>
                <span className="font-bold text-blue-400">{totalStories}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Active Regions:</span>
                <span className="font-bold text-green-400">{Object.keys(aggregatedData).length}</span>
              </div>
            </div>

            {/* Top Policy Areas */}
            {topPolicyAreas.length > 0 && (
              <div className="pt-3 border-t border-gray-700">
                <h4 className="font-semibold text-xs uppercase mb-2">Top Issues</h4>
                <div className="space-y-1">
                  {topPolicyAreas.slice(0, 3).map(({ area, count }) => (
                    <div key={area} className="flex justify-between text-xs">
                      <span className="text-gray-400 capitalize">{area}</span>
                      <span className="font-semibold">{count}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Most Active Regions */}
            {mostActiveRegions.length > 0 && (
              <div className="pt-3 border-t border-gray-700">
                <h4 className="font-semibold text-xs uppercase mb-2">Hot Spots</h4>
                <div className="space-y-1">
                  {mostActiveRegions.map((region) => (
                    <div key={region.zip_code} className="flex justify-between text-xs">
                      <span className="text-gray-400">{region.city}, {region.state}</span>
                      <span className="font-semibold text-red-400">{region.story_count}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="pt-3 border-t border-gray-700 text-xs text-gray-500">
              Last updated: {new Date().toLocaleTimeString()}
            </div>
          </div>
        </div>
      )}

      {/* Legend - Bottom Right */}
      <div className="absolute bottom-4 right-4 z-10 glass-card p-4">
        <h4 className="font-bold text-sm mb-3">Story Volume</h4>
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="w-6 h-4 bg-green-500 rounded"></div>
            <span className="text-xs">Minor (1-3)</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-6 h-4 bg-yellow-500 rounded"></div>
            <span className="text-xs">Moderate (4-7)</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-6 h-4 bg-red-500 rounded"></div>
            <span className="text-xs">Critical (8+)</span>
          </div>
        </div>
        <p className="text-xs text-gray-400 mt-3">Height = story count</p>
      </div>

      {/* Region Detail Popup */}
      {selectedRegion && (
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50 glass-card p-6 max-w-md w-full max-h-96 overflow-y-auto">
          <button
            onClick={() => setSelectedRegion(null)}
            className="absolute top-4 right-4 text-gray-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>

          <h3 className="text-xl font-bold mb-2">
            {selectedRegion.city}, {selectedRegion.state}
          </h3>
          <p className="text-sm text-gray-400 mb-4">ZIP: {selectedRegion.zip_code}</p>

          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="bg-gray-800 rounded-lg p-3">
              <div className="text-2xl font-bold text-blue-400">{selectedRegion.story_count}</div>
              <div className="text-xs text-gray-400">Total Stories</div>
            </div>
            <div className="bg-gray-800 rounded-lg p-3">
              <div className="text-lg font-bold text-purple-400 capitalize">{selectedRegion.dominant_policy_area}</div>
              <div className="text-xs text-gray-400">Top Issue</div>
            </div>
          </div>

          {/* Policy Areas Breakdown */}
          <div className="mb-4">
            <h4 className="font-semibold text-sm mb-2">Issues Breakdown</h4>
            <div className="space-y-1">
              {Object.entries(JSON.parse(selectedRegion.policy_areas)).map(([area, count]) => (
                <div key={area} className="flex justify-between text-sm">
                  <span className="capitalize text-gray-300">{area}</span>
                  <span className="font-semibold">{count}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Stories */}
          <div>
            <h4 className="font-semibold text-sm mb-2">Recent Stories</h4>
            <div className="space-y-3">
              {JSON.parse(selectedRegion.recent_stories).slice(0, 2).map((story, idx) => (
                <div key={idx} className="bg-gray-800 rounded-lg p-3 text-sm">
                  <p className="font-semibold mb-1">{story.headline}</p>
                  <p className="text-gray-400 text-xs line-clamp-2">{story.story}</p>
                </div>
              ))}
            </div>
          </div>

          <button className="w-full mt-4 gradient-bg text-white py-2 px-4 rounded-lg font-semibold hover:opacity-90">
            View All Stories
          </button>
        </div>
      )}
    </div>
  );
};

export default PainPointMap;
