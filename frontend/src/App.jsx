import { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { Send, Database, Sparkles, RefreshCw, Upload, Mic, MicOff, Loader2 } from 'lucide-react';
import ChatMessage from './components/ChatMessage';
import UploadModal from './components/UploadModal';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';

export default function App() {
  const [messages, setMessages] = useState([
    {
      sender: 'bot',
      text: 'Hello! I am your Customer Database Assistant. You can search by Name, Application ID, Account Number, Mobile Number, or Application Date.',
      records: []
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  
  // Voice Recording States & Refs
  const [isListening, setIsListening] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const messagesEndRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  // Start Recording Audio
  const startListening = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        // Stop microphone stream tracks
        stream.getTracks().forEach((track) => track.stop());

        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        if (audioBlob.size === 0) return;

        // Send recorded audio blob to backend for transcription
        setIsTranscribing(true);
        const formData = new FormData();
        formData.append('file', audioBlob, 'speech.webm');

        try {
          const response = await axios.post(`${API_BASE_URL}/api/transcribe`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
          });

          if (response.data && response.data.text) {
            setInput(response.data.text);
          }
        } catch (err) {
          console.error('Transcription error:', err);
          alert('Failed to transcribe audio. Please check your backend /api/transcribe endpoint.');
        } finally {
          setIsTranscribing(false);
        }
      };

      mediaRecorder.start();
      setIsListening(true);
    } catch (err) {
      console.error('Microphone access error:', err);
      alert('Could not access microphone. Please ensure microphone permissions are granted in your browser.');
    }
  };

  // Stop Recording Audio
  const stopListening = () => {
    if (mediaRecorderRef.current && isListening) {
      mediaRecorderRef.current.stop();
      setIsListening(false);
    }
  };

  // Toggle Microphone On/Off
  const toggleVoiceInput = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  const handleSend = async (queryToSubmit) => {
    const query = (queryToSubmit || input).trim();
    if (!query || loading) return;

    if (isListening) {
      stopListening();
    }

    const userMsg = { sender: 'user', text: query };
    const updatedMessages = [...messages, userMsg];
    
    setMessages(updatedMessages);
    setInput('');
    setLoading(true);

    const historyPayload = updatedMessages.map((m) => ({
      sender: m.sender,
      text: m.text
    }));

    try {
      const response = await axios.post(`${API_BASE_URL}/api/chat`, {
        message: query,
        history: historyPayload
      });

      const { reply, records } = response.data;

      setMessages((prev) => [
        ...prev,
        {
          sender: 'bot',
          text: reply,
          records: records || []
        }
      ]);
    } catch (error) {
      console.error('API Error:', error);
      setMessages((prev) => [
        ...prev,
        {
          sender: 'bot',
          text: 'Sorry, I encountered an error connecting to the server. Please ensure FastAPI is running on port 8000.',
          records: []
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-slate-50 font-sans">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between shadow-xs">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-100 rounded-xl text-indigo-600">
            <Database className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              Customer Account AI Assistant
              <Sparkles className="w-4 h-4 text-amber-500 fill-amber-500" />
            </h1>
            <p className="text-xs text-slate-500">Connected to FastAPI & Ollama Agent</p>
          </div>
        </div>

        {/* Action Controls in Header */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsUploadOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-full transition-all shadow-2xs cursor-pointer"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Upload CSV</span>
          </button>

          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            System Ready
          </span>
        </div>
      </header>

      {/* Main Chat Messages Container */}
      <main className="flex-1 overflow-y-auto px-4 sm:px-8 py-6 max-w-5xl w-full mx-auto">
        {messages.map((msg, index) => (
          <ChatMessage key={index} message={msg} />
        ))}

        {loading && (
          <div className="flex items-center gap-3 my-4 text-slate-400 text-sm">
            <div className="w-8 h-8 rounded-full bg-slate-800 text-white flex items-center justify-center">
              <RefreshCw className="w-4 h-4 animate-spin" />
            </div>
            <span>Processing query context & searching database...</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </main>

      {/* Quick Search Chips & Input Footer */}
      <footer className="bg-white border-t border-slate-200 p-4 shadow-lg">
        <div className="max-w-4xl mx-auto space-y-3">
          <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
            <span className="text-slate-400 font-medium shrink-0">Quick Search:</span>
            <button
              onClick={() => handleSend('NAZMUL')}
              className="px-3 py-1 rounded-full bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 text-slate-600 transition-colors shrink-0 cursor-pointer"
            >
              "NAZMUL"
            </button>
            <button
              onClick={() => handleSend('30-Mar-26')}
              className="px-3 py-1 rounded-full bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 text-slate-600 transition-colors shrink-0 cursor-pointer"
            >
              "30-Mar-26"
            </button>
            <button
              onClick={() => handleSend('01325293506')}
              className="px-3 py-1 rounded-full bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 text-slate-600 transition-colors shrink-0 cursor-pointer"
            >
              "01325293506"
            </button>
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="flex items-center gap-2"
          >
            <div className="relative flex-1">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                disabled={isTranscribing}
                placeholder={
                  isTranscribing
                    ? 'Transcribing audio...'
                    : isListening
                    ? 'Listening... Click red mic button to stop'
                    : 'Search by Name, Account No, Mobile, ID, or Date...'
                }
                className={`w-full bg-slate-50 border rounded-xl pl-4 pr-11 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all ${
                  isListening
                    ? 'border-rose-400 ring-2 ring-rose-200 bg-rose-50/30'
                    : 'border-slate-200'
                }`}
              />

              {/* Microphone Toggle Button */}
              <button
                type="button"
                onClick={toggleVoiceInput}
                disabled={isTranscribing}
                title={isListening ? 'Stop Listening' : 'Voice Search'}
                className={`absolute right-2.5 top-1/2 -translate-y-1/2 p-1.5 rounded-lg transition-all cursor-pointer ${
                  isListening
                    ? 'bg-rose-500 text-white animate-pulse shadow-sm'
                    : 'text-slate-400 hover:text-indigo-600 hover:bg-slate-100'
                }`}
              >
                {isTranscribing ? (
                  <Loader2 className="w-4 h-4 animate-spin text-indigo-600" />
                ) : isListening ? (
                  <MicOff className="w-4 h-4" />
                ) : (
                  <Mic className="w-4 h-4" />
                )}
              </button>
            </div>

            <button
              type="submit"
              disabled={loading || !input.trim() || isTranscribing}
              className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white px-5 py-3 rounded-xl transition-all shadow-sm flex items-center gap-2 font-medium text-sm shrink-0 cursor-pointer"
            >
              <span>Send</span>
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </footer>

      {/* CSV File Upload Modal Popup */}
      <UploadModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        onUploadSuccess={() => {
          setMessages((prev) => [
            ...prev,
            {
              sender: 'bot',
              text: 'Database file successfully updated! You can now search for new record details.',
              records: []
            }
          ]);
        }}
      />
    </div>
  );
}