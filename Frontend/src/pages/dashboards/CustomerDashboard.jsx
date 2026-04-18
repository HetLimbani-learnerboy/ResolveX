import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useLocation } from 'react-router-dom';
import {
  PlusCircle,
  Clock,
  CheckCircle2,
  MessageSquare,
  Send,
  Bot,
  Sparkles,
  ChevronDown,
  Loader2,
  Lightbulb,
  X,
  ThumbsUp,
  ThumbsDown,
  Activity,
  Bell,
  Star,
  Archive
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const CATEGORIES = ['Trade', 'Product', 'Packaging'];

const CustomerDashboard = () => {
  const { user } = useAuth();
  const location = useLocation();
  const hash = location.hash || '';

  const [subject, setSubject] = useState('');
  const [category, setCategory] = useState('');
  const [complaint, setComplaint] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);

  // AI Suggestion states
  const [isSuggesting, setIsSuggesting] = useState(false);
  const [aiSuggestion, setAiSuggestion] = useState(null);
  const [suggestionError, setSuggestionError] = useState('');

  // Chatbot states
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatPhase, setChatPhase] = useState('idle');
  const [chatMessages, setChatMessages] = useState([]);
  const [currentMessage, setCurrentMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const chatEndRef = useRef(null);

  // Real data states
  const [tickets, setTickets] = useState([]);
  const [dataLoading, setDataLoading] = useState(true);

  // Feedback states
  const [selectedComplaintId, setSelectedComplaintId] = useState('');
  const [feedbackRating, setFeedbackRating] = useState(0);
  const [feedbackHover, setFeedbackHover] = useState(0);
  const [feedbackText, setFeedbackText] = useState('');
  const [feedbackSubmitting, setFeedbackSubmitting] = useState(false);
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);

  const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://127.0.0.1:5000';
  const sessionId = useRef(`session_${Date.now()}`);

  // Fetch real complaints from database
  useEffect(() => {
    fetch(`${BACKEND_URL}/api/complaints/all`)
      .then(res => res.ok ? res.json() : [])
      .then(data => {
        setTickets(Array.isArray(data) ? data : []);
        setDataLoading(false);
      })
      .catch(() => setDataLoading(false));
  }, [BACKEND_URL]);

  useEffect(() => {
    if (isChatOpen) chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages, isTyping, isChatOpen]);

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

      const intro = [
        {
          id: Date.now(),
          sender: 'ai',
          text: `Hi ${user?.name || 'there'}! I've reviewed your complaint about **"${subject}"** (${category} category). Here's my suggestion:\n\n${data.suggestion}\n\nWould you like to discuss this further or shall I help you refine your complaint before submission?`
        }
      ];
      setChatMessages(intro);
      setChatPhase('active');
      setIsModalOpen(false); // Close form to focus on chat
      setIsChatOpen(true);
    } catch (err) {
      setSuggestionError('Failed to get AI suggestion. Please check if the backend is running.');
    } finally {
      setIsSuggesting(false);
    }
  };

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

  const handleAgreeWithBot = () => {
    setChatPhase('resolved');
    setIsChatOpen(false);
    setAiSuggestion(null);
    setChatMessages([]);
    setIsModalOpen(true); // Re-open the modal so user can edit and submit
  };

  const handleDisagreeAndSubmit = async () => {
    setIsChatOpen(false);
    await submitComplaint();
  };

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
        setIsModalOpen(false); // Close Modal on success
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

  // Build track-status data from real tickets
  const trackableTickets = tickets.map(t => {
    let progress = 0;
    const s = (t.status || 'Open').toLowerCase();
    if (s === 'open') progress = 10;
    else if (s === 'in progress' || s === 'assigned') progress = 50;
    else if (s === 'resolved' || s === 'closed') progress = 100;
    else progress = 33;
    return {
      id: String(t.id).substring(0, 8).toUpperCase(),
      title: t.subject || (t.complaint_text ? t.complaint_text.substring(0, 50) : 'No Subject'),
      status: t.status || 'Open',
      category: t.category || 'General',
      date: t.created_at ? new Date(t.created_at).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' }) : 'N/A',
      progress
    };
  });

  // Build notifications from real ticket data
  const notifications = [
    { id: 'welcome', text: 'Welcome to ResolveX! We are here to help you resolve issues.', time: 'System', read: true },
    ...tickets.slice(0, 5).map((t, i) => {
      const status = (t.status || 'Open').toLowerCase();
      let msg = '';
      if (status === 'resolved' || status === 'closed') msg = `Your ticket "${t.subject || 'complaint'}" has been resolved. Please leave feedback.`;
      else if (status === 'in progress' || status === 'assigned') msg = `Your ticket "${t.subject || 'complaint'}" has been assigned to an agent.`;
      else msg = `Your ticket "${t.subject || 'complaint'}" has been received. We are reviewing it.`;
      return {
        id: t.id || i,
        text: msg,
        time: t.created_at ? new Date(t.created_at).toLocaleDateString('en-US', { day: 'numeric', month: 'short' }) : 'Recently',
        read: status === 'open'
      };
    })
  ];

  const renderComplaintModal = () => {
    if (!isModalOpen) return null;
    return createPortal(
      <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15,23,42,0.5)', backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)', zIndex: 999998, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem', overflowY: 'auto' }}>
        <div className="card animate-fade-in" style={{ width: '100%', maxWidth: '750px', background: 'var(--bg-card)', borderRadius: '16px', boxShadow: '0 20px 60px rgba(0,0,0,0.3)', margin: 'auto' }}>
          <div style={{ padding: '1.5rem 1.5rem 1rem', borderBottom: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1.25rem', margin: 0, color: 'var(--text-primary)' }}>
              <div style={{ padding: '6px', background: 'var(--brand-primary)', borderRadius: '8px', color: 'white' }}>
                <PlusCircle size={18} />
              </div>
              Submit New Complaint
            </h3>
            <button onClick={() => setIsModalOpen(false)} style={{ background: 'var(--bg-secondary)', border: 'none', cursor: 'pointer', padding: '6px', borderRadius: '50%', color: 'var(--text-secondary)', transition: 'background 0.2s', display: 'flex' }} onMouseOver={e => e.currentTarget.style.background = 'var(--border-strong)'} onMouseOut={e => e.currentTarget.style.background = 'var(--bg-secondary)'}>
              <X size={18} />
            </button>
          </div>
          
          <form onSubmit={handleFormSubmit} style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div style={{ display: 'flex', gap: '1.5rem' }}>
              <div className="form-group" style={{ flex: 2, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <label style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Issue Subject</label>
                <input
                  type="text"
                  placeholder="e.g., Service Interruption in Region A"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  style={{ padding: '0.875rem 1rem', border: '1px solid var(--border-strong)', borderRadius: '8px', background: 'var(--bg-primary)', color: 'var(--text-primary)', transition: 'all 0.2s', outline: 'none' }}
                  onFocus={e => e.target.style.borderColor = 'var(--brand-primary)'}
                  onBlur={e => e.target.style.borderColor = 'var(--border-strong)'}
                  required
                />
              </div>

              <div className="form-group" style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <label style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Category</label>
                <div style={{ position: 'relative' }}>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    required
                    style={{ width: '100%', padding: '0.875rem 2.5rem 0.875rem 1rem', border: '1px solid var(--border-strong)', borderRadius: '8px', background: 'var(--bg-primary)', color: category ? 'var(--text-primary)' : 'var(--text-muted)', appearance: 'none', cursor: 'pointer', outline: 'none', transition: 'all 0.2s' }}
                    onFocus={e => e.target.style.borderColor = 'var(--brand-primary)'}
                    onBlur={e => e.target.style.borderColor = 'var(--border-strong)'}
                  >
                    <option value="" disabled>Select category...</option>
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                  <ChevronDown size={16} style={{ position: 'absolute', right: '1rem', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: 'var(--text-muted)' }} />
                </div>
              </div>
            </div>

            <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <label style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Detailed Information</label>
              <textarea
                placeholder="Please provide as much detail as possible to help us resolve the issue quickly..."
                rows="5"
                value={complaint}
                onChange={(e) => setComplaint(e.target.value)}
                style={{ padding: '0.875rem 1rem', border: '1px solid var(--border-strong)', borderRadius: '8px', background: 'var(--bg-primary)', color: 'var(--text-primary)', resize: 'vertical', outline: 'none', transition: 'all 0.2s' }}
                onFocus={e => e.target.style.borderColor = 'var(--brand-primary)'}
                onBlur={e => e.target.style.borderColor = 'var(--border-strong)'}
                required
              />
            </div>

            {suggestionError && (
              <div style={{ padding: '0.75rem 1rem', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', color: '#dc2626', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Activity size={16} /> {suggestionError}
              </div>
            )}

            <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
              <button
                type="button"
                onClick={handleAiSuggest}
                disabled={isSuggesting}
                style={{
                  flex: 1, padding: '1rem', border: '2px solid var(--brand-primary)', borderRadius: '8px', background: 'transparent', color: 'var(--brand-primary)', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', cursor: 'pointer', transition: 'all 0.2s'
                }}
                onMouseOver={e => { e.currentTarget.style.background = 'var(--brand-primary)'; e.currentTarget.style.color = 'white'; }}
                onMouseOut={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--brand-primary)'; }}
              >
                {isSuggesting
                  ? <><Loader2 size={18} className="animate-spin" /> Analyzing Report...</>
                  : <><Bot size={18} /> Get AI Resolution Suggestion</>}
              </button>

              <button
                type="submit"
                disabled={isSubmitting}
                style={{
                  flex: 1, padding: '1rem', border: 'none', borderRadius: '8px', background: 'linear-gradient(135deg, var(--brand-primary) 0%, #1d4ed8 100%)', color: 'white', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', cursor: 'pointer', transition: 'filter 0.2s'
                }}
                onMouseOver={e => e.currentTarget.style.filter = 'brightness(1.1)'}
                onMouseOut={e => e.currentTarget.style.filter = 'brightness(1)'}
              >
                {isSubmitting
                  ? <><Loader2 size={18} className="animate-spin" /> Submitting...</>
                  : <><Send size={18} /> Submit Official Complaint</>}
              </button>
            </div>
          </form>
        </div>
      </div>,
      document.body
    );
  };

  const renderHistory = () => (
    <div className="card animate-fade-in" style={{ background: 'linear-gradient(145deg, var(--bg-card) 0%, rgba(37,99,235,0.03) 100%)', border: '1px solid rgba(37,99,235,0.1)' }}>
      <div className="card-header" style={{ borderBottom: '1px solid var(--border-subtle)', paddingBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h3 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1.25rem' }}>
            <div style={{ padding: '8px', background: 'var(--brand-primary)', borderRadius: '8px', color: 'white' }}>
              <Archive size={20} />
            </div>
            Complaint History
          </h3>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Overview of your past and present issues</span>
        </div>
        <button onClick={() => setIsModalOpen(true)} style={{ padding: '0.6rem 1rem', background: 'var(--brand-primary)', color: 'white', border: 'none', borderRadius: '8px', fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', transition: 'all 0.2s', boxShadow: '0 2px 8px rgba(37,99,235,0.2)' }} onMouseOver={e => e.currentTarget.style.transform = 'translateY(-1px)'} onMouseOut={e => e.currentTarget.style.transform = 'translateY(0)'}>
          <PlusCircle size={16} /> New Complaint
        </button>
      </div>

      <div style={{ marginTop: '1.5rem', overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={{ textAlign: 'left', padding: '1rem', borderBottom: '2px solid var(--border-subtle)', color: 'var(--text-secondary)', fontSize: '0.85rem', fontWeight: 600 }}>TICKET ID</th>
              <th style={{ textAlign: 'left', padding: '1rem', borderBottom: '2px solid var(--border-subtle)', color: 'var(--text-secondary)', fontSize: '0.85rem', fontWeight: 600 }}>PRODUCT / CATEGORY</th>
              <th style={{ textAlign: 'left', padding: '1rem', borderBottom: '2px solid var(--border-subtle)', color: 'var(--text-secondary)', fontSize: '0.85rem', fontWeight: 600 }}>SUBJECT</th>
              <th style={{ textAlign: 'left', padding: '1rem', borderBottom: '2px solid var(--border-subtle)', color: 'var(--text-secondary)', fontSize: '0.85rem', fontWeight: 600 }}>STATUS</th>
              <th style={{ textAlign: 'left', padding: '1rem', borderBottom: '2px solid var(--border-subtle)', color: 'var(--text-secondary)', fontSize: '0.85rem', fontWeight: 600 }}>DATE</th>
            </tr>
          </thead>
          <tbody>
            {tickets.length > 0 ? tickets.map((row, index) => {
              const status = row.status || 'Open';
              const isResolved = status === 'Resolved' || status === 'Closed';
              const statusColor = isResolved ? '#10b981' : status === 'In Progress' ? 'var(--brand-primary)' : '#f59e0b';
              return (
              <tr key={row.id || index} style={{ borderBottom: '1px solid var(--border-subtle)', transition: 'background 0.2s', cursor: 'pointer' }} onMouseOver={e => e.currentTarget.style.background = 'var(--bg-secondary)'} onMouseOut={e => e.currentTarget.style.background = 'transparent'}>
                <td style={{ padding: '1rem', fontSize: '0.9rem', fontWeight: 600, color: 'var(--brand-primary)' }}>{String(row.id).substring(0, 8).toUpperCase()}</td>
                <td style={{ padding: '1rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{row.category || 'General'}</td>
                <td style={{ padding: '1rem', fontSize: '0.85rem', color: 'var(--text-primary)' }}>{row.subject || row.complaint_text?.substring(0, 40)}</td>
                <td style={{ padding: '1rem' }}>
                  <span style={{ padding: '4px 10px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 600, background: isResolved ? 'rgba(16,185,129,0.1)' : 'rgba(37,99,235,0.1)', color: statusColor }}>
                    {status}
                  </span>
                </td>
                <td style={{ padding: '1rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>{row.created_at ? new Date(row.created_at).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' }) : 'N/A'}</td>
              </tr>
              );
            }) : (
              <tr><td colSpan="5" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>{dataLoading ? 'Loading...' : 'No complaints yet. Submit your first complaint!'}</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderTrackStatus = () => (
    <div className="card animate-fade-in">
      <div className="card-header">
        <h3 className="card-title" style={{ fontSize: '1.25rem' }}>
          <Activity size={24} className="brand-icon" /> Track Complaint Status
        </h3>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', marginTop: '1rem' }}>
        {trackableTickets.length > 0 ? trackableTickets.map(ticket => (
          <div key={ticket.id} style={{ 
            padding: '1.75rem', border: '1px solid var(--border-subtle)', borderRadius: '12px', background: 'var(--bg-secondary)', boxShadow: '0 2px 8px rgba(0,0,0,0.02)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--brand-primary)', marginBottom: '4px' }}>{ticket.id}</div>
                <div style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-primary)' }}>{ticket.title}</div>
              </div>
            </div>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '2.5rem 0 1rem', position: 'relative' }}>
              <div style={{ position: 'absolute', top: '12px', left: '10px', right: '10px', height: '3px', background: 'var(--border-strong)', zIndex: 0 }}></div>
              <div style={{ position: 'absolute', top: '12px', left: '10px', width: `calc(${ticket.progress}% - 20px)`, height: '3px', background: ticket.progress === 100 ? '#10b981' : 'var(--brand-primary)', zIndex: 0, transition: 'width 1s ease-out' }}></div>
              
              {['Submitted', 'Under Review', 'In Progress', 'Resolved'].map((step, idx) => {
                const stepProgress = idx === 0 ? 0 : idx === 1 ? 33 : idx === 2 ? 66 : 100;
                const isCompleted = ticket.progress >= stepProgress;
                const isCurrent = ticket.progress > (idx-1)*33 && ticket.progress <= stepProgress && ticket.progress < 100;

                return (
                  <div key={step} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px', zIndex: 1, width: '100px' }}>
                    <div style={{ 
                      width: '28px', height: '28px', borderRadius: '50%', background: isCompleted ? (ticket.progress === 100 ? '#10b981' : 'var(--brand-primary)') : 'var(--bg-card)', 
                      border: `3px solid ${isCompleted ? (ticket.progress === 100 ? '#10b981' : 'var(--brand-primary)') : 'var(--border-strong)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.3s', boxShadow: isCurrent ? '0 0 0 4px rgba(37,99,235,0.2)' : 'none'
                    }}>
                      {isCompleted && <CheckCircle2 size={14} color="white" />}
                    </div>
                    <span style={{ fontSize: '0.75rem', fontWeight: isCurrent || isCompleted ? 700 : 500, color: isCompleted ? 'var(--text-primary)' : 'var(--text-muted)' }}>{step}</span>
                  </div>
                );
              })}
            </div>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '2rem', paddingTop: '1.25rem', borderTop: '1px solid var(--border-subtle)' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.9rem' }}>
                {ticket.progress === 100 ? <CheckCircle2 size={18} color="#10b981" /> : <Clock size={18} color="var(--brand-primary)" />}
                <strong style={{ color: 'var(--text-primary)' }}>Current Status:</strong> <span style={{ color: 'var(--text-secondary)' }}>{ticket.status}</span>
              </span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Updated: {ticket.date}</span>
                {ticket.progress === 100 && (
                  <button onClick={() => window.location.hash = '#feedback'} className="btn" style={{ padding: '0.5rem 1rem', fontSize: '0.85rem', background: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600, boxShadow: '0 4px 10px rgba(245, 158, 11, 0.2)', transition: 'transform 0.2s' }} onMouseOver={e => e.currentTarget.style.transform = 'translateY(-2px)'} onMouseOut={e => e.currentTarget.style.transform = 'translateY(0)'}>
                    <Star size={14} fill="currentColor" /> Provide Feedback
                  </button>
                )}
              </div>
            </div>
          </div>
        )) : (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)', background: 'var(--bg-secondary)', borderRadius: '12px' }}>
            {dataLoading ? 'Loading tickets...' : 'No tickets to track yet.'}
          </div>
        )}
      </div>
    </div>
  );

  const renderNotifications = () => (
    <div className="card animate-fade-in">
      <div className="card-header">
        <h3 className="card-title" style={{ fontSize: '1.25rem' }}>
          <Bell size={24} className="brand-icon" /> Updates & Notifications
        </h3>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '1rem' }}>
        {notifications.length > 0 ? notifications.map(notif => (
          <div key={notif.id} style={{ 
            padding: '1rem 1.5rem', borderRadius: '8px', background: notif.read ? 'var(--bg-primary)' : 'rgba(37,99,235,0.05)', borderLeft: notif.read ? '3px solid transparent' : '3px solid var(--brand-primary)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', transition: 'background 0.2s', cursor: 'pointer'
          }} onMouseOver={e => e.currentTarget.style.background = 'var(--bg-secondary)'} onMouseOut={e => e.currentTarget.style.background = notif.read ? 'var(--bg-primary)' : 'rgba(37,99,235,0.05)'}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ background: 'var(--bg-card)', padding: '8px', borderRadius: '50%', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
                <Bell size={18} color={notif.read ? 'var(--text-muted)' : 'var(--brand-primary)'} />
              </div>
              <span style={{ fontSize: '0.95rem', color: notif.read ? 'var(--text-secondary)' : 'var(--text-primary)', fontWeight: notif.read ? 400 : 500 }}>
                {notif.text}
              </span>
            </div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{notif.time}</span>
          </div>
        )) : (
          <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>No notifications yet.</div>
        )}
      </div>
    </div>
  );


  const handleFeedbackSubmit = async () => {
    if (!selectedComplaintId) { alert('Please select a ticket.'); return; }
    if (feedbackRating === 0) { alert('Please select a star rating.'); return; }

    setFeedbackSubmitting(true);
    try {
      const res = await fetch(`${BACKEND_URL}/api/feedback/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          complaint_id: selectedComplaintId,
          customer_id: user?.id,
          rating: feedbackRating,
          feedback_text: feedbackText
        })
      });
      const data = await res.json();
      if (res.ok) {
        setFeedbackSubmitted(true);
        setFeedbackText('');
      } else {
        alert(`Error: ${data.error || 'Failed to submit feedback'}`);
      }
    } catch {
      alert('Could not reach the server.');
    } finally {
      setFeedbackSubmitting(false);
    }
  };

  const renderFeedback = () => (
    <div className="card animate-fade-in">
      <div className="card-header">
        <h3 className="card-title" style={{ fontSize: '1.25rem' }}>
          <MessageSquare size={24} className="brand-icon" /> Rate Final Resolution
        </h3>
      </div>

      {feedbackSubmitted ? (
        <div style={{ padding: '3rem 2rem', textAlign: 'center' }}>
          <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'rgba(16,185,129,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
            <CheckCircle2 size={32} color="#10b981" />
          </div>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '0.5rem', color: 'var(--text-primary)' }}>Thank you for your feedback!</h3>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>Your {feedbackRating}-star rating has been recorded successfully.</p>
          <button onClick={() => { setFeedbackSubmitted(false); setFeedbackRating(0); setSelectedComplaintId(''); }} style={{ padding: '0.6rem 1.5rem', border: '1px solid var(--border-strong)', borderRadius: '8px', background: 'var(--bg-primary)', cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem' }}>Rate Another Ticket</button>
        </div>
      ) : (
        <div style={{ marginTop: '1rem', padding: '2rem', background: 'linear-gradient(145deg, var(--bg-secondary) 0%, rgba(37,99,235,0.02) 100%)', borderRadius: '12px', border: '1px solid var(--border-subtle)' }}>
          <h4 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '0.5rem' }}>Rate your resolution experience</h4>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>Once your complaint is resolved, you can rate the resolution here:</p>

          <div style={{ marginBottom: '2rem' }}>
            <select
              value={selectedComplaintId}
              onChange={e => setSelectedComplaintId(e.target.value)}
              style={{ width: '100%', padding: '1rem 1.5rem', border: '1px solid var(--border-strong)', borderRadius: '8px', background: 'var(--bg-primary)', outline: 'none', fontSize: '0.95rem', color: selectedComplaintId ? 'var(--text-primary)' : 'var(--text-muted)', cursor: 'pointer', transition: 'border-color 0.2s' }}
              onFocus={e => e.target.style.borderColor = 'var(--brand-primary)'}
              onBlur={e => e.target.style.borderColor = 'var(--border-strong)'}
            >
              <option value="">-- Select a resolved ticket --</option>
              {tickets.filter(t => t.status === 'Resolved' || t.status === 'Closed').map(t => (
                <option key={t.id} value={t.id}>
                  {t.subject || (t.complaint_text ? t.complaint_text.substring(0, 40) : 'Untitled')} ({t.category || 'General'})
                </option>
              ))}
            </select>
            {tickets.filter(t => t.status === 'Resolved' || t.status === 'Closed').length === 0 && (
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.5rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Clock size={14} /> No resolved tickets yet. Feedback will be available once your complaints are resolved by our team.
              </p>
            )}
          </div>

          <div style={{ marginBottom: '2.5rem' }}>
            <label style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '0.75rem' }}>Your Rating</label>
            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
              {[1,2,3,4,5].map(star => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setFeedbackRating(star)}
                  onMouseEnter={() => setFeedbackHover(star)}
                  onMouseLeave={() => setFeedbackHover(0)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', transition: 'transform 0.15s ease-out', padding: '4px' }}
                  onMouseOver={e => e.currentTarget.style.transform = 'scale(1.2)'}
                  onMouseOut={e => e.currentTarget.style.transform = 'scale(1)'}
                >
                  <Star
                    size={40}
                    color={star <= (feedbackHover || feedbackRating) ? '#fbbf24' : 'var(--border-strong)'}
                    fill={star <= (feedbackHover || feedbackRating) ? '#fbbf24' : 'none'}
                  />
                </button>
              ))}
            </div>
            {feedbackRating > 0 && (
              <p style={{ textAlign: 'center', marginTop: '0.5rem', fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 500 }}>
                {feedbackRating === 1 ? 'Poor' : feedbackRating === 2 ? 'Fair' : feedbackRating === 3 ? 'Good' : feedbackRating === 4 ? 'Very Good' : 'Excellent!'}
              </p>
            )}
          </div>

          <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1.5rem' }}>
            <label style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Additional Comments (Optional)</label>
            <textarea
              placeholder="Tell us what we did well, or what we can improve..."
              rows="4"
              value={feedbackText}
              onChange={e => setFeedbackText(e.target.value)}
              style={{ padding: '1rem', border: '1px solid var(--border-strong)', borderRadius: '8px', background: 'var(--bg-primary)', outline: 'none', transition: 'border-color 0.2s', resize: 'vertical' }}
              onFocus={e => e.target.style.borderColor = 'var(--brand-primary)'}
              onBlur={e => e.target.style.borderColor = 'var(--border-strong)'}
            />
          </div>

          <button
            onClick={handleFeedbackSubmit}
            disabled={feedbackSubmitting || !selectedComplaintId || feedbackRating === 0}
            style={{
              padding: '0.85rem 2rem', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '8px',
              border: 'none', background: (!selectedComplaintId || feedbackRating === 0) ? 'var(--border-strong)' : 'var(--brand-primary)',
              color: 'white', fontWeight: 600, cursor: (!selectedComplaintId || feedbackRating === 0) ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s', boxShadow: '0 4px 12px rgba(37,99,235,0.2)', opacity: feedbackSubmitting ? 0.7 : 1
            }}
            onMouseOver={e => { if (selectedComplaintId && feedbackRating > 0) e.currentTarget.style.transform = 'translateY(-2px)'; }}
            onMouseOut={e => e.currentTarget.style.transform = 'translateY(0)'}
          >
            {feedbackSubmitting ? <><Loader2 size={16} className="animate-spin" /> Submitting...</> : <><Send size={16} /> Submit Feedback</>}
          </button>
        </div>
      )}
    </div>
  );

  const renderOverview = () => (
    <>
      <div className="dashboard-grid" style={{ marginBottom: '1.5rem' }}>
        <div className="col-span-4 card" style={{ padding: '1.5rem', background: 'linear-gradient(135deg, var(--bg-card) 0%, rgba(37,99,235,0.05) 100%)', borderLeft: '4px solid var(--brand-primary)' }}>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600, marginBottom: '0.5rem' }}>Active Tickets</div>
          <div style={{ fontSize: '2.5rem', fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'baseline', gap: '8px' }}>
            {tickets.filter(t => t.status === 'Open' || t.status === 'In Progress').length} <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 400 }}>Currently open</span>
          </div>
        </div>
        <div className="col-span-4 card" style={{ padding: '1.5rem', background: 'linear-gradient(135deg, var(--bg-card) 0%, rgba(16,185,129,0.05) 100%)', borderLeft: '4px solid #10b981' }}>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600, marginBottom: '0.5rem' }}>Resolved</div>
          <div style={{ fontSize: '2.5rem', fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'baseline', gap: '8px' }}>
            {tickets.filter(t => t.status === 'Resolved' || t.status === 'Closed').length} <span style={{ fontSize: '0.85rem', color: '#10b981', fontWeight: 600 }}>Completed</span>
          </div>
        </div>
        <div className="col-span-4 card" style={{ padding: '1.5rem', background: 'linear-gradient(135deg, var(--bg-card) 0%, rgba(245,158,11,0.05) 100%)', borderLeft: '4px solid #f59e0b' }}>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600, marginBottom: '0.5rem' }}>Total Complaints</div>
          <div style={{ fontSize: '2.5rem', fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'baseline', gap: '8px' }}>
            {tickets.length} <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 400 }}>All time</span>
          </div>
        </div>
      </div>
      
      <div className="dashboard-grid">
        <div className="col-span-8">
          {renderHistory()}
        </div>
        <div className="col-span-4" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div className="card">
            <div className="card-header" style={{ marginBottom: '1rem' }}>
              <h3 className="card-title" style={{ fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Clock size={16} className="brand-icon" /> Recent Activity
              </h3>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {tickets.slice(0, 3).map((ticket, i) => (
                <div key={ticket.id || i} style={{ padding: '0.75rem', background: 'var(--bg-secondary)', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>{ticket.subject || ticket.complaint_text?.substring(0, 30)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>{ticket.status || 'Open'}</span>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{ticket.created_at ? new Date(ticket.created_at).toLocaleDateString('en-US', { day: 'numeric', month: 'short' }) : 'N/A'}</span>
                  </div>
                </div>
              ))}
              {tickets.length === 0 && <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textAlign: 'center', padding: '1rem' }}>No activity yet</div>}
            </div>
          </div>
          
          <div className="card">
             <div className="card-header">
              <h3 className="card-title" style={{ fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Bot size={16} className="brand-icon" /> AI Assistant Status
              </h3>
            </div>
            <div style={{ padding: '1rem', textAlign: 'center', background: 'var(--bg-secondary)', borderRadius: '8px', marginTop: '1rem' }}>
              <Sparkles size={24} style={{ color: 'var(--brand-primary)', margin: '0 auto 8px' }} />
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Our AI operates 24/7. Use the chat agent below for instant help.</p>
            </div>
          </div>
        </div>
      </div>
    </>
  );

  const renderFixedChatbot = () => {
    return createPortal(
      <div style={{ position: 'fixed', bottom: '2rem', right: '2rem', zIndex: 999999 }}>
        {!isChatOpen ? (
          <button
            onClick={() => setIsChatOpen(true)}
            style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'linear-gradient(135deg, var(--brand-primary) 0%, #1d4ed8 100%)', boxShadow: '0 8px 25px rgba(37,99,235,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', border: 'none', cursor: 'pointer', transition: 'transform 0.2s' }}
            onMouseOver={e => e.currentTarget.style.transform = 'scale(1.05)'}
            onMouseOut={e => e.currentTarget.style.transform = 'scale(1)'}
          >
            <MessageSquare size={28} />
          </button>
        ) : (
          <div className="card animate-fade-in" style={{ width: '380px', height: '600px', display: 'flex', flexDirection: 'column', padding: 0, boxShadow: '0 12px 40px rgba(0,0,0,0.15)', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '16px' }}>

            <div style={{ padding: '1.2rem', background: 'linear-gradient(135deg, var(--brand-primary) 0%, #1d4ed8 100%)', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ background: 'rgba(255,255,255,0.2)', padding: '6px', borderRadius: '8px' }}>
                  <Bot size={20} />
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '1rem', letterSpacing: '0.5px' }}>ResolveX AI Agent</div>
                  <div style={{ fontSize: '0.7rem', opacity: 0.9, marginTop: '2px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#4ade80' }}></div> Online
                  </div>
                </div>
              </div>
              <button onClick={() => setIsChatOpen(false)} style={{ color: 'white', background: 'rgba(255,255,255,0.1)', border: 'none', cursor: 'pointer', padding: '6px', borderRadius: '50%', transition: 'background 0.2s' }} onMouseOver={e => e.currentTarget.style.background = 'rgba(255,255,255,0.2)'} onMouseOut={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}>
                <X size={16} />
              </button>
            </div>

            {chatMessages.length === 0 && (
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '1.2rem', padding: '2.5rem', color: 'var(--text-muted)', textAlign: 'center', background: 'var(--bg-primary)' }}>
                <div style={{ background: 'rgba(37,99,235,0.05)', padding: '1.5rem', borderRadius: '50%' }}>
                  <Sparkles size={48} style={{ color: 'var(--brand-primary)', opacity: 0.8 }} />
                </div>
                <div>
                  <h4 style={{ fontSize: '1.1rem', color: 'var(--text-primary)', fontWeight: 600, marginBottom: '0.5rem' }}>How can I help today?</h4>
                  <p style={{ fontSize: '0.9rem', lineHeight: '1.5' }}>Type a message below or get an AI Suggestion from the complaint form.</p>
                </div>
              </div>
            )}

            {chatMessages.length > 0 && (
              <div style={{ flex: 1, padding: '1.2rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1rem', background: 'var(--bg-primary)' }}>
                {chatMessages.map(msg => (
                  <div key={msg.id} style={{
                    alignSelf: msg.sender === 'user' ? 'flex-end' : 'flex-start',
                    maxWidth: '85%', padding: '0.85rem 1.2rem', borderRadius: msg.sender === 'user' ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                    background: msg.sender === 'user' ? 'linear-gradient(135deg, var(--brand-primary) 0%, #1d4ed8 100%)' : 'white',
                    color: msg.sender === 'user' ? 'white' : 'var(--text-primary)',
                    boxShadow: msg.sender === 'ai' ? '0 2px 8px rgba(0,0,0,0.04)' : '0 4px 12px rgba(37,99,235,0.2)', fontSize: '0.9rem', whiteSpace: 'pre-wrap', border: msg.sender === 'ai' ? '1px solid var(--border-subtle)' : 'none', lineHeight: 1.5
                  }}>
                    {msg.text}
                  </div>
                ))}
                {isTyping && (
                  <div style={{ alignSelf: 'flex-start', background: 'white', padding: '0.8rem 1.2rem', borderRadius: '16px 16px 16px 4px', border: '1px solid var(--border-subtle)', display: 'flex', gap: '6px', alignItems: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
                    {[0, 0.2, 0.4].map((d, i) => (
                      <div key={i} className="animate-pulse" style={{ width: '6px', height: '6px', background: 'var(--text-muted)', borderRadius: '50%', animationDelay: `${d}s` }} />
                    ))}
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>
            )}

            {chatPhase === 'active' && chatMessages.length > 0 && (
              <div style={{ padding: '0.85rem', background: 'white', borderTop: '1px solid var(--border-subtle)', borderBottom: '1px solid var(--border-subtle)', display: 'flex', gap: '0.5rem' }}>
                <button onClick={handleAgreeWithBot} style={{ flex: 1, padding: '0.75rem', borderRadius: '8px', background: '#dcfce7', border: '1px solid #86efac', color: '#16a34a', fontWeight: 600, fontSize: '0.85rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', cursor: 'pointer', transition: 'all 0.2s' }} onMouseOver={e => e.currentTarget.style.background = '#bbf7d0'} onMouseOut={e => e.currentTarget.style.background = '#dcfce7'}>
                  <ThumbsUp size={16} /> Agree & Revise
                </button>
                <button onClick={handleDisagreeAndSubmit} style={{ flex: 1, padding: '0.75rem', borderRadius: '8px', background: '#fef2f2', border: '1px solid #fca5a5', color: '#dc2626', fontWeight: 600, fontSize: '0.85rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', cursor: 'pointer', transition: 'all 0.2s' }} onMouseOver={e => e.currentTarget.style.background = '#fee2e2'} onMouseOut={e => e.currentTarget.style.background = '#fef2f2'}>
                  <ThumbsDown size={16} /> Submit As-Is
                </button>
              </div>
            )}

            <div style={{ padding: '1rem', background: 'white', borderTop: 'none' }}>
              <div style={{ display: 'flex', gap: '0.5rem', background: 'var(--bg-primary)', borderRadius: '30px', padding: '6px 6px 6px 16px', border: '1px solid var(--border-strong)', alignItems: 'center' }}>
                <input
                  type="text"
                  placeholder="Type your message..."
                  value={currentMessage}
                  onChange={(e) => setCurrentMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSendChat()}
                  style={{ flex: 1, background: 'none', border: 'none', fontSize: '0.9rem', outline: 'none', color: 'var(--text-primary)' }}
                />
                <button
                  onClick={handleSendChat}
                  style={{ width: '36px', height: '36px', background: 'var(--brand-primary)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', border: 'none', cursor: 'pointer', transition: 'background 0.2s' }}
                  onMouseOver={e => e.currentTarget.style.background = '#1d4ed8'}
                  onMouseOut={e => e.currentTarget.style.background = 'var(--brand-primary)'}
                >
                  <Send size={16} />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>,
      document.body
    );
  };

  return (
    <div style={{ position: 'relative', minHeight: 'calc(100vh - 120px)' }}>

      <div style={{ marginBottom: '4rem' }}>
        {hash === '' && renderOverview()}
        {hash === '#history' && renderHistory()}
        {hash === '#track' && renderTrackStatus()}
        {hash === '#notifications' && renderNotifications()}
        {hash === '#feedback' && renderFeedback()}
      </div>

      {renderComplaintModal()}
      {renderFixedChatbot()}
    </div>
  );
};

export default CustomerDashboard;