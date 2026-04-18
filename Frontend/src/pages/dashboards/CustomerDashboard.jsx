import React, { useState, useRef, useEffect } from 'react';
import {
  PlusCircle,
  Clock,
  CheckCircle2,
  AlertCircle,
  UploadCloud,
  MessageSquare,
  Send,
  Bot,
  Sparkles,
  ChevronDown,
  Loader2
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const CustomerDashboard = () => {
  const { user } = useAuth();
  const [complaint, setComplaint] = useState('');
  const [category, setCategory] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Chatbot states
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState([
    { id: 1, text: `Hello ${user?.name}! I'm ResolveX AI. How can I help you with your complaints today?`, sender: 'ai' }
  ]);
  const [currentMessage, setCurrentMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const chatEndRef = useRef(null);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isChatOpen) scrollToBottom();
  }, [chatMessages, isTyping, isChatOpen]);

  const handleSendChat = () => {
    if (!currentMessage.trim()) return;

    const newUserMsg = { id: Date.now(), text: currentMessage, sender: 'user' };
    setChatMessages(prev => [...prev, newUserMsg]);
    setCurrentMessage('');
    setIsTyping(true);

    // Simulate AI response logic
    setTimeout(() => {
      let aiResponse = "";
      const lowerMsg = currentMessage.toLowerCase();

      if (lowerMsg.includes('hello') || lowerMsg.includes('hi')) {
        aiResponse = "Hi there! I can help you file a complaint, check ticket status, or explain our resolution process.";
      } else if (lowerMsg.includes('status') || lowerMsg.includes('track')) {
        aiResponse = "Your ticket TKT-1042 is currently 'In Progress'. Our engineering team is looking into the payment discrepancy.";
      } else if (lowerMsg.includes('file') || lowerMsg.includes('complaint')) {
        aiResponse = "I can help you file that! Just describe the issue here, and I'll prepare a ticket for you.";
      } else {
        aiResponse = "I've noted that. Would you like me to convert this conversation into a support ticket for our database?";
      }

      setChatMessages(prev => [...prev, { id: Date.now() + 1, text: aiResponse, sender: 'ai' }]);
      setIsTyping(false);
    }, 1500);
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    setIsAnalyzing(true);
    // Future database connection point
    setTimeout(() => {
      setIsAnalyzing(false);
      setComplaint('');
      setCategory('');
      alert("Complaint submitted successfully! (Connecting to database...)");
    }, 2000);
  };

  const mockTickets = [
    { id: 'TKT-1042', title: 'Payment failed but amount deducted', status: 'In Progress', priority: 'High', date: '2 hours ago', sla: '4h remaining' },
    { id: 'TKT-1040', title: 'Cannot access my account', status: 'Resolved', priority: 'Medium', date: 'Yesterday', sla: 'Resolved in 2h' },
  ];

  return (
    <div className="animate-fade-in" style={{ position: 'relative', minHeight: 'calc(100vh - 120px)' }}>
      <div className="dashboard-grid">
        {/* Main Form Section */}
        <div className="col-span-8">
          <div className="card" style={{ height: '100%' }}>
            <div className="card-header">
              <h3 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <PlusCircle size={20} className="brand-icon" /> Submit New Complaint
              </h3>
            </div>
            <form onSubmit={handleFormSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', marginTop: '1rem' }}>
              <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <label style={{ fontSize: '0.875rem', fontWeight: 500 }}>Issue Subject</label>
                <input
                  type="text"
                  placeholder="e.g., Service Interruption in Region A"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="glass-panel"
                  style={{ padding: '0.875rem 1rem', border: '1px solid var(--border-strong)', borderRadius: 'var(--radius-md)', background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
                  required
                />
              </div>
              <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <label style={{ fontSize: '0.875rem', fontWeight: 500 }}>Detailed Information</label>
                <textarea
                  placeholder="Please provide as much detail as possible..."
                  rows="5"
                  value={complaint}
                  onChange={(e) => setComplaint(e.target.value)}
                  style={{ padding: '0.875rem 1rem', border: '1px solid var(--border-strong)', borderRadius: 'var(--radius-md)', background: 'var(--bg-secondary)', color: 'var(--text-primary)', resize: 'vertical' }}
                  required
                ></textarea>
              </div>

              <div className="upload-zone" style={{ border: '1px dashed var(--border-strong)', borderRadius: 'var(--radius-md)', padding: '2rem', textAlign: 'center', background: 'var(--bg-secondary)', transition: '0.2s' }}>
                <UploadCloud size={32} style={{ margin: '0 auto 1rem', color: 'var(--brand-primary)' }} />
                <p style={{ fontSize: '0.875rem', fontWeight: 500 }}>Upload supporting documents or screenshots</p>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Max file size: 10MB</p>
              </div>

              <button type="submit" className="btn btn-primary" style={{ padding: '1rem' }} disabled={isAnalyzing}>
                {isAnalyzing ? <><Loader2 className="animate-spin" size={18} /> Syncing to Database...</> : 'File Official Complaint'}
              </button>
            </form>
          </div>
        </div>

        {/* Sidebar Tracking Section */}
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

      {/* --- AI CHATBOT INTEGRATION --- */}
      <div style={{ position: 'fixed', bottom: '2rem', right: '2rem', zIndex: 1000 }}>
        {!isChatOpen ? (
          <button
            onClick={() => setIsChatOpen(true)}
            className="btn btn-primary"
            style={{ width: '60px', height: '60px', borderRadius: '50%', boxShadow: '0 8px 25px rgba(37, 99, 235, 0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            <MessageSquare size={28} />
          </button>
        ) : (
          <div className="card" style={{ width: '360px', height: '520px', display: 'flex', flexDirection: 'column', padding: 0, boxShadow: 'var(--shadow-lg)', overflow: 'hidden', border: '1px solid var(--border-strong)' }}>
            <div style={{ padding: '1rem', background: 'var(--brand-primary)', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Bot size={20} />
                <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>ResolveX AI Agent</span>
              </div>
              <button onClick={() => setIsChatOpen(false)} style={{ color: 'white' }}><ChevronDown size={20} /></button>
            </div>

            <div style={{ flex: 1, padding: '1rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1rem', background: 'var(--bg-primary)' }}>
              {chatMessages.map(msg => (
                <div key={msg.id} style={{
                  alignSelf: msg.sender === 'user' ? 'flex-end' : 'flex-start',
                  maxWidth: '85%',
                  padding: '0.75rem 1rem',
                  borderRadius: msg.sender === 'user' ? '15px 15px 2px 15px' : '15px 15px 15px 2px',
                  background: msg.sender === 'user' ? 'var(--brand-primary)' : 'var(--bg-secondary)',
                  color: msg.sender === 'user' ? 'white' : 'var(--text-primary)',
                  fontSize: '0.85rem',
                  boxShadow: '0 2px 5px rgba(0,0,0,0.02)',
                  border: msg.sender === 'user' ? 'none' : '1px solid var(--border-subtle)'
                }}>
                  {msg.text}
                </div>
              ))}
              {isTyping && (
                <div style={{ alignSelf: 'flex-start', background: 'var(--bg-secondary)', padding: '0.5rem 1rem', borderRadius: '15px', display: 'flex', gap: '4px' }}>
                  <div className="animate-pulse" style={{ width: '4px', height: '4px', background: 'var(--text-muted)', borderRadius: '50%' }}></div>
                  <div className="animate-pulse" style={{ width: '4px', height: '4px', background: 'var(--text-muted)', borderRadius: '50%', animationDelay: '0.2s' }}></div>
                  <div className="animate-pulse" style={{ width: '4px', height: '4px', background: 'var(--text-muted)', borderRadius: '50%', animationDelay: '0.4s' }}></div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            <div style={{ padding: '1rem', background: 'var(--bg-card)', borderTop: '1px solid var(--border-subtle)' }}>
              <div style={{ display: 'flex', gap: '0.5rem', background: 'var(--bg-secondary)', p: '2px', borderRadius: '25px', padding: '4px 4px 4px 12px', border: '1px solid var(--border-strong)' }}>
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
                  style={{ width: '32px', height: '32px', background: 'var(--brand-primary)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}
                >
                  <Send size={14} />
                </button>
              </div>
              <div style={{ textAlign: 'center', marginTop: '0.5rem' }}>
                <button style={{ background: 'none', border: 'none', color: 'var(--brand-primary)', fontSize: '0.7rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px', margin: '0 auto' }}>
                  <Sparkles size={10} /> Sync Chat to Database
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
