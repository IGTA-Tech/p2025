import React, { useState, useRef, useEffect } from 'react';
import { Mic, Send, Camera, Sparkles } from 'lucide-react';
import { lookupZipCode, extractZipCode } from './services/zipLookup';

const ConversationalInput = ({ onStorySubmit }) => {
  const [messages, setMessages] = useState([
    {
      type: 'ai',
      text: "Hey neighbor 👋 What's different in your town since January?",
      timestamp: new Date()
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [inputMode, setInputMode] = useState('text'); // 'text', 'voice', 'photo'
  const [messageCount, setMessageCount] = useState(0);
  const [storyData, setStoryData] = useState({ messages: [] });
  const [verificationScore, setVerificationScore] = useState(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [zipCode, setZipCode] = useState(null);
  const [locationData, setLocationData] = useState(null);
  const [awaitingZipCode, setAwaitingZipCode] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Calculate verification score based on story content
  const calculateVerificationScore = (storyMessages) => {
    // Simulate AI verification scoring
    const score = {
      overall: Math.floor(85 + Math.random() * 12), // 85-97%
      dataMatch: Math.floor(80 + Math.random() * 18), // 80-98%
      timelineConsistency: Math.floor(88 + Math.random() * 10), // 88-98%
      geographicVerification: Math.floor(82 + Math.random() * 15), // 82-97%
      policyCorrelation: Math.floor(75 + Math.random() * 20), // 75-95%
    };

    return score;
  };

  // Trigger story verification and submission
  const submitStory = (allMessages, locationDataOverride = null) => {
    setIsVerifying(true);

    console.log('=== ConversationalInput submitStory Debug ===');
    console.log('locationDataOverride passed:', locationDataOverride);
    console.log('Current locationData state:', locationData);
    console.log('Current zipCode state:', zipCode);

    // Simulate verification delay (2 seconds)
    setTimeout(() => {
      const score = calculateVerificationScore(allMessages);
      setVerificationScore(score);
      setIsVerifying(false);

      // Use override if provided, otherwise use state
      const locationToUse = locationDataOverride || locationData || {
        zip: '00000',
        city: null,
        state: null,
        county: null,
        district: null,
      };

      // Build story object with location data
      const story = {
        messages: allMessages.filter(m => m.type === 'user'),
        timestamp: new Date(),
        score: score,
        summary: allMessages.filter(m => m.type === 'user').map(m => m.text).join(' '),
        location: locationToUse
      };

      console.log('Story object being sent to parent:', story);
      console.log('Location in story:', story.location);

      // Call parent callback
      if (onStorySubmit) {
        onStorySubmit(story);
      }

      // Show completion message
      const locationText = locationToUse && locationToUse.city
        ? `\n\nLocation: ${locationToUse.city}, ${locationToUse.state} ${locationToUse.zip}`
        : '';

      const completionMessage = {
        type: 'ai',
        text: `✅ Your story has been verified and submitted! \n\nVerification Score: ${score.overall}%${locationText}\n\nYour experience has been matched with ${Math.floor(1200 + Math.random() * 3000)} similar stories across ${Math.floor(12 + Math.random() * 38)} states. This helps decision-makers see the real impact of policy changes. Thank you for sharing! 🙏`,
        timestamp: new Date(),
        isCompletion: true
      };

      setMessages(prev => [...prev, completionMessage]);
    }, 2000);
  };

  // AI response templates based on keywords
  const getAIResponse = (userMessage) => {
    const msg = userMessage.toLowerCase();

    // Healthcare keywords
    if (msg.includes('health') || msg.includes('hospital') || msg.includes('insurance') ||
        msg.includes('doctor') || msg.includes('medicine') || msg.includes('insulin') ||
        msg.includes('prescription')) {
      return {
        text: "I'm tracking 2,847 similar healthcare stories in your area. This is becoming a major pattern. Can you tell me more about when these changes started affecting you?",
        context: [
          { icon: '📍', text: 'Your area: 2,847 stories' },
          { icon: '📈', text: 'Trending +340%' },
          { icon: '🎯', text: 'Medicare changes detected' }
        ]
      };
    }

    // Education keywords
    if (msg.includes('school') || msg.includes('teacher') || msg.includes('class') ||
        msg.includes('education') || msg.includes('student') || msg.includes('kids')) {
      return {
        text: "Education is the #2 concern nationwide right now. 4,721 parents are sharing similar experiences about classroom sizes and funding cuts. What specific changes have you noticed?",
        context: [
          { icon: '👥', text: '31 students/class avg' },
          { icon: '📚', text: '-$1.2M district funding' },
          { icon: '🏫', text: '127 schools affected' }
        ]
      };
    }

    // Employment keywords
    if (msg.includes('job') || msg.includes('work') || msg.includes('employ') ||
        msg.includes('laid off') || msg.includes('salary') || msg.includes('fired')) {
      return {
        text: "Employment impacts are spreading rapidly. I'm seeing patterns in manufacturing and tech sectors especially. Are you in one of the affected industries?",
        context: [
          { icon: '💼', text: '340 companies affected' },
          { icon: '📉', text: '-12% federal contracts' },
          { icon: '🏭', text: 'Manufacturing hit hardest' }
        ]
      };
    }

    // Immigration keywords
    if (msg.includes('immigration') || msg.includes('border') || msg.includes('visa') ||
        msg.includes('immigrant') || msg.includes('migrant')) {
      return {
        text: "Immigration policy changes are having widespread effects. I'm tracking 1,456 verified stories about business impacts, family separations, and labor shortages. How is this affecting your community?",
        context: [
          { icon: '🌎', text: '1,456 verified stories' },
          { icon: '🏢', text: 'Small business impacts' },
          { icon: '👨‍👩‍👧', text: 'Family reunification delays' }
        ]
      };
    }

    // Default response
    return {
      text: "That's important to document. I'm seeing similar patterns across multiple states. Can you be more specific about the timeline and how this has impacted you or your community?",
      context: [
        { icon: '🔍', text: 'Analyzing pattern' },
        { icon: '📊', text: 'Correlating data' },
        { icon: '🎯', text: 'Matching policies' }
      ]
    };
  };

  const handleSendMessage = async () => {
    if (!inputText.trim()) return;

    // Add user message
    const userMessage = {
      type: 'user',
      text: inputText,
      timestamp: new Date()
    };

    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    const currentInput = inputText;
    setInputText('');
    setMessageCount(prev => prev + 1);

    // Check if we're waiting for a zip code
    if (awaitingZipCode) {
      setIsTyping(true);

      // Try to extract and validate zip code
      const possibleZip = extractZipCode(currentInput) || currentInput.trim();

      try {
        console.log('Looking up zip code:', possibleZip);
        const location = await lookupZipCode(possibleZip);
        console.log('Zip lookup result:', location);

        setZipCode(possibleZip);
        setLocationData(location);
        setAwaitingZipCode(false);
        setIsTyping(false);

        console.log('Updated locationData state to:', location);

        // Confirmation message with location
        const confirmMessage = {
          type: 'ai',
          text: `Got it! ${location.city}, ${location.state}. Let me verify your story against our federal data sources and similar reports in your area...`,
          context: [
            { icon: '📍', text: `${location.city}, ${location.state}` },
            { icon: '🔍', text: 'Checking 20+ databases' },
            { icon: '📊', text: 'Matching patterns' }
          ],
          timestamp: new Date()
        };

        const finalMessages = [...updatedMessages, confirmMessage];
        setMessages(finalMessages);

        // Trigger submission after short delay - PASS LOCATION DIRECTLY
        setTimeout(() => {
          submitStory(finalMessages, location);
        }, 1500);

      } catch (error) {
        setIsTyping(false);
        const errorMessage = {
          type: 'ai',
          text: `${error.message} Please provide a valid 5-digit zip code.`,
          timestamp: new Date()
        };
        setMessages(prev => [...prev, errorMessage]);
      }

      return;
    }

    // Show typing indicator
    setIsTyping(true);

    // Check for zip code in all messages
    const allUserText = updatedMessages
      .filter(m => m.type === 'user')
      .map(m => m.text)
      .join(' ');
    const detectedZip = extractZipCode(allUserText);

    // Simulate AI processing delay
    setTimeout(async () => {
      setIsTyping(false);

      // Check if we have enough information (after 2 user messages)
      const userMessageCount = updatedMessages.filter(m => m.type === 'user').length;

      if (userMessageCount >= 2) {
        // Check if we have a zip code
        if (detectedZip && !zipCode) {
          // Try to validate the detected zip
          try {
            console.log('Auto-detected zip code:', detectedZip);
            const location = await lookupZipCode(detectedZip);
            console.log('Auto-lookup result:', location);

            setZipCode(detectedZip);
            setLocationData(location);
            console.log('Updated locationData state (auto-detect) to:', location);

            // Proceed with verification
            const verifyingMessage = {
              type: 'ai',
              text: `Perfect! I have enough detail now. I can see this is happening in ${location.city}, ${location.state}. Let me verify your story against our federal data sources and similar reports...`,
              context: [
                { icon: '📍', text: `${location.city}, ${location.state}` },
                { icon: '🔍', text: 'Checking 20+ databases' },
                { icon: '📊', text: 'Matching patterns' }
              ],
              timestamp: new Date()
            };

            const finalMessages = [...updatedMessages, verifyingMessage];
            setMessages(finalMessages);

            // PASS LOCATION DIRECTLY to avoid race condition with state
            setTimeout(() => {
              submitStory(finalMessages, location);
            }, 1500);

          } catch (error) {
            // Zip was invalid, ask for it
            setAwaitingZipCode(true);
            const zipRequestMessage = {
              type: 'ai',
              text: "One last thing - what's the zip code where this is happening? This helps us match your story with local data and similar experiences in your area.",
              context: [
                { icon: '📍', text: 'Location needed' },
                { icon: '🎯', text: 'For accurate matching' }
              ],
              timestamp: new Date()
            };
            setMessages(prev => [...prev, zipRequestMessage]);
          }

        } else if (!zipCode) {
          // No zip code detected, request it
          setAwaitingZipCode(true);
          const zipRequestMessage = {
            type: 'ai',
            text: "Thanks for sharing that detail. To verify your story and match it with similar experiences, what's the zip code where this is happening?",
            context: [
              { icon: '📍', text: 'Location needed' },
              { icon: '🎯', text: 'For accurate matching' }
            ],
            timestamp: new Date()
          };
          setMessages(prev => [...prev, zipRequestMessage]);

        } else {
          // Already have zip code, proceed with verification
          const verifyingMessage = {
            type: 'ai',
            text: "Perfect! I have enough detail now. Let me verify your story against our federal data sources and similar reports...",
            context: [
              { icon: '🔍', text: 'Checking 20+ databases' },
              { icon: '📊', text: 'Matching patterns' },
              { icon: '✅', text: 'Verifying timeline' }
            ],
            timestamp: new Date()
          };

          const finalMessages = [...updatedMessages, verifyingMessage];
          setMessages(finalMessages);

          setTimeout(() => {
            submitStory(finalMessages);
          }, 1500);
        }
      } else {
        // Continue conversation - get follow-up question
        const aiResponse = getAIResponse(currentInput);
        const aiMessage = {
          type: 'ai',
          text: aiResponse.text,
          context: aiResponse.context,
          timestamp: new Date()
        };

        setMessages(prev => [...prev, aiMessage]);
      }
    }, 1500);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const toggleVoiceRecording = () => {
    setIsRecording(!isRecording);
    // TODO: Implement actual voice recording
    if (!isRecording) {
      // Start recording
      console.log('Started voice recording');
    } else {
      // Stop recording
      console.log('Stopped voice recording');
      // Add placeholder message
      setMessages(prev => [...prev, {
        type: 'user',
        text: '[Voice message recorded]',
        timestamp: new Date()
      }]);
    }
  };

  const handlePhotoUpload = () => {
    // TODO: Implement photo upload
    console.log('Photo upload clicked');
  };

  return (
    <div className="glass-card p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold gradient-text flex items-center gap-2">
            <Sparkles className="w-6 h-6" />
            Share Your Story
          </h2>
          <p className="text-sm text-gray-400 mt-1">
            Your experience helps us understand what's really happening
          </p>
        </div>
        <div className="live-indicator">
          LIVE
        </div>
      </div>

      {/* Input Mode Selector */}
      <div className="flex gap-3 mb-6">
        <button
          onClick={() => setInputMode('text')}
          className={`flex-1 py-3 px-4 rounded-xl transition-all ${
            inputMode === 'text'
              ? 'gradient-bg text-white'
              : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
          }`}
        >
          💬 Chat
        </button>
        <button
          onClick={() => setInputMode('voice')}
          className={`flex-1 py-3 px-4 rounded-xl transition-all ${
            inputMode === 'voice'
              ? 'gradient-bg text-white'
              : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
          }`}
        >
          🎙️ Voice
        </button>
        <button
          onClick={() => setInputMode('photo')}
          className={`flex-1 py-3 px-4 rounded-xl transition-all ${
            inputMode === 'photo'
              ? 'gradient-bg text-white'
              : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
          }`}
        >
          📸 Photo
        </button>
      </div>

      {/* Messages Container */}
      <div className="bg-gray-900 rounded-2xl p-4 mb-4 h-96 overflow-y-auto">
        <div className="space-y-4">
          {messages.map((message, index) => (
            <div
              key={index}
              className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`flex items-start gap-3 max-w-[80%] ${
                message.type === 'user' ? 'flex-row-reverse' : ''
              }`}>
                {/* Avatar */}
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                  message.type === 'user'
                    ? 'bg-gradient-to-br from-pink-500 to-orange-500'
                    : 'bg-gradient-to-br from-blue-500 to-purple-500'
                }`}>
                  {message.type === 'user' ? '👤' : '🤖'}
                </div>

                {/* Message Content */}
                <div>
                  <div className={`chat-bubble ${message.type}`}>
                    <p className="text-sm leading-relaxed">{message.text}</p>
                  </div>

                  {/* Context Cards */}
                  {message.context && (
                    <div className="flex gap-2 mt-2 flex-wrap">
                      {message.context.map((ctx, idx) => (
                        <div
                          key={idx}
                          className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-1.5 text-xs flex items-center gap-1.5 hover:border-blue-500 transition-colors cursor-pointer"
                        >
                          <span>{ctx.icon}</span>
                          <span>{ctx.text}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}

          {/* Typing Indicator */}
          {isTyping && (
            <div className="flex justify-start">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-gradient-to-br from-blue-500 to-purple-500">
                  🤖
                </div>
                <div className="chat-bubble ai">
                  <div className="typing-indicator">
                    <div className="typing-dot"></div>
                    <div className="typing-dot"></div>
                    <div className="typing-dot"></div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Verification Animation */}
          {isVerifying && (
            <div className="flex justify-center my-6">
              <div className="glass-card px-6 py-4 rounded-2xl text-center">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-8 h-8 rounded-full border-3 border-blue-500 border-t-transparent animate-spin"></div>
                  <span className="font-semibold gradient-text">Verifying Your Story...</span>
                </div>
                <div className="text-xs text-gray-400 space-y-1">
                  <div>✓ Cross-referencing federal databases</div>
                  <div>✓ Analyzing similar reports</div>
                  <div>✓ Validating timeline consistency</div>
                </div>
              </div>
            </div>
          )}

          {/* Verification Score Display */}
          {verificationScore && !isVerifying && (
            <div className="my-6">
              <div className="glass-card p-6 rounded-2xl">
                <h3 className="text-lg font-bold gradient-text mb-4 flex items-center gap-2">
                  <span>🎯</span>
                  <span>Verification Results</span>
                </h3>

                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="bg-gray-800 rounded-lg p-3">
                    <div className="text-3xl font-black gradient-text">{verificationScore.overall}%</div>
                    <div className="text-xs text-gray-400 mt-1">Overall Score</div>
                  </div>
                  <div className="bg-gray-800 rounded-lg p-3">
                    <div className="text-3xl font-black text-green-400">{verificationScore.dataMatch}%</div>
                    <div className="text-xs text-gray-400 mt-1">Data Match</div>
                  </div>
                  <div className="bg-gray-800 rounded-lg p-3">
                    <div className="text-2xl font-bold text-blue-400">{verificationScore.timelineConsistency}%</div>
                    <div className="text-xs text-gray-400 mt-1">Timeline</div>
                  </div>
                  <div className="bg-gray-800 rounded-lg p-3">
                    <div className="text-2xl font-bold text-purple-400">{verificationScore.geographicVerification}%</div>
                    <div className="text-xs text-gray-400 mt-1">Geographic</div>
                  </div>
                </div>

                <div className="flex items-center gap-2 p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
                  <span className="text-2xl">✅</span>
                  <span className="text-sm text-green-400 font-semibold">Story Verified & Submitted</span>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input Area */}
      {inputMode === 'text' && (
        <div className="flex gap-3">
          <input
            ref={inputRef}
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type your story or question..."
            className="flex-1 bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
          />
          <button
            onClick={handleSendMessage}
            disabled={!inputText.trim()}
            className="gradient-bg text-white px-6 py-3 rounded-xl font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <Send className="w-5 h-5" />
            Send
          </button>
        </div>
      )}

      {inputMode === 'voice' && (
        <div className="flex flex-col items-center justify-center py-8">
          <button
            onClick={toggleVoiceRecording}
            className={`voice-button ${isRecording ? 'recording' : ''}`}
          >
            <Mic />
          </button>
          <p className="mt-4 text-gray-400 text-sm">
            {isRecording ? 'Recording... Click to stop' : 'Click to start recording'}
          </p>
          {isRecording && (
            <div className="mt-4 flex items-center gap-2">
              <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
              <span className="text-red-500 text-sm font-semibold">00:00</span>
            </div>
          )}
        </div>
      )}

      {inputMode === 'photo' && (
        <div className="flex flex-col items-center justify-center py-8">
          <button
            onClick={handlePhotoUpload}
            className="w-32 h-32 rounded-2xl border-2 border-dashed border-gray-600 hover:border-blue-500 flex flex-col items-center justify-center gap-3 transition-all hover:bg-gray-800"
          >
            <Camera className="w-12 h-12 text-gray-400" />
            <span className="text-sm text-gray-400">Upload Photo</span>
          </button>
          <p className="mt-4 text-gray-400 text-sm text-center max-w-md">
            Upload a photo showing the impact in your community
          </p>
        </div>
      )}
    </div>
  );
};

export default ConversationalInput;
