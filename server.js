import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Enable CORS for all origins (allows access from any frontend)
app.use(cors({
  origin: true,
  credentials: true
}));

app.use(express.json());

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'API server is running' });
});

// Proxy endpoint for Anthropic API
app.post('/api/generate-creative-brief', async (req, res) => {
  try {
    const { prompt } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    const ANTHROPIC_API_KEY = process.env.VITE_ANTHROPIC_API_KEY;

    if (!ANTHROPIC_API_KEY) {
      return res.status(500).json({
        error: 'Anthropic API key not configured on server',
        useMock: true
      });
    }

    console.log('Calling Anthropic API...');

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
        'anthropic-beta': 'prompt-caching-2024-07-31',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 8192,
        temperature: 0.7,
        system: [
          {
            type: 'text',
            text: 'You are a document generation system. Generate complete documents without any conversational text, questions, or meta-commentary. Never ask if the user wants you to continue - always generate the complete document in one response.',
            cache_control: { type: 'ephemeral' }
          }
        ],
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: prompt,
                cache_control: { type: 'ephemeral' }
              }
            ]
          },
        ],
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('Anthropic API error:', error);
      return res.status(response.status).json({
        error: error.error?.message || 'Anthropic API request failed',
        useMock: true
      });
    }

    const data = await response.json();
    const briefContent = data.content[0].text;

    console.log('Successfully generated creative brief');
    res.json({ brief: briefContent });

  } catch (error) {
    console.error('Error in generate-creative-brief endpoint:', error);
    res.status(500).json({
      error: error.message || 'Internal server error',
      useMock: true
    });
  }
});

// Story generation endpoint for automated story generator
app.post('/api/generate-story', async (req, res) => {
  try {
    const { prompt } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    const ANTHROPIC_API_KEY = process.env.VITE_ANTHROPIC_API_KEY;

    if (!ANTHROPIC_API_KEY) {
      return res.status(500).json({
        error: 'Anthropic API key not configured on server',
        useMock: true
      });
    }

    console.log('Generating story with Claude...');

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1024,
        temperature: 0.8, // Higher for creative variation
        system: 'You are a story generation system for a democratic accountability platform. Generate realistic first-person citizen narratives based on recent policy news. Always output valid JSON only - no markdown, no explanation, just the JSON object.',
        messages: [
          {
            role: 'user',
            content: prompt
          },
        ],
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('Anthropic API error:', error);
      return res.status(response.status).json({
        error: error.error?.message || 'Anthropic API request failed',
        useMock: true
      });
    }

    const data = await response.json();
    const storyContent = data.content[0].text;

    console.log('Successfully generated story');
    res.json({ story: storyContent });

  } catch (error) {
    console.error('Error in generate-story endpoint:', error);
    res.status(500).json({
      error: error.message || 'Internal server error',
      useMock: true
    });
  }
});

// ============================================================
// Kie.ai Video Generation API Proxy (Kling 2.6)
// ============================================================

const KIE_API_BASE = 'https://api.kie.ai/api/v1';

/**
 * Create a video generation task
 * POST /api/video/generate
 */
app.post('/api/video/generate', async (req, res) => {
  try {
    const { prompt, duration, resolution, aspectRatio, mode, imageUrl } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    const KIE_API_KEY = process.env.VITE_KIE_API_KEY;

    if (!KIE_API_KEY) {
      // Return mock response for testing without API key
      console.log('Kie.ai API key not configured, returning mock response');
      return res.json({
        taskId: `mock_${Date.now()}`,
        status: 'pending',
        message: 'Mock video generation started (API key not configured)',
        mock: true,
      });
    }

    // Determine model based on mode (Kling 2.6 for higher quality)
    const model = mode === 'image-to-video'
      ? 'kling-2.6/image-to-video'
      : 'kling-2.6/text-to-video';

    // Build request input for Kling 2.6
    const input = {
      prompt,
      duration: String(duration || 10),
      sound: true,  // Enable audio generation for better voiceover
      aspect_ratio: aspectRatio || '16:9',
    };

    // Add image URL for image-to-video mode
    if (mode === 'image-to-video' && imageUrl) {
      input.image_url = imageUrl;
    }

    console.log(`Creating Kling 2.6 ${mode} task...`, { model, duration: input.duration, resolution: input.resolution });

    const response = await fetch(`${KIE_API_BASE}/jobs/createTask`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${KIE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        input,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('Kie.ai API error:', response.status, errorData);
      return res.status(response.status).json({
        error: errorData.msg || errorData.message || `Kie.ai API error: ${response.status}`,
      });
    }

    const data = await response.json();
    console.log('Kie.ai task created:', data);

    // Check for API-level errors (Kie.ai returns 200 with error codes in body)
    if (data.code && data.code !== 200) {
      console.error('Kie.ai API error:', data.code, data.msg);
      return res.status(data.code === 402 ? 402 : 400).json({
        error: data.msg || `Kie.ai error: ${data.code}`,
        code: data.code,
      });
    }

    const taskId = data.data?.taskId || data.taskId;
    if (!taskId) {
      console.error('Kie.ai response missing taskId:', data);
      return res.status(500).json({
        error: 'No task ID returned from video generation API',
      });
    }

    res.json({
      taskId,
      status: 'pending',
      message: 'Video generation started',
    });

  } catch (error) {
    console.error('Error creating video generation task:', error);
    res.status(500).json({
      error: error.message || 'Failed to create video generation task',
    });
  }
});

/**
 * Get video generation task status
 * GET /api/video/status/:taskId
 */
app.get('/api/video/status/:taskId', async (req, res) => {
  try {
    const { taskId } = req.params;

    if (!taskId) {
      return res.status(400).json({ error: 'Task ID is required' });
    }

    // Handle mock task IDs
    if (taskId.startsWith('mock_')) {
      // Simulate completion after 10 seconds
      const createdAt = parseInt(taskId.split('_')[1]);
      const elapsed = Date.now() - createdAt;

      if (elapsed < 10000) {
        return res.json({
          taskId,
          status: 'processing',
          progress: Math.min(90, Math.floor(elapsed / 100)),
          mock: true,
        });
      }

      return res.json({
        taskId,
        status: 'completed',
        videoUrl: 'https://example.com/mock-video.mp4',
        message: 'Mock video completed (API key not configured)',
        mock: true,
      });
    }

    const KIE_API_KEY = process.env.VITE_KIE_API_KEY;

    if (!KIE_API_KEY) {
      return res.status(500).json({ error: 'Kie.ai API key not configured' });
    }

    console.log(`Checking status for task: ${taskId}`);

    const response = await fetch(`${KIE_API_BASE}/jobs/recordInfo?taskId=${taskId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${KIE_API_KEY}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('Kie.ai status API error:', response.status, errorData);
      return res.status(response.status).json({
        error: errorData.msg || errorData.message || `Kie.ai API error: ${response.status}`,
      });
    }

    const data = await response.json();
    console.log('Kie.ai task status:', JSON.stringify(data, null, 2));

    // Map Kie.ai status to our status format
    const taskData = data.data || data;
    let status = 'processing';
    let videoUrl = null;
    let errorMsg = null;

    // Kie.ai uses 'state' not 'status'
    const kieState = taskData.state || taskData.status;

    if (kieState === 'success' || kieState === 'completed') {
      status = 'completed';
      // Video URL is in resultJson as a JSON string
      if (taskData.resultJson) {
        try {
          const result = JSON.parse(taskData.resultJson);
          videoUrl = result.resultUrls?.[0] || result.video_url || result.url;
        } catch (e) {
          console.error('Failed to parse resultJson:', e);
        }
      }
      // Fallback to other possible locations
      if (!videoUrl) {
        videoUrl = taskData.output?.video_url || taskData.videoUrl || taskData.output?.url;
      }
    } else if (kieState === 'failed' || kieState === 'error') {
      status = 'failed';
      errorMsg = taskData.failMsg || taskData.error || 'Video generation failed';
    } else if (kieState === 'pending' || kieState === 'queued') {
      status = 'pending';
    }

    res.json({
      taskId,
      status,
      videoUrl,
      progress: taskData.progress || null,
      error: errorMsg,
    });

  } catch (error) {
    console.error('Error checking video status:', error);
    res.status(500).json({
      error: error.message || 'Failed to check video status',
    });
  }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`API server running on http://0.0.0.0:${PORT}`);
  console.log(`Anthropic API key configured: ${!!process.env.VITE_ANTHROPIC_API_KEY}`);
  console.log(`Kie.ai API key configured: ${!!process.env.VITE_KIE_API_KEY}`);
});
