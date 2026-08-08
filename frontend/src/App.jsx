import { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { Send, Database, Sparkles, RefreshCw, Upload } from 'lucide-react';
import ChatMessage from './components/ChatMessage';
import UploadModal from './components/UploadModal';

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
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const handleSend = async (queryToSubmit) => {
    const query = (queryToSubmit || input).trim();
    if (!query || loading) return;

    const userMsg = { sender: 'user', text: query };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const response = await axios.post('http://127.0.0.1:8000/api/chat', {
        message: query
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
          {/* Upload CSV Button */}
          <button
            onClick={() => setIsUploadOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-full transition-all shadow-2xs"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Upload CSV</span>
          </button>

          {/* System Ready Badge */}
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
            <span>Searching database...</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </main>

      {/* Quick Search Chips & Input Footer */}
      <footer className="bg-white border-t border-slate-200 p-4 shadow-lg">
        <div className="max-w-4xl mx-auto space-y-3">
          {/* Quick Search Suggestions */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
            <span className="text-slate-400 font-medium shrink-0">Quick Search:</span>
            <button
              onClick={() => handleSend('NAZMUL')}
              className="px-3 py-1 rounded-full bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 text-slate-600 transition-colors shrink-0"
            >
              "NAZMUL"
            </button>
            <button
              onClick={() => handleSend('30-Mar-26')}
              className="px-3 py-1 rounded-full bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 text-slate-600 transition-colors shrink-0"
            >
              "30-Mar-26"
            </button>
            <button
              onClick={() => handleSend('01325293506')}
              className="px-3 py-1 rounded-full bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 text-slate-600 transition-colors shrink-0"
            >
              "01325293506"
            </button>
          </div>

          {/* Form Input */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Search by Name, Account No, Mobile, ID, or Date..."
              className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white px-5 py-3 rounded-xl transition-all shadow-sm flex items-center gap-2 font-medium text-sm shrink-0"
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