import React, { useState, useRef, useEffect } from 'react';
import {
  PlusCircle,
  Clock,
  CheckCircle2,
  UploadCloud,
  MessageSquare,
  Send,
  Bot,
  Sparkles,
  ChevronDown,
  Loader2,
  Lightbulb,
  X,
  ThumbsUp,
  ThumbsDown
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const CATEGORIES = ['Trade', 'Product', 'Packaging'];

const CustomerDashboard = () => {
  const { user } = useAuth();
  const [subject, setSubject] = useState('');
  const [category, setCategory] = useState('');
  const [complaint, setComplaint] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // AI Suggestion states
  const [isSuggesting, setIsSuggesting] = useState(false);
  const [aiSuggestion, setAiSuggestion] = useState(null);
  const [suggestionError, setSuggestionError] = useState('');

  // Chatbot states
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatPhase, setChatPhase] = useState('idle'); // idle | active | resolved
  const [chatMessages, setChatMessages] = useState([]);
  const [currentMessage, setCurrentMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const chatEndRef = useRef(null);

  const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://127.0.0.1:5000';
  const sessionId = useRef(`session_${Date.now()}`);

  useEffect(() => {
    if (isChatOpen) chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages, isTyping, isChatOpen]);

  // ── AI Suggestion ────────────────────────────────────────────────
  const handleAiSuggest = async () => {
    if (!subject.trim() || !complaint.trim() || !category) {
      setSuggestionError('Please fill in Subject, Category, and Details before requesting AI suggestion.');
      return;
    }
    setSuggestionError('');
    setAiSuggestion(null);
    setIsSuggesting(true);

    try {
      const res = await fetch(`${BACKEND_URL}/api/complaints/suggest`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subject, category, complaint_text: complaint })
      });
      const data = await res.json();
      setAiSuggestion(data.suggestion || 'No suggestion available.');

      // Open chat with context from form
      const intro = [
        {
          id: Date.now(),
          sender: 'ai',
          text: `Hi ${user?.name || 'there'}! I've reviewed your complaint about **"${subject}"** (${category} category). Here's my suggestion:\n\n${data.suggestion}\n\nWould you like to discuss this further or shall I help you refine your complaint before submission?`
        }
      ];
      setChatMessages(intro);
      setChatPhase('active');
      setIsChatOpen(true);
    } catch (err) {
      setSuggestionError('Failed to get AI suggestion. Please check if the backend is running.');
    } finally {
      setIsSuggesting(false);
    }
  };

  // ── Chat ─────────────────────────────────────────────────────────
  const handleSendChat = async () => {
    if (!currentMessage.trim()) return;

    const userMsg = currentMessage.trim();
    const newUserMsg = { id: Date.now(), text: userMsg, sender: 'user' };
    setChatMessages(prev => [...prev, newUserMsg]);
    setCurrentMessage('');
    setIsTyping(true);

    try {
      const res = await fetch(`${BACKEND_URL}/api/chat/message`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMsg,
          session_id: sessionId.current,
          context: { subject, category, complaint_text: complaint }
        })
      });
      const data = await res.json();
      setChatMessages(prev => [
        ...prev,
        { id: Date.now() + 1, text: data.reply || "I couldn't process that. Please try again.", sender: 'ai' }
      ]);
    } catch {
      setChatMessages(prev => [
        ...prev,
        { id: Date.now() + 1, text: '⚠️ Unable to reach the AI server.', sender: 'ai' }
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  // ── User agrees with AI → close chat, keep form ──────────────────
  const handleAgreeWithBot = () => {
    setChatPhase('resolved');
    setIsChatOpen(false);
    setAiSuggestion(null);
    // Optionally pre-fill a note
    setChatMessages([]);
    alert('Great! You can now review and edit your complaint before submitting.');
  };

  // ── User disagrees → submit directly ─────────────────────────────
  const handleDisagreeAndSubmit = async () => {
    setIsChatOpen(false);
    await submitComplaint();
  };

  // ── Submit complaint ──────────────────────────────────────────────
  const submitComplaint = async () => {
    setIsSubmitting(true);
    try {
      const res = await fetch(`${BACKEND_URL}/api/complaints/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject,
          category,
          complaint_text: complaint,
          customer_id: user?.id
        })
      });
      const data = await res.json();
      if (res.ok) {
        alert(`✅ Complaint submitted! Ticket ID: ${data.ticket_id || 'N/A'}`);
        setSubject(''); setCategory(''); setComplaint('');
        setAiSuggestion(null); setChatMessages([]); setChatPhase('idle');
      } else {
        alert(`❌ Submission failed: ${data.error || 'Unknown error'}`);
      }
    } catch {
      alert('❌ Could not reach the server. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    submitComplaint();
  };

  const mockTickets = [
    { id: 'TKT-1042', title: 'Payment failed but amount deducted', status: 'In Progress', priority: 'High', date: '2 hours ago' },
    { id: 'TKT-1040', title: 'Cannot access my account', status: 'Resolved', priority: 'Medium', date: 'Yesterday' },
  ];

  return (
    <div className="animate-fade-in" style={{ position: 'relative', minHeight: 'calc(100vh - 120px)' }}>
      <div className="dashboard-grid">

        {/* ── Main Form ── */}
        <div className="col-span-8">
          <div className="card" style={{ height: '100%' }}>
            <div className="card-header">
              <h3 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <PlusCircle size={20} className="brand-icon" /> Submit New Complaint
              </h3>
            </div>

            <form onSubmit={handleFormSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', marginTop: '1rem' }}>

              {/* Subject */}
              <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <label style={{ fontSize: '0.875rem', fontWeight: 500 }}>Issue Subject</label>
                <input
                  type="text"
                  placeholder="e.g., Service Interruption in Region A"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  style={{ padding: '0.875rem 1rem', border: '1px solid var(--border-strong)', borderRadius: 'var(--radius-md)', background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
                  required
                />
              </div>

              {/* Category Dropdown */}
              <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <label style={{ fontSize: '0.875rem', fontWeight: 500 }}>Category</label>
                <div style={{ position: 'relative' }}>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    required
                    style={{
                      width: '100%',
                      padding: '0.875rem 2.5rem 0.875rem 1rem',
                      border: '1px solid var(--border-strong)',
                      borderRadius: 'var(--radius-md)',
                      background: 'var(--bg-secondary)',
                      color: category ? 'var(--text-primary)' : 'var(--text-muted)',
                      appearance: 'none',
                      cursor: 'pointer',
                      fontSize: '0.9rem'
                    }}
                  >
                    <option value="" disabled>Select a category...</option>
                    {CATEGORIES.map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                  <ChevronDown size={16} style={{ position: 'absolute', right: '1rem', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: 'var(--text-muted)' }} />
                </div>
              </div>

              {/* Detailed Info */}
              <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <label style={{ fontSize: '0.875rem', fontWeight: 500 }}>Detailed Information</label>
                <textarea
                  placeholder="Please provide as much detail as possible..."
                  rows="5"
                  value={complaint}
                  onChange={(e) => setComplaint(e.target.value)}
                  style={{ padding: '0.875rem 1rem', border: '1px solid var(--border-strong)', borderRadius: 'var(--radius-md)', background: 'var(--bg-secondary)', color: 'var(--text-primary)', resize: 'vertical' }}
                  required
                />
              </div>

              {/* Upload Zone */}
              <div style={{ border: '1px dashed var(--border-strong)', borderRadius: 'var(--radius-md)', padding: '2rem', textAlign: 'center', background: 'var(--bg-secondary)' }}>
                <UploadCloud size={32} style={{ margin: '0 auto 1rem', color: 'var(--brand-primary)' }} />
                <p style={{ fontSize: '0.875rem', fontWeight: 500 }}>Upload supporting documents or screenshots</p>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Max file size: 10MB</p>
              </div>

              {/* Error message */}
              {suggestionError && (
                <div style={{ padding: '0.75rem 1rem', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 'var(--radius-md)', color: '#dc2626', fontSize: '0.85rem' }}>
                  {suggestionError}
                </div>
              )}

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: '1rem' }}>
                {/* AI Suggestion Button */}
                <button
                  type="button"
                  onClick={handleAiSuggest}
                  disabled={isSuggesting}
                  style={{
                    flex: 1,
                    padding: '1rem',
                    border: '2px solid var(--brand-primary)',
                    borderRadius: 'var(--radius-md)',
                    background: 'transparent',
                    color: 'var(--brand-primary)',
                    fontWeight: 600,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    cursor: 'pointer',
                    transition: '0.2s'
                  }}
                  onMouseOver={e => { e.currentTarget.style.background = 'var(--brand-primary)'; e.currentTarget.style.color = 'white'; }}
                  onMouseOut={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--brand-primary)'; }}
                >
                  {isSuggesting
                    ? <><Loader2 size={16} className="animate-spin" /> Analyzing...</>
                    : <><Lightbulb size={16} /> Get AI Suggestion</>}
                </button>

                {/* File Complaint Button */}
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ flex: 1, padding: '1rem' }}
                  disabled={isSubmitting}
                >
                  {isSubmitting
                    ? <><Loader2 size={16} className="animate-spin" /> Submitting...</>
                    : 'File Official Complaint'}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* ── Sidebar ── */}
        <div className="col-span-4" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div className="card">
            <div className="card-header">
              <h3 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Clock size={16} /> Resolution Status
              </h3>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem', background: 'var(--bg-secondary)', borderRadius: '8px' }}>
                <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Pending AI Triage</span>
                <span style={{ fontWeight: 700, color: 'var(--brand-primary)' }}>1</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem', background: 'var(--bg-secondary)', borderRadius: '8px' }}>
                <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Active Tickets</span>
                <span style={{ fontWeight: 700, color: 'var(--brand-accent)' }}>{mockTickets.length}</span>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <h3 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <CheckCircle2 size={16} /> Recent Activity
              </h3>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem' }}>
              {mockTickets.map(ticket => (
                <div key={ticket.id} style={{ padding: '1rem', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--brand-primary)' }}>{ticket.id}</span>
                    <span className={`badge ${ticket.priority.toLowerCase()}`} style={{ fontSize: '0.65rem' }}>{ticket.priority}</span>
                  </div>
                  <div style={{ fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.25rem' }}>{ticket.title}</div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    <span>{ticket.status}</span>
                    <span>{ticket.date}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── Chatbot ── */}
      <div style={{ position: 'fixed', bottom: '2rem', right: '2rem', zIndex: 1000 }}>
        {!isChatOpen ? (
          <button
            onClick={() => setIsChatOpen(true)}
            className="btn btn-primary"
            style={{ width: '60px', height: '60px', borderRadius: '50%', boxShadow: '0 8px 25px rgba(37,99,235,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            <MessageSquare size={28} />
          </button>
        ) : (
          <div className="card" style={{ width: '370px', height: '550px', display: 'flex', flexDirection: 'column', padding: 0, boxShadow: 'var(--shadow-lg)', overflow: 'hidden', border: '1px solid var(--border-strong)' }}>

            {/* Header */}
            <div style={{ padding: '1rem', background: 'var(--brand-primary)', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Bot size={20} />
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>ResolveX AI Agent</div>
                  <div style={{ fontSize: '0.65rem', opacity: 0.8 }}>Powered by Gemini</div>
                </div>
              </div>
              <button onClick={() => setIsChatOpen(false)} style={{ color: 'white', background: 'none', border: 'none', cursor: 'pointer' }}>
                <X size={18} />
              </button>
            </div>

            {/* Empty state */}
            {chatMessages.length === 0 && (
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '1rem', padding: '2rem', color: 'var(--text-muted)', textAlign: 'center' }}>
                <Sparkles size={40} style={{ color: 'var(--brand-primary)', opacity: 0.5 }} />
                <p style={{ fontSize: '0.875rem' }}>Fill in your complaint form and click <strong>Get AI Suggestion</strong> to start a conversation.</p>
              </div>
            )}

            {/* Messages */}
            {chatMessages.length > 0 && (
              <div style={{ flex: 1, padding: '1rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1rem', background: 'var(--bg-primary)' }}>
                {chatMessages.map(msg => (
                  <div key={msg.id} style={{
                    alignSelf: msg.sender === 'user' ? 'flex-end' : 'flex-start',
                    maxWidth: '88%',
                    padding: '0.75rem 1rem',
                    borderRadius: msg.sender === 'user' ? '15px 15px 2px 15px' : '15px 15px 15px 2px',
                    background: msg.sender === 'user' ? 'var(--brand-primary)' : 'var(--bg-secondary)',
                    color: msg.sender === 'user' ? 'white' : 'var(--text-primary)',
                    fontSize: '0.85rem',
                    whiteSpace: 'pre-wrap',
                    border: msg.sender === 'ai' ? '1px solid var(--border-subtle)' : 'none',
                    lineHeight: 1.5
                  }}>
                    {msg.text}
                  </div>
                ))}
                {isTyping && (
                  <div style={{ alignSelf: 'flex-start', background: 'var(--bg-secondary)', padding: '0.6rem 1rem', borderRadius: '15px', display: 'flex', gap: '5px', alignItems: 'center' }}>
                    {[0, 0.2, 0.4].map((d, i) => (
                      <div key={i} className="animate-pulse" style={{ width: '5px', height: '5px', background: 'var(--text-muted)', borderRadius: '50%', animationDelay: `${d}s` }} />
                    ))}
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>
            )}

            {/* Agree / Disagree Buttons (shown when AI suggestion phase is active) */}
            {chatPhase === 'active' && chatMessages.length > 0 && (
              <div style={{ padding: '0.75rem 1rem', background: 'var(--bg-secondary)', borderTop: '1px solid var(--border-subtle)', display: 'flex', gap: '0.5rem' }}>
                <button
                  onClick={handleAgreeWithBot}
                  style={{ flex: 1, padding: '0.6rem', borderRadius: '8px', background: '#dcfce7', border: '1px solid #86efac', color: '#16a34a', fontWeight: 600, fontSize: '0.8rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px', cursor: 'pointer' }}
                >
                  <ThumbsUp size={14} /> Agree & Revise
                </button>
                <button
                  onClick={handleDisagreeAndSubmit}
                  style={{ flex: 1, padding: '0.6rem', borderRadius: '8px', background: '#fef2f2', border: '1px solid #fca5a5', color: '#dc2626', fontWeight: 600, fontSize: '0.8rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px', cursor: 'pointer' }}
                >
                  <ThumbsDown size={14} /> Submit As-Is
                </button>
              </div>
            )}

            {/* Input */}
            <div style={{ padding: '1rem', background: 'var(--bg-card)', borderTop: '1px solid var(--border-subtle)' }}>
              <div style={{ display: 'flex', gap: '0.5rem', background: 'var(--bg-secondary)', borderRadius: '25px', padding: '4px 4px 4px 12px', border: '1px solid var(--border-strong)' }}>
                <input
                  type="text"
                  placeholder="Message the agent..."
                  value={currentMessage}
                  onChange={(e) => setCurrentMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSendChat()}
                  style={{ flex: 1, background: 'none', border: 'none', fontSize: '0.85rem', outline: 'none', color: 'var(--text-primary)' }}
                />
                <button
                  onClick={handleSendChat}
                  style={{ width: '32px', height: '32px', background: 'var(--brand-primary)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', border: 'none', cursor: 'pointer' }}
                >
                  <Send size={14} />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CustomerDashboard;