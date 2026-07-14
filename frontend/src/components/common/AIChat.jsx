import { useEffect, useRef, useState } from 'react';
import { Bot, X, Send } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import aiService from '../../services/aiService';

const roleLabel = {
  ceo: 'CEO Assistant',
  admin: 'HR Assistant',
  manager: 'Manager Assistant',
  employee: 'My Assistant',
};

const rolePrompts = {
  ceo: [
    'How is my company performing?',
    'Which department needs attention?',
    'Summarize workforce health',
  ],
  admin: [
    'Which employees need attention?',
    'Give me an attendance summary',
    'Help me draft a job posting',
  ],
  manager: [
    "How's my team doing?",
    'Any workload issues this week?',
    'Suggest ways to improve attendance',
  ],
  employee: [
    "What's my attendance this month?",
    'What is the leave policy?',
    'Show my recent check-ins',
  ],
};

const AIChat = () => {
  const { currentUser } = useAuth();
  const role = currentUser?.role || 'employee';

  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [historyLoaded, setHistoryLoaded] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => {
    if (open && !historyLoaded) {
      aiService
        .getChatHistory()
        .then((res) => {
          const history = res?.data?.history || [];
          const loaded = history.flatMap((h) => [
            { role: 'user', text: h.question },
            { role: 'ai', text: h.answer },
          ]);
          setMessages(loaded);
        })
        .catch(() => {})
        .finally(() => setHistoryLoaded(true));
    }
  }, [open, historyLoaded]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, loading]);

  const sendMessage = async (text) => {
    const question = (text ?? input).trim();
    if (!question || loading) return;

    setMessages((prev) => [...prev, { role: 'user', text: question }]);
    setInput('');
    setLoading(true);

    try {
      const res = await aiService.chat(question);
      const answer = res?.data?.answer || 'No response';
      setMessages((prev) => [...prev, { role: 'ai', text: answer }]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        { role: 'ai', text: `⚠️ ${err.message || 'Something went wrong'}` },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Floating toggle button */}
      <button
        onClick={() => setOpen((o) => !o)}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-gradient-to-br from-indigo-500 to-violet-500 shadow-lg shadow-indigo-500/30 flex items-center justify-center hover:scale-105 transition-transform"
        aria-label="Open AI Assistant"
      >
        {open ? <X size={22} /> : <Bot size={22} />}
      </button>

      {open && (
        <div className="fixed bottom-24 right-6 z-50 w-[380px] max-w-[92vw] h-[520px] max-h-[75vh] bg-[#0f1117] border border-white/10 rounded-2xl shadow-2xl flex flex-col overflow-hidden">
          {/* Header */}
          <div className="px-5 py-4 border-b border-white/10 bg-white/[0.02]">
            <p className="text-sm font-semibold text-white flex items-center gap-2">
              <Bot size={16} className="text-indigo-300" /> {roleLabel[role] || 'AI Assistant'}
            </p>
            <p className="text-xs text-white/40 capitalize">{role} mode</p>
          </div>

          {/* Messages */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
            {messages.length === 0 && (
              <div className="space-y-2">
                <p className="text-xs text-white/40 mb-2">Try asking:</p>
                {(rolePrompts[role] || rolePrompts.employee).map((prompt) => (
                  <button
                    key={prompt}
                    onClick={() => sendMessage(prompt)}
                    className="block w-full text-left px-3 py-2 rounded-lg text-xs text-white/70 bg-white/5 hover:bg-white/10 transition-colors"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            )}

            {messages.map((m, i) => (
              <div
                key={i}
                className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[85%] px-3.5 py-2.5 rounded-2xl text-sm whitespace-pre-wrap ${
                    m.role === 'user'
                      ? 'bg-indigo-500/20 text-indigo-100 rounded-br-sm'
                      : 'bg-white/5 text-white/85 rounded-bl-sm'
                  }`}
                >
                  {m.text}
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex justify-start">
                <div className="px-3.5 py-2.5 rounded-2xl bg-white/5 flex gap-1">
                  <span className="w-1.5 h-1.5 bg-white/40 rounded-full animate-bounce [animation-delay:-0.3s]" />
                  <span className="w-1.5 h-1.5 bg-white/40 rounded-full animate-bounce [animation-delay:-0.15s]" />
                  <span className="w-1.5 h-1.5 bg-white/40 rounded-full animate-bounce" />
                </div>
              </div>
            )}
          </div>

          {/* Input */}
          <div className="p-3 border-t border-white/10 flex items-center gap-2">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
              placeholder="Ask anything..."
              className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-white/30 outline-none focus:border-indigo-400/50"
            />
            <button
              onClick={() => sendMessage()}
              disabled={loading || !input.trim()}
              className="w-9 h-9 flex items-center justify-center rounded-lg bg-indigo-500 hover:bg-indigo-400 disabled:opacity-40 text-white transition-colors"
            >
              <Send size={16} />
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default AIChat;
