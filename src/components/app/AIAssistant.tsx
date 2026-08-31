import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, X, Send, TrendingUp, ShieldAlert, Bot } from 'lucide-react';
import { Drawer } from '@/components/ui/Drawer';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { useApp } from '@/lib/store';
import { useNavigate } from 'react-router-dom';
import { aiAssistantSuggestions } from '@/lib/mockData';
import { cn } from '@/lib/utils';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  actions?: { label: string; type: string; opportunityId: string }[];
  confidence?: string;
  impact?: string;
}

export function AIAssistant({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { pushToast, setOpportunityStatus } = useApp();
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'init',
      role: 'assistant',
      text: 'Hi! I\'m your MerchantOS AI assistant. I can help you find revenue opportunities, understand agent activity, and explain policy decisions. What would you like to know?',
    },
  ]);
  const [input, setInput] = useState('');
  const [thinking, setThinking] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, thinking]);

  const suggestions = [
    'How can I increase revenue this month?',
    'Why was the Procurement Agent paused?',
    'What revenue opportunities do I have?',
  ];

  const handleSend = (text: string) => {
    if (!text.trim()) return;
    const userMsg: Message = { id: Math.random().toString(36), role: 'user', text };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setThinking(true);

    setTimeout(() => {
      const match = aiAssistantSuggestions.find((s) =>
        text.toLowerCase().includes(s.query.toLowerCase().split(' ').slice(0, 3).join(' ').toLowerCase()) ||
        s.query.toLowerCase().includes(text.toLowerCase().split(' ')[0]?.toLowerCase() ?? '')
      );

      let response: Message;
      if (text.toLowerCase().includes('revenue') || text.toLowerCase().includes('increase')) {
        const s = aiAssistantSuggestions[0];
        response = {
          id: Math.random().toString(36),
          role: 'assistant',
          text: s.response,
          actions: s.actions,
          confidence: s.confidence,
          impact: s.impact,
        };
      } else if (text.toLowerCase().includes('paused') || text.toLowerCase().includes('procurement')) {
        const s = aiAssistantSuggestions[1];
        response = {
          id: Math.random().toString(36),
          role: 'assistant',
          text: s.response,
          actions: s.actions,
          confidence: s.confidence,
          impact: s.impact,
        };
      } else if (text.toLowerCase().includes('opportunit')) {
        response = {
          id: Math.random().toString(36),
          role: 'assistant',
          text: 'You currently have 4 revenue opportunities. The highest-impact one is bundling the Laptop Sleeve with the AeroBook Pro — estimated +₹18,400/month with high confidence and low risk. I also found a catalog issue (missing delivery time on Laptop Sleeve) and a pricing adjustment for the Mechanical Keyboard.',
          actions: [{ label: 'View Growth Intelligence', type: 'review', opportunityId: 'opp1' }],
          confidence: 'high',
          impact: '₹38,500/month total',
        };
      } else if (match) {
        response = {
          id: Math.random().toString(36),
          role: 'assistant',
          text: match.response,
          actions: match.actions,
          confidence: match.confidence,
          impact: match.impact,
        };
      } else {
        response = {
          id: Math.random().toString(36),
          role: 'assistant',
          text: 'I can help with revenue opportunities, agent activity, policy decisions, and OpenTab management. Try asking about revenue, a specific agent, or your current opportunities.',
        };
      }
      setMessages((prev) => [...prev, response]);
      setThinking(false);
    }, 1000);
  };

  const handleAction = (action: { label: string; type: string; opportunityId: string }) => {
    if (action.type === 'simulate') {
      setOpportunityStatus(action.opportunityId, 'simulated');
      pushToast({ type: 'info', title: 'Simulating bundle', message: 'Opening the Growth Intelligence simulator...' });
      navigate('/app/growth');
      onClose();
    } else if (action.type === 'review') {
      if (action.opportunityId.startsWith('agent_')) {
        navigate('/app/identity');
      } else {
        navigate('/app/growth');
      }
      onClose();
    }
  };

  return (
    <Drawer open={open} onClose={onClose} title="AI Assistant" subtitle="Ask about revenue, agents, or policies">
      <div className="flex flex-col h-full -m-5">
        <div className="flex-1 overflow-y-auto scrollbar-thin p-5 space-y-4">
          {messages.map((msg) => (
            <motion.div key={msg.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              className={cn('flex', msg.role === 'user' ? 'justify-end' : 'justify-start')}>
              <div className={cn('max-w-[85%]', msg.role === 'user' ? 'bg-electric-500/15 border border-electric-500/30 rounded-2xl rounded-br-md' : 'bg-ink-800/60 border border-ink-700/50 rounded-2xl rounded-bl-md')}>
                {msg.role === 'assistant' && (
                  <div className="flex items-center gap-1.5 px-4 pt-3">
                    <Sparkles className="w-3.5 h-3.5 text-electric-400" />
                    <span className="text-2xs font-medium text-electric-300">Assistant</span>
                  </div>
                )}
                <p className="px-4 py-3 text-sm text-ink-200 leading-relaxed">{msg.text}</p>
                {msg.confidence && (
                  <div className="px-4 pb-3 flex flex-wrap items-center gap-2">
                    <Badge tone={msg.confidence === 'high' ? 'success' : 'warning'}>Confidence: {msg.confidence}</Badge>
                    {msg.impact && msg.impact !== '—' && <Badge tone="electric">Impact: {msg.impact}</Badge>}
                  </div>
                )}
                {msg.actions && (
                  <div className="px-4 pb-3 flex flex-wrap gap-2">
                    {msg.actions.map((a, i) => (
                      <button key={i} onClick={() => handleAction(a)}
                        className="text-xs px-3 py-1.5 rounded-lg bg-electric-500/10 border border-electric-500/30 text-electric-300 hover:bg-electric-500/20 transition-colors">
                        {a.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          ))}
          {thinking && (
            <div className="flex justify-start">
              <div className="bg-ink-800/60 border border-ink-700/50 rounded-2xl rounded-bl-md px-4 py-3">
                <div className="flex gap-1.5">
                  {[0, 1, 2].map((i) => (
                    <motion.div key={i} className="w-2 h-2 rounded-full bg-electric-400"
                      animate={{ opacity: [0.3, 1, 0.3] }} transition={{ duration: 1, delay: i * 0.2, repeat: Infinity }} />
                  ))}
                </div>
              </div>
            </div>
          )}
          <div ref={endRef} />
        </div>

        {messages.length <= 1 && (
          <div className="px-5 pb-3">
            <p className="text-2xs text-ink-500 mb-2 uppercase tracking-wider">Try asking</p>
            <div className="space-y-1.5">
              {suggestions.map((s) => (
                <button key={s} onClick={() => handleSend(s)}
                  className="w-full text-left text-xs text-ink-300 px-3 py-2 rounded-lg bg-ink-800/40 border border-ink-700/40 hover:border-electric-500/30 transition-colors">
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="p-5 border-t border-ink-700/40">
          <div className="flex items-center gap-2">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend(input)}
              placeholder="Ask anything..."
              className="flex-1 bg-ink-800/60 border border-ink-700/50 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder:text-ink-500 focus:outline-none focus:border-electric-500/40"
            />
            <button onClick={() => handleSend(input)} className="w-10 h-10 rounded-xl bg-electric-500 hover:bg-electric-400 flex items-center justify-center transition-colors">
              <Send className="w-4 h-4 text-white" />
            </button>
          </div>
          <p className="text-2xs text-ink-500 mt-2">Sensitive actions require explicit confirmation.</p>
        </div>
      </div>
    </Drawer>
  );
}
