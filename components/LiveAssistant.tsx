import React, { useEffect, useRef, useState } from 'react';
import { GoogleGenAI, LiveServerMessage, Modality } from '@google/genai';
import { Mic, MicOff, Volume2, X } from 'lucide-react';

interface LiveAssistantProps {
  isOpen: boolean;
  onClose: () => void;
}

const LiveAssistant: React.FC<LiveAssistantProps> = ({ isOpen, onClose }) => {
  const [isConnected, setIsConnected] = useState(false);
  const [status, setStatus] = useState<'disconnected' | 'connecting' | 'listening' | 'speaking'>('disconnected');
  const [error, setError] = useState<string | null>(null);
  
  // Refs for audio handling
  const audioContextRef = useRef<AudioContext | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const sessionRef = useRef<any>(null); // To store the live session
  const nextStartTimeRef = useRef<number>(0);
  const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());

  useEffect(() => {
    if (!isOpen) {
      cleanup();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  const cleanup = () => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop());
      mediaStreamRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    if (sessionRef.current) {
      // The SDK doesn't expose a direct .close() on the session object easily in all versions, 
      // but usually the connection is closed when the context is destroyed or explicitly handled.
      // We'll reset state.
    }
    setIsConnected(false);
    setStatus('disconnected');
  };

  const connectToLiveAPI = async () => {
    try {
      setStatus('connecting');
      setError(null);
      
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      
      // Audio setup
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      const inputCtx = new AudioContextClass({ sampleRate: 16000 });
      const outputCtx = new AudioContextClass({ sampleRate: 24000 });
      audioContextRef.current = outputCtx;

      // Microphone
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;

      const inputSource = inputCtx.createMediaStreamSource(stream);
      // Using ScriptProcessor as per guidelines for raw PCM access (though deprecated in modern web, still used in SDK examples)
      const processor = inputCtx.createScriptProcessor(4096, 1, 1);
      
      // Helpers
      const createBlob = (data: Float32Array) => {
        const l = data.length;
        const int16 = new Int16Array(l);
        for (let i = 0; i < l; i++) {
          int16[i] = data[i] * 32768;
        }
        
        // Manual encode to bytes then btoa
        let binary = '';
        const bytes = new Uint8Array(int16.buffer);
        const len = bytes.byteLength;
        for (let i = 0; i < len; i++) {
          binary += String.fromCharCode(bytes[i]);
        }
        
        return {
          data: btoa(binary),
          mimeType: 'audio/pcm;rate=16000',
        };
      };

      const decodeAudioData = async (base64: string, ctx: AudioContext) => {
        const binaryString = atob(base64);
        const len = binaryString.length;
        const bytes = new Uint8Array(len);
        for (let i = 0; i < len; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }
        
        const dataInt16 = new Int16Array(bytes.buffer);
        const frameCount = dataInt16.length;
        const buffer = ctx.createBuffer(1, frameCount, 24000);
        const channelData = buffer.getChannelData(0);
        for (let i = 0; i < frameCount; i++) {
            channelData[i] = dataInt16[i] / 32768.0;
        }
        return buffer;
      };

      // Connect Live API
      const sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-09-2025',
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } }
          },
          systemInstruction: "You are a helpful assistant for the user's bio page. Keep answers short and fun.",
        },
        callbacks: {
          onopen: () => {
            console.log("Live API Open");
            setIsConnected(true);
            setStatus('listening');

            // Hook up audio processing
            processor.onaudioprocess = (e) => {
              const inputData = e.inputBuffer.getChannelData(0);
              const pcmBlob = createBlob(inputData);
              sessionPromise.then(session => {
                session.sendRealtimeInput({ media: pcmBlob });
              });
            };
            inputSource.connect(processor);
            processor.connect(inputCtx.destination);
          },
          onmessage: async (msg: LiveServerMessage) => {
            const audioData = msg.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
            if (audioData) {
                setStatus('speaking');
                if (outputCtx.state === 'suspended') await outputCtx.resume();

                nextStartTimeRef.current = Math.max(nextStartTimeRef.current, outputCtx.currentTime);
                const audioBuffer = await decodeAudioData(audioData, outputCtx);
                const source = outputCtx.createBufferSource();
                source.buffer = audioBuffer;
                source.connect(outputCtx.destination);
                
                source.addEventListener('ended', () => {
                    sourcesRef.current.delete(source);
                    if (sourcesRef.current.size === 0) setStatus('listening');
                });
                
                source.start(nextStartTimeRef.current);
                nextStartTimeRef.current += audioBuffer.duration;
                sourcesRef.current.add(source);
            }
          },
          onclose: () => {
            console.log("Live API Closed");
            setIsConnected(false);
          },
          onerror: (err) => {
            console.error("Live API Error", err);
            setError("Connection error");
            setIsConnected(false);
          }
        }
      });
      sessionRef.current = sessionPromise;

    } catch (e: any) {
      console.error(e);
      setError(e.message || "Failed to connect");
      setStatus('disconnected');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white border border-gray-200 rounded-2xl p-6 w-80 shadow-2xl flex flex-col items-center">
        <div className="w-full flex justify-end">
            <button onClick={onClose} className="text-slate-400 hover:text-slate-900"><X size={20}/></button>
        </div>
        
        <div className={`w-20 h-20 rounded-full flex items-center justify-center mb-6 transition-all duration-500 ${status === 'speaking' ? 'bg-blue-500 shadow-[0_0_30px_rgba(59,130,246,0.5)] scale-110' : status === 'listening' ? 'bg-green-500 shadow-[0_0_20px_rgba(34,197,94,0.3)]' : 'bg-gray-200'}`}>
           {status === 'speaking' ? <Volume2 size={32} className="text-white animate-pulse" /> : <Mic size={32} className={status === 'listening' ? "text-white" : "text-slate-400"} />}
        </div>

        <h3 className="text-xl font-bold text-slate-900 mb-2">Gemini Live Assistant</h3>
        <p className="text-slate-500 text-sm text-center mb-6">
          {status === 'disconnected' ? "Ready to chat?" : 
           status === 'connecting' ? "Connecting..." :
           status === 'listening' ? "Listening..." : "Speaking..."}
        </p>

        {error && <p className="text-red-500 text-xs mb-4">{error}</p>}

        {!isConnected ? (
          <button 
            onClick={connectToLiveAPI}
            className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl text-white font-semibold hover:from-blue-500 hover:to-indigo-500 transition-all shadow-lg flex items-center justify-center gap-2"
          >
            <Mic size={18} /> Start Conversation
          </button>
        ) : (
          <button 
            onClick={cleanup}
            className="w-full py-3 bg-gray-100 border border-red-200 text-red-600 rounded-xl font-semibold hover:bg-red-50 transition-all flex items-center justify-center gap-2"
          >
            <MicOff size={18} /> End Call
          </button>
        )}
      </div>
    </div>
  );
};

export default LiveAssistant;