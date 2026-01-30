import React, { useState, useEffect, useCallback } from 'react';
import { Video, Play, Loader2, CheckCircle2, AlertCircle, Download, RefreshCw, Clock, DollarSign } from 'lucide-react';
import {
  generateVideoFromText,
  getVideoStatus,
  getEstimatedCost,
  validateVideoParams,
  VideoStatus,
} from '../services/videoGenerationAI';

/**
 * VideoGenerator Component
 * Generates AI-powered campaign videos from story prompts using Kling 2.6
 */
export default function VideoGenerator({ story = null, onVideoGenerated = null }) {
  // Form state
  const [prompt, setPrompt] = useState('');
  const [duration, setDuration] = useState(10);
  const [resolution, setResolution] = useState('720p');
  const [aspectRatio, setAspectRatio] = useState('16:9');

  // Generation state
  const [isGenerating, setIsGenerating] = useState(false);
  const [taskId, setTaskId] = useState(null);
  const [status, setStatus] = useState(null);
  const [videoUrl, setVideoUrl] = useState(null);
  const [error, setError] = useState(null);
  const [progress, setProgress] = useState(0);

  // Pre-fill prompt from story if provided
  useEffect(() => {
    if (story) {
      const storyPrompt = buildPromptFromStory(story);
      setPrompt(storyPrompt);
    }
  }, [story]);

  // Build a compelling prompt from a citizen story
  function buildPromptFromStory(storyData) {
    const location = storyData.location || {};
    const city = location.city || 'a local community';
    const state = location.state || '';

    return `Documentary-style campaign video. Scene: ${city}${state ? `, ${state}` : ''}.

${storyData.headline}

Show: Authentic community scenes, local landmarks, everyday citizens affected by policy changes.
Emotion: Genuine concern mixed with determination for change.
Audio: Ambient community sounds, subtle emotional music, professional narration quality.

Visual elements: Community gathering spaces, families, local businesses. Cinematic lighting, warm tones.`;
  }

  // Poll for video completion
  const pollStatus = useCallback(async (id) => {
    try {
      const result = await getVideoStatus(id);
      setStatus(result.status);
      setProgress(result.progress || 0);

      if (result.status === VideoStatus.COMPLETED) {
        setVideoUrl(result.videoUrl);
        setIsGenerating(false);
        if (onVideoGenerated) {
          onVideoGenerated(result);
        }
      } else if (result.status === VideoStatus.FAILED) {
        setError(result.error || 'Video generation failed');
        setIsGenerating(false);
      } else {
        // Continue polling
        setTimeout(() => pollStatus(id), 5000);
      }
    } catch (err) {
      setError(err.message);
      setIsGenerating(false);
    }
  }, [onVideoGenerated]);

  // Handle form submission
  const handleGenerate = async () => {
    // Validate inputs
    const validation = validateVideoParams({ prompt, duration, resolution });
    if (!validation.valid) {
      setError(validation.errors.join('. '));
      return;
    }

    setIsGenerating(true);
    setError(null);
    setVideoUrl(null);
    setProgress(0);
    setStatus('pending');

    try {
      const result = await generateVideoFromText({
        prompt,
        duration,
        resolution,
        aspectRatio,
      });

      setTaskId(result.taskId);

      // Start polling for completion
      setTimeout(() => pollStatus(result.taskId), 3000);
    } catch (err) {
      setError(err.message);
      setIsGenerating(false);
    }
  };

  // Reset form
  const handleReset = () => {
    setTaskId(null);
    setStatus(null);
    setVideoUrl(null);
    setError(null);
    setProgress(0);
    setIsGenerating(false);
  };

  // Get cost estimate
  const cost = getEstimatedCost(duration, resolution);

  return (
    <div className="bg-white rounded-lg shadow-sm border p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="bg-purple-100 rounded-full p-2">
          <Video className="w-6 h-6 text-purple-600" />
        </div>
        <div>
          <h3 className="font-semibold text-lg text-gray-900">AI Video Generator</h3>
          <p className="text-sm text-gray-600">Generate campaign videos with native audio using Kling 2.6</p>
        </div>
      </div>

      {/* Error display */}
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <div className="font-medium text-red-800">Generation Error</div>
            <div className="text-sm text-red-700">{error}</div>
          </div>
        </div>
      )}

      {/* Video result display */}
      {videoUrl && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center gap-2 mb-3">
            <CheckCircle2 className="w-5 h-5 text-green-600" />
            <span className="font-medium text-green-800">Video Generated Successfully</span>
          </div>
          <div className="aspect-video bg-black rounded-lg overflow-hidden mb-3">
            <video
              src={videoUrl}
              controls
              className="w-full h-full"
              poster="/video-placeholder.png"
            >
              Your browser does not support video playback.
            </video>
          </div>
          <div className="flex items-center gap-3">
            <a
              href={videoUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2 text-sm font-medium"
            >
              <Download className="w-4 h-4" />
              Download Video
            </a>
            <button
              onClick={handleReset}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 flex items-center gap-2 text-sm font-medium"
            >
              <RefreshCw className="w-4 h-4" />
              Generate Another
            </button>
          </div>
        </div>
      )}

      {/* Generation in progress */}
      {isGenerating && !videoUrl && (
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center gap-3 mb-3">
            <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
            <span className="font-medium text-blue-800">
              {status === 'pending' ? 'Queued for processing...' : 'Generating video...'}
            </span>
          </div>
          <div className="w-full bg-blue-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-500"
              style={{ width: `${Math.max(5, progress)}%` }}
            />
          </div>
          <div className="mt-2 text-sm text-blue-700">
            Estimated time: 1-3 minutes for {duration}s video
          </div>
        </div>
      )}

      {/* Form */}
      {!isGenerating && !videoUrl && (
        <div className="space-y-4">
          {/* Prompt textarea */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Video Description
            </label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              rows={5}
              placeholder="Describe the video you want to generate. Include scene details, emotions, visual elements, and audio preferences..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
            />
            <div className="mt-1 text-xs text-gray-500">
              {prompt.length}/5000 characters
            </div>
          </div>

          {/* Duration and Resolution */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Duration
              </label>
              <select
                value={duration}
                onChange={(e) => setDuration(Number(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500"
              >
                <option value={5}>5 seconds</option>
                <option value={10}>10 seconds</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Resolution
              </label>
              <select
                value={resolution}
                onChange={(e) => setResolution(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500"
              >
                <option value="720p">720p (HD)</option>
                <option value="1080p">1080p (Full HD)</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Aspect Ratio
              </label>
              <select
                value={aspectRatio}
                onChange={(e) => setAspectRatio(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500"
              >
                <option value="16:9">16:9 (Landscape)</option>
                <option value="9:16">9:16 (Portrait/Stories)</option>
              </select>
            </div>
          </div>

          {/* Cost and Generate button */}
          <div className="flex items-center justify-between pt-4 border-t">
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-1 text-gray-600">
                <Clock className="w-4 h-4" />
                <span>{duration}s video</span>
              </div>
              <div className="flex items-center gap-1 text-green-600 font-medium">
                <DollarSign className="w-4 h-4" />
                <span>Est. cost: {cost.formatted}</span>
              </div>
            </div>
            <button
              onClick={handleGenerate}
              disabled={!prompt.trim() || prompt.length < 10}
              className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center gap-2 font-medium"
            >
              <Play className="w-4 h-4" />
              Generate Video
            </button>
          </div>
        </div>
      )}

      {/* Info box */}
      <div className="mt-6 p-4 bg-gray-50 rounded-lg">
        <div className="text-sm text-gray-700">
          <strong>About AI Video Generation:</strong>
          <ul className="mt-2 space-y-1 list-disc list-inside text-gray-600">
            <li>Videos include native audio with lip-sync capability</li>
            <li>Supports documentary, testimonial, and news-style formats</li>
            <li>Generation takes 1-3 minutes depending on duration</li>
            <li>Videos are stored for 14 days after generation</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
