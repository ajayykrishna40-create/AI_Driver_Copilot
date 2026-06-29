'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { agentChat } from '../../services/api';
import ChatHistory from './ChatHistory';

const LightPillar = dynamic(() => import('./LightPillar'), {
  ssr: false,
  loading: () => <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-purple-950 to-slate-950" />
});

export default function ChatPage() {
  const router = useRouter();
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const [user, setUser] = useState({ first_name: "", last_name: "" });
  const [driverId, setDriverId] = useState('');
  const [sessionId, setSessionId] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [voiceAudioUrl, setVoiceAudioUrl] = useState('');
  const [voiceResponseUrl, setVoiceResponseUrl] = useState('');
  const [voiceStatus, setVoiceStatus] = useState('Ready for voice input');
  const mediaRecorderRef = useRef(null);
  const recordedChunksRef = useRef([]);
  const voiceSocketRef = useRef(null);
  const ttsAudioChunksRef = useRef([]);
  const voiceAudioPlayerRef = useRef(null);
  const [activeLoad, setActiveLoad] = useState(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    const storedDriverId = localStorage.getItem("driverId");

    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    if (storedDriverId) {
      setDriverId(storedDriverId);
    }
  }, []);

  // Fetch active load for assignment card
  useEffect(() => {
    if (!driverId) return;
    fetch(`http://localhost:8001/drivers/${driverId}/active-loads`)
      .then(r => r.json())
      .then(data => {
        const loads = data?.loads || [];
        const active = loads.find(l => ["ASSIGNED","HOOKED","IN_TRANSIT"].includes(l.status));
        setActiveLoad(active || loads[0] || null);
      })
      .catch(() => {});
  }, [driverId]);

  useEffect(() => {
    return () => {
      if (voiceSocketRef.current) {
        try {
          voiceSocketRef.current.close();
        } catch (error) {
          console.error('Failed to close voice socket', error);
        }
      }
    };
  }, []);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    
    if (!inputValue.trim() || !driverId) return;

    const userMessage = {
      id: Date.now(),
      text: inputValue,
      sender: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    const conversation = [...messages, userMessage].map((message) => ({
      role: message.sender === 'user' ? 'user' : 'assistant',
      content: message.text,
    }));

    try {
      const result = await agentChat(driverId, conversation, sessionId);
      const botText = result?.reply || result?.response || result?.message || 'I could not get a response from the agent.';
      const botMessage = {
        id: Date.now() + 1,
        text: botText,
        sender: 'bot',
        timestamp: new Date()
      };

      setMessages(prev => [...prev, botMessage]);
      if (result?.session_id || result?.sessionId) {
        setSessionId(result.session_id || result.sessionId);
      }
    } catch (error) {
      const errorMessage = {
        id: Date.now() + 2,
        text: error instanceof Error ? error.message : 'Agent request failed.',
        sender: 'bot',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const resetVoiceConnection = () => {
    if (voiceSocketRef.current) {
      try {
        voiceSocketRef.current.close();
      } catch (error) {
        console.error('Error closing voice socket', error);
      }
      voiceSocketRef.current = null;
    }
    ttsAudioChunksRef.current = [];
    setVoiceStatus('Ready for voice input');
  };

  const waitForSocketOpen = (socket) => {
    return new Promise((resolve, reject) => {
      if (!socket) {
        reject(new Error('Voice socket is not initialized')); 
        return;
      }

      if (socket.readyState === WebSocket.OPEN) {
        resolve();
        return;
      }

      const handleOpen = () => {
        window.clearTimeout(timeoutId);
        socket.removeEventListener('open', handleOpen);
        socket.removeEventListener('error', handleError);
        resolve();
      };

      const handleError = (event) => {
        window.clearTimeout(timeoutId);
        socket.removeEventListener('open', handleOpen);
        socket.removeEventListener('error', handleError);
        reject(new Error('Voice socket error'));
      };

      const timeoutId = window.setTimeout(() => {
        socket.removeEventListener('open', handleOpen);
        socket.removeEventListener('error', handleError);
        reject(new Error('Voice socket connection timed out'));
      }, 5000);

      socket.addEventListener('open', handleOpen);
      socket.addEventListener('error', handleError);
    });
  };

  const initVoiceSocket = async () => {
    if (!driverId) {
      window.alert('Driver ID is required for voice chat.');
      return null;
    }

    if (voiceSocketRef.current && [WebSocket.OPEN, WebSocket.CONNECTING].includes(voiceSocketRef.current.readyState)) {
      return voiceSocketRef.current;
    }

    const socket = new WebSocket(`ws://localhost:8001/ws/voice/${driverId}`);
    socket.binaryType = 'arraybuffer';

    socket.onopen = () => {
      setVoiceStatus('Voice connection ready');
      socket.send('INIT');
    };

    socket.onmessage = (event) => {
      if (typeof event.data === 'string') {
        try {
          const data = JSON.parse(event.data);
          const type = data.type;

          if (type === 'ready') {
            setVoiceStatus('Voice connection ready');
            return;
          }

          if (type === 'transcribing') {
            setVoiceStatus('Transcribing...');
            setIsLoading(true);
            return;
          }

          if (type === 'transcript') {
            setVoiceStatus('Heard: ' + data.text);
            setMessages((prev) => [
              ...prev,
              {
                id: Date.now() + 1,
                text: data.text,
                sender: 'user',
                timestamp: new Date(),
              },
            ]);
            return;
          }

          if (type === 'thinking') {
            setVoiceStatus('Thinking...');
            setIsLoading(true);
            return;
          }

          if (type === 'reply') {
            setVoiceStatus('Reply received');
            // Strip markdown formatting Nova-lite may add
            const cleanText = data.text
              .replace(/\*\*(.*?)\*\*/g, '$1')
              .replace(/\*(.*?)\*/g, '$1')
              .replace(/^[-•]\s+/gm, '')
              .replace(/#{1,6}\s+/g, '')
              .trim();
            setMessages((prev) => [
              ...prev,
              {
                id: Date.now() + 2,
                text: cleanText,
                sender: 'bot',
                timestamp: new Date(),
              },
            ]);
            // Keep loading true — TTS is still coming
            return;
          }

          if (type === 'session') {
            setSessionId(data.session_id || data.sessionId || sessionId);
            return;
          }

          if (type === 'synthesizing') {
            setVoiceStatus('Synthesizing response...');
            return;
          }

          if (type === 'audio_end') {
            finalizeTtsAudio();
            setIsLoading(false);
            setVoiceStatus('Ready for voice input');
            return;
          }

          if (type === 'error' || type === 'tts_error') {
            setVoiceStatus('Ready for voice input');
            setIsLoading(false);
            setMessages((prev) => [
              ...prev,
              {
                id: Date.now() + 3,
                text: data.message || 'Voice processing error',
                sender: 'bot',
                timestamp: new Date(),
              },
            ]);
            return;
          }
        } catch (err) {
          console.error('Failed to parse voice socket message', err);
        }
      } else if (event.data instanceof ArrayBuffer) {
        // Buffer MP3 chunks — full response decoded on audio_end
        ttsAudioChunksRef.current.push(event.data);
      }
    };

    socket.onclose = () => {
      setVoiceStatus('Voice connection closed');
    };

    socket.onerror = (error) => {
      console.error('Voice socket error', error);
      setVoiceStatus('Voice socket error');
    };

    voiceSocketRef.current = socket;
    return socket;
  };

  const audioContextRef = useRef(null);
  const audioQueueRef = useRef([]);     // queue of decoded AudioBuffers
  const isPlayingRef = useRef(false);

  const getAudioContext = () => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (audioContextRef.current.state === 'suspended') {
      audioContextRef.current.resume();
    }
    return audioContextRef.current;
  };

  // Play next decoded AudioBuffer in queue
  const playNextInQueue = () => {
    if (isPlayingRef.current || audioQueueRef.current.length === 0) return;
    isPlayingRef.current = true;
    const audioBuffer = audioQueueRef.current.shift();
    try {
      const ctx = getAudioContext();
      const source = ctx.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(ctx.destination);
      source.onended = () => {
        isPlayingRef.current = false;
        playNextInQueue();
      };
      source.start(0);
    } catch (e) {
      console.warn('Audio playback error:', e);
      isPlayingRef.current = false;
      playNextInQueue();
    }
  };

  // Called for each binary WebSocket message (one MP3 per sentence from ElevenLabs)
  const enqueueSentenceAudio = async (arrayBuffer) => {
    try {
      const ctx = getAudioContext();
      // decodeAudioData consumes the buffer — slice to copy first
      const decoded = await ctx.decodeAudioData(arrayBuffer.slice(0));
      audioQueueRef.current.push(decoded);
      playNextInQueue();
    } catch (e) {
      console.warn('Audio decode error:', e);
    }
  };

  const resetAudioQueue = () => {
    audioQueueRef.current = [];
    isPlayingRef.current = false;
  };

  const finalizeTtsAudio = async () => {
    const chunks = ttsAudioChunksRef.current;
    ttsAudioChunksRef.current = [];
    if (!chunks.length) return;

    // Combine all chunks into one blob
    const totalLen = chunks.reduce((s, c) => s + c.byteLength, 0);
    const combined = new Uint8Array(totalLen);
    let offset = 0;
    for (const chunk of chunks) {
      combined.set(new Uint8Array(chunk), offset);
      offset += chunk.byteLength;
    }

    // Use <audio> element — handles any MP3 format including Google TTS
    try {
      const blob = new Blob([combined], { type: 'audio/mpeg' });
      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);
      
      // Set playback speed (1.0 = normal, 1.3 = 30% faster, 1.5 = 50% faster)
      audio.playbackRate = 1.3;  // 30% faster speech
      
      audio.onended = () => URL.revokeObjectURL(url);
      audio.onerror = (e) => {
        console.warn('Audio element error:', e);
        URL.revokeObjectURL(url);
      };
      await audio.play();
    } catch (e) {
      console.warn('Audio playback failed:', e);
    }
  };

  const sendRecordedAudio = async (audioBlob) => {
    if (!driverId) {
      window.alert('Driver ID is required for voice chat.');
      return;
    }

    try {
      const socket = await initVoiceSocket();
      if (!socket) {
        return;
      }

      await waitForSocketOpen(socket);
      setVoiceStatus('Sending audio to voice service...');
      socket.send(audioBlob);
      socket.send('END_AUDIO');
    } catch (err) {
      console.error('Failed to send recorded audio', err);
      setVoiceStatus('Voice connection failed');
      setIsLoading(false);
      window.alert('Unable to send audio to the voice service. Try again.');
    }
  };

  const handleNewChat = () => {
    setMessages([]);
    setInputValue('');
    setSessionId(null);
    if (voiceAudioUrl) {
      URL.revokeObjectURL(voiceAudioUrl);
    }
    if (voiceResponseUrl) {
      URL.revokeObjectURL(voiceResponseUrl);
    }
    setVoiceAudioUrl('');
    setVoiceResponseUrl('');
    resetAudioQueue();
    resetVoiceConnection();
    
    // Trigger history refresh by dispatching a custom event
    window.dispatchEvent(new CustomEvent('chatHistoryRefresh'));
  };

  const handleLogout = () => {
    localStorage.removeItem("authToken");
    localStorage.removeItem("user");
    localStorage.removeItem("driverId");
    router.push("/");
  };

  const startRecording = async () => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      window.alert('Microphone access is not supported in this browser.');
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      recordedChunksRef.current = [];

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          recordedChunksRef.current.push(event.data);
        }
      };

      recorder.onstop = async () => {
        const blob = new Blob(recordedChunksRef.current, { type: 'audio/webm' });
        if (voiceAudioUrl) {
          URL.revokeObjectURL(voiceAudioUrl);
        }
        setVoiceAudioUrl(URL.createObjectURL(blob));
        stream.getTracks().forEach((track) => track.stop());
        setIsRecording(false);
        setVoiceStatus('Processing voice input...');
        await sendRecordedAudio(blob);
      };

      mediaRecorderRef.current = recorder;
      recorder.start();
      setIsRecording(true);
      setVoiceStatus('Recording...');
    } catch (err) {
      console.error('Microphone error:', err);
      window.alert('Unable to access microphone. Please allow permissions and try again.');
    }
  };

  const stopRecording = () => {
    const recorder = mediaRecorderRef.current;
    if (recorder && recorder.state !== 'inactive') {
      recorder.stop();
    }
  };

  const handleVoiceButtonClick = () => {
    // Resume AudioContext on user gesture — required for autoplay policy
    getAudioContext();
    if (isRecording) {
      stopRecording();
    } else {
      if (voiceAudioUrl) {
        URL.revokeObjectURL(voiceAudioUrl);
      }
      if (voiceResponseUrl) {
        URL.revokeObjectURL(voiceResponseUrl);
      }
      setVoiceAudioUrl('');
      setVoiceResponseUrl('');
      startRecording();
    }
  };

  const formatTime = (date) => {
    return new Date(date).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  return (
    <div className="flex h-screen bg-slate-950 overflow-hidden relative">
      {/* ANIMATED BACKGROUND */}
      <div className="absolute inset-0 -z-20">
        <LightPillar
          topColor="#8a5cff"
          bottomColor="#00ffd1"
          intensity={4.0}
          rotationSpeed={0.12}
          interactive={true}
          className=""
          glowAmount={0.12}
          pillarWidth={2.0}
          pillarHeight={0.6}
          noiseIntensity={0.04}
          mixBlendMode="screen"
          pillarRotation={0}
          quality="high"
        />
      </div>

      {/* OVERLAY */}
      <div className="absolute inset-0 -z-10 bg-gradient-to-br from-slate-950/30 via-purple-950/20 to-slate-950/30 pointer-events-none"></div>

      <style jsx>{`
        @keyframes slideIn {
          from { opacity: 0; transform: translateX(-20px); }
          to { opacity: 1; transform: translateX(0); }
        }

        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }

        @keyframes glow {
          0% { transform: scale(1); opacity: 0.8; }
          50% { transform: scale(1.05); opacity: 1; }
          100% { transform: scale(1); opacity: 0.8; }
        }

        @keyframes pulse-glow {
          0% { box-shadow: 0 0 20px rgba(139, 92, 255, 0.5); }
          50% { box-shadow: 0 0 40px rgba(96, 165, 250, 0.8); }
          100% { box-shadow: 0 0 20px rgba(139, 92, 255, 0.5); }
        }

        .glow-sphere {
          animation: pulse-glow 3s ease-in-out infinite;
          background: radial-gradient(circle at 30% 30%, rgba(168, 85, 247, 0.8), rgba(59, 130, 246, 0.6));
        }

        .message-container {
          animation: fadeInUp 0.3s ease-out;
        }

        ::-webkit-scrollbar {
          width: 8px;
        }

        ::-webkit-scrollbar-track {
          background: transparent;
        }

        ::-webkit-scrollbar-thumb {
          background: rgba(147, 51, 234, 0.3);
          border-radius: 4px;
        }

        ::-webkit-scrollbar-thumb:hover {
          background: rgba(147, 51, 234, 0.5);
        }
      `}</style>

      {/* SIDEBAR */}
      <div className="relative z-10 w-64 bg-gradient-to-b from-slate-900/90 to-purple-900/80 backdrop-blur-xl border-r border-purple-500/20 flex flex-col">
        {/* Logo */}
        <div className="p-6 border-b border-purple-500/20">
          <div className="flex items-center gap-3">
            <div className="w-16 h-16">
              <img 
                src="/truck/truck_logo.png" 
                alt="Truck Logo" 
                className="w-full h-full object-contain"
              />
            </div>
            <span className="text-lg font-bold text-white">Driver Copilot</span>
          </div>
        </div>

        {/* New Chat Button */}
        <div className="p-4 space-y-2">
          <button
            onClick={handleNewChat}
            className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold py-3 px-4 rounded-xl transition-all duration-300 flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            New Chat
          </button>
          
          <button
            onClick={() => window.dispatchEvent(new CustomEvent('toggleChatHistory'))}
            className="w-full bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 text-white font-semibold py-3 px-4 rounded-xl transition-all duration-300 flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            History
          </button>
        </div>

        {/* Spacer */}
        <div className="flex-1"></div>

        {/* Bottom Section */}
        <div className="p-4 border-t border-purple-500/20">
          <button
            onClick={handleLogout}
            className="w-full text-left px-3 py-2 rounded-lg hover:bg-red-500/20 transition-colors text-gray-300 hover:text-red-400 text-sm font-medium flex items-center gap-3"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Logout
          </button>
        </div>
      </div>

      {/* MAIN CONTENT */}
      <div className="relative z-10 flex-1 min-h-0 flex flex-col overflow-hidden">
        
        {/* Header */}
<div className="bg-gradient-to-r from-purple-900/30 to-slate-900/30 backdrop-blur-xl border-b border-purple-500/20 px-8 py-4 flex items-center">

  <h2 className="text-white font-semibold text-lg">AI Driver Copilot</h2>

  <div className="ml-auto">
    {user.first_name && (
      <div className="flex items-center gap-3 bg-purple-500/10 border border-purple-500/20 px-4 py-2 rounded-xl">

        <div className="w-10 h-10 rounded-full bg-gradient-to-r from-purple-600 to-blue-600 flex items-center justify-center text-white font-bold">
          {user.first_name.charAt(0)}
        </div>

        <span className="text-white font-semibold">
          {user.first_name} {user.last_name}
        </span>

      </div>
    )}
  </div>

</div>
        {/* Assignment Card */}
        {activeLoad && (
          <div className="mx-8 mt-4 bg-slate-900/60 border border-purple-500/20 rounded-2xl px-5 py-4 flex flex-wrap items-center gap-x-8 gap-y-2 text-sm backdrop-blur-sm">
            {/* Status badge */}
            <div className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${activeLoad.status === 'IN_TRANSIT' ? 'bg-green-400 animate-pulse' : activeLoad.status === 'HOOKED' ? 'bg-yellow-400' : 'bg-blue-400'}`}></span>
              <span className="text-gray-400 text-xs uppercase tracking-wider font-semibold">{activeLoad.status.replace('_', ' ')}</span>
            </div>
            {/* Load number */}
            <div className="flex items-center gap-2">
              <span className="text-gray-500 text-xs">Load</span>
              <span className="text-white font-bold">{activeLoad.load_number}</span>
            </div>
            {/* Trailer */}
            {activeLoad.trailer && (
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h8m-8 4h8m-8 4h4M3 5h18a1 1 0 011 1v12a1 1 0 01-1 1H3a1 1 0 01-1-1V6a1 1 0 011-1z" />
                </svg>
                <span className="text-white font-bold">#{activeLoad.trailer.trailer_number}</span>
                <span className="text-gray-400">{activeLoad.trailer.type?.replace('_', ' ')}</span>
              </div>
            )}
            {/* Destination */}
            {activeLoad.consignee && (
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                </svg>
                <span className="text-gray-300">{activeLoad.consignee.name}, {activeLoad.consignee.city} {activeLoad.consignee.state}</span>
              </div>
            )}
            {/* Appointment */}
            {activeLoad.appointment_number && (
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span className="text-gray-400 text-xs">Appt</span>
                <span className="text-white font-semibold">{activeLoad.appointment_number}</span>
              </div>
            )}
            {/* ETA */}
            {activeLoad.eta_hours && (
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-gray-400 text-xs">ETA</span>
                <span className="text-white font-semibold">{activeLoad.eta_hours}h · {activeLoad.distance_miles} mi</span>
              </div>
            )}
          </div>
        )}

        {/* Chat Area */}
        <div className="flex-1 overflow-y-auto p-8 flex flex-col">
          {messages.length === 0 ? (
            // Empty State
            <div className="flex flex-col items-center justify-center flex-1 space-y-8">
              {/* Glowing Sphere */}
              <div className="relative w-40 h-40 flex items-center justify-center">
                <div className="absolute w-full h-full glow-sphere rounded-full"></div>
                <div className="relative w-32 h-32 bg-gradient-to-br from-purple-500 via-blue-500 to-cyan-500 rounded-full flex items-center justify-center opacity-70">
                  <div className="w-24 h-24 bg-gradient-to-br from-purple-600 to-blue-600 rounded-full"></div>
                </div>
              </div>

              {/* Welcome Text */}
              <div className="text-center space-y-4">
                <h1 className="text-4xl font-bold text-white">Welcome {user.first_name} {user.last_name}!</h1>
                <p className="text-gray-400 max-w-xl text-lg">
                  I&apos;m your AI Driver Copilot. Ask me anything about your delivery details, routes.
                </p>
              </div>

              {/* Quick Action Buttons */}
            </div>
          ) : (
            // Chat Messages
            <div className="space-y-4">
              {messages.map((message) => (
                <div key={message.id} className={`flex gap-4 message-container ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                  {message.sender === 'bot' && (
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-600 to-blue-600 flex-shrink-0"></div>
                  )}

                  <div className={`flex flex-col gap-1 max-w-2xl ${message.sender === 'user' ? 'items-end' : 'items-start'}`}>
                    <div
                      className={`px-4 py-3 rounded-lg ${
                        message.sender === 'bot'
                          ? 'bg-purple-900/40 border border-purple-500/30 text-gray-100'
                          : 'bg-gradient-to-r from-purple-600 to-blue-600 text-white'
                      }`}
                    >
                      <p className="text-sm">{message.text}</p>
                    </div>
                    <span className="text-xs text-gray-500">{formatTime(message.timestamp)}</span>
                  </div>

                  {message.sender === 'user' && (
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-600 to-purple-600 flex-shrink-0"></div>
                  )}
                </div>
              ))}

              {isLoading && (
                <div className="flex items-end gap-3">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-600 to-blue-600 flex-shrink-0"></div>
                  <div className="bg-purple-900/40 border border-purple-500/30 rounded-lg px-4 py-3">
                    <div className="flex gap-2">
                      <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                      <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Input Area */}
        <div className="border-t border-purple-500/20 bg-gradient-to-r from-purple-900/20 to-slate-900/20 backdrop-blur-xl p-8">
          <form onSubmit={handleSendMessage} className="max-w-4xl mx-auto">
            <div className="relative">
              <textarea
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage(e);
                  }
                }}
                placeholder="Ask Anything..."
                className="w-full bg-slate-800/50 border border-purple-500/30 rounded-2xl pl-6 pr-28 py-4 text-white placeholder-gray-500 transition-all duration-300 hover:border-purple-500/50 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 resize-none"
                rows="4"
              />
              {/* Buttons pinned to bottom-right inside the textarea */}
              <div className="absolute bottom-3 right-3 flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleVoiceButtonClick}
                  className={`w-9 h-9 rounded-full ${isRecording ? 'bg-red-600 hover:bg-red-500' : 'bg-slate-700/80 hover:bg-slate-600'} transition-all duration-300 flex items-center justify-center text-white ring-1 ring-white/10 shadow-lg shadow-violet-500/20`}
                  aria-label="Voice input"
                  title={voiceStatus}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 1.5a3 3 0 00-3 3v4.5a3 3 0 006 0V4.5a3 3 0 00-3-3z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.5 11.999a7.5 7.5 0 01-15 0" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19.5v3" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.25 22.5h7.5" />
                  </svg>
                </button>
                <button
                  type="submit"
                  disabled={!inputValue.trim() || isLoading}
                  className="w-9 h-9 rounded-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 disabled:from-gray-600 disabled:to-gray-600 flex items-center justify-center text-white transition-all duration-300 disabled:cursor-not-allowed"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M16.6915026,12.4744748 L3.50612381,13.2599618 C3.19218622,13.2599618 3.03521743,13.4170592 3.03521743,13.5741566 L1.15159189,20.0151496 C0.8376543,20.8006365 0.99,21.89 1.77946707,22.52 C2.41,22.99 3.50612381,23.1 4.13399899,22.8429026 L21.714504,14.0454487 C22.6563168,13.5741566 23.1272231,12.6315722 22.9702544,11.6889879 L4.13399899,1.16683347 C3.34915502,0.9 2.40734225,0.9 1.77946707,1.4427339 C0.994623095,2.10604706 0.837654326,3.0486314 1.15159189,3.98721575 L3.03521743,10.4282088 C3.03521743,10.5853061 3.19218622,10.7424035 3.50612381,10.7424035 L16.6915026,11.5278905 C16.6915026,11.5278905 17.1624089,11.5278905 17.1624089,12.0006365 C17.1624089,12.4744748 16.6915026,12.4744748 16.6915026,12.4744748 Z" />
                  </svg>
                </button>
              </div>
            </div>
          </form>

          {/* Hidden audio player for TTS playback — no visible UI */}
          <audio ref={voiceAudioPlayerRef} src={voiceResponseUrl || undefined} className="hidden" />
        </div>
      </div>

      {/* Chat History Component */}
      {driverId && <ChatHistory driverId={driverId} currentMessages={messages} />}
    </div>
  );
} 