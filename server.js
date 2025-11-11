import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Enable CORS for the Vite dev server
app.use(cors({
  origin: ['http://localhost:5173', 'http://148.230.81.154:5173'],
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
        model: 'claude-sonnet-4-5-20250929',
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

app.listen(PORT, '0.0.0.0', () => {
  console.log(`API server running on http://0.0.0.0:${PORT}`);
  console.log(`Anthropic API key configured: ${!!process.env.VITE_ANTHROPIC_API_KEY}`);
});
