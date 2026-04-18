import React, { useState, useEffect } from 'react';
import { PlayCircle, CheckCircle, X, Sparkles, AlertCircle, Mail, Phone, MessageSquare, Clock } from 'lucide-react';

const SupportDashboard = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTicket, setSelectedTicket] = useState(null);
  
  // AI Integration state
  const [complaintText, setComplaintText] = useState('');
  const [channel, setChannel] = useState('Email');
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [liveTicket, setLiveTicket] = useState(null);
  const [tickets, setTickets] = useState([
    { id: 'TKT-1043', customer: 'Acme Corp', title: 'Server downtime since Monday', category: 'Infrastructure', priority: 'High', status: 'Pending', aiAction: 'Restart nodes & refund SLA.' },
    { id: 'TKT-1044', customer: 'Stark Ind', title: 'Billing issue for pro plan', category: 'Billing', priority: 'Medium', status: 'Pending', aiAction: 'Apply adjustment credit.' },
    { id: 'TKT-1045', customer: 'Wayne Ent', title: 'UI bug on settings page', category: 'Bug', priority: 'Low', status: 'Pending', aiAction: 'Log to engineering backlog.' }
  ]);

  useEffect(() => {
    // Simulate complex data fetching
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1200);
    return () => clearTimeout(timer);
  }, []);

  const handleClassifyAI = async () => {
    if (!complaintText) return;
    setIsAiLoading(true);
    try {
      const response = await fetch('http://localhost:5000/api/ai/process_complaint', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: complaintText, channel: channel })
      });
      const data = await response.json();
      
      const newTicket = {
        id: `TKT-${Math.floor(Math.random() * 1000) + 2000}`,
        channel: channel,
        title: data.summary || data.original_text.substring(0, 40) + '...',
        originalText: data.original_text,
        cleanedText: data.cleaned_text,
        category: data.category || 'Unknown',
        priority: data.priority || 'Medium',
        status: 'Pending',
        aiAction: data.recommendation || 'Escalate to QA',
        sentiment: data.sentiment_score,
        timestamp: data.timestamp || new Date().toLocaleString()
      };
      
      setLiveTicket(newTicket);
      setTickets(prev => [newTicket, ...prev]);
      setComplaintText('');
    } catch (error) {
      console.error("AI API Error:", error);
      alert("Failed to reach AI Backend. Is the Flask server running?");
    } finally {
      setIsAiLoading(false);
    }
  };

  return (
    <div className="dashboard-grid relative">
      <div className="col-span-12 mb-6">
        <div className="card" style={{ background: 'linear-gradient(145deg, rgba(30,30,40,0.8) 0%, rgba(20,20,30,1) 100%)', border: '1px solid var(--brand-accent)' }}>
          <div className="card-header">
            <h3 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Sparkles size={20} color="var(--brand-accent)" /> 
              Live AI Complaint Classification
            </h3>
          </div>
          <div style={{ padding: '0 1.5rem 1.5rem' }}>
             <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem', fontSize: '0.9rem' }}>
               Paste a customer complaint from any channel below. Our ML pipeline processes the raw text — whether it's an email body, call transcript, or chat message — to instantly classify, prioritize, and recommend actions.
             </p>
             <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '0.75rem' }}>
               {['Email', 'Call', 'Chat'].map((ch) => (
                 <button
                   key={ch}
                   onClick={() => setChannel(ch)}
                   style={{
                     display: 'flex', alignItems: 'center', gap: '6px',
                     padding: '8px 16px', borderRadius: '8px', fontSize: '0.85rem', fontWeight: 500,
                     cursor: 'pointer', transition: 'all 0.2s ease',
                     background: channel === ch ? 'var(--brand-primary)' : 'transparent',
                     color: channel === ch ? '#fff' : 'var(--text-secondary)',
                     border: channel === ch ? '1px solid var(--brand-primary)' : '1px solid var(--border-subtle)',
                   }}
                 >
                   {ch === 'Email' && <Mail size={14} />}
                   {ch === 'Call' && <Phone size={14} />}
                   {ch === 'Chat' && <MessageSquare size={14} />}
                   {ch}
                 </button>
               ))}
             </div>
             <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-end' }}>
               <textarea 
                 className="form-input" 
                 placeholder={channel === 'Email' 
                   ? 'Paste the full email body here...\n\ne.g., "Dear Support, I received my order #4521 yesterday and the box was completely crushed. The product inside was damaged..."'
                   : channel === 'Call'
                   ? 'Paste the call transcript or summary here...'
                   : 'Paste the chat message here...'}
                 value={complaintText}
                 onChange={(e) => setComplaintText(e.target.value)}
                 rows={4}
                 style={{ flex: 1, padding: '12px', borderRadius: '8px', border: '1px solid var(--border-subtle)', background: 'var(--bg-card)', resize: 'vertical', fontFamily: 'inherit', fontSize: '0.9rem', lineHeight: '1.5' }}
               />
               <button 
                 className="btn btn-primary glow-btn" 
                 onClick={handleClassifyAI} 
                 disabled={isAiLoading || !complaintText}
                 style={{ height: 'fit-content', whiteSpace: 'nowrap' }}
               >
                 {isAiLoading ? 'Analyzing...' : 'Run AI Analysis'}
               </button>
             </div>
          </div>
        </div>
      </div>

      <div className="col-span-12">
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Assigned Tickets</h3>
            <span className="badge high">Requires Immediate Action: 1</span>
          </div>
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Ticket ID</th>
                  <th>Channel</th>
                  <th>Issue Title</th>
                  <th>Category (AI)</th>
                  <th>Priority (AI)</th>
                  <th>AI Recommendation</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  Array(4).fill(0).map((_, i) => (
                    <tr key={i}>
                      <td colSpan="6">
                        <div className="skeleton" style={{ height: '32px', borderRadius: '4px', width: '100%' }}></div>
                      </td>
                    </tr>
                  ))
                ) : (
                  tickets.map((ticket, i) => (
                    <tr key={i} onClick={() => setSelectedTicket(ticket)} style={{ cursor: 'pointer' }}>
                      <td style={{ color: 'var(--brand-primary)', fontWeight: '500' }}>{ticket.id}</td>
                      <td style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        {ticket.channel === 'Email' && <Mail size={13} />}
                        {ticket.channel === 'Call' && <Phone size={13} />}
                        {ticket.channel === 'Chat' && <MessageSquare size={13} />}
                        {ticket.channel || '—'}
                      </td>
                      <td>
                        <div style={{ fontWeight: 500 }}>{ticket.title}</div>
                        {ticket.timestamp && (
                          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <Clock size={10} /> {ticket.timestamp}
                          </div>
                        )}
                      </td>
                      <td>{ticket.category}</td>
                      <td><span className={`badge ${ticket.priority.toLowerCase()}`}>{ticket.priority}</span></td>
                      <td style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
                        <span className="ai-typewriter">{ticket.aiAction}</span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Slide-out Drawer */}
      {selectedTicket && (
        <>
          <div className="drawer-overlay" onClick={() => setSelectedTicket(null)}></div>
          <div className="drawer">
            <div className="drawer-header">
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Sparkles size={16} color="var(--brand-accent)" /> 
                Resolve {selectedTicket.id}
              </h3>
              <button className="icon-btn" onClick={() => setSelectedTicket(null)}><X size={20} /></button>
            </div>
            <div className="drawer-content">
              {/* Header */}
              <div style={{ marginBottom: '1.5rem' }}>
                <h4 style={{ fontSize: '1.1rem', marginBottom: '0.5rem' }}>{selectedTicket.title}</h4>
                {selectedTicket.timestamp && (
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '0.5rem' }}>
                    <Clock size={13} /> {selectedTicket.timestamp}
                  </div>
                )}
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  <span className={`badge ${selectedTicket.priority.toLowerCase()}`}>{selectedTicket.priority} Priority</span>
                  <span className="badge" style={{ background: 'rgba(100,100,255,0.15)', color: '#8b8bff' }}>{selectedTicket.category}</span>
                  {selectedTicket.channel && <span className="badge" style={{ background: 'rgba(100,200,100,0.15)', color: '#7cc77c' }}>{selectedTicket.channel}</span>}
                </div>
              </div>

              {/* Original Complaint Text */}
              {selectedTicket.originalText && (
                <div style={{ marginBottom: '1rem' }}>
                  <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Original Complaint</div>
                  <div style={{ padding: '0.75rem', backgroundColor: 'rgba(0,0,0,0.25)', borderRadius: '8px', border: '1px solid var(--border-subtle)', fontSize: '0.85rem', lineHeight: '1.6', whiteSpace: 'pre-wrap', maxHeight: '150px', overflowY: 'auto' }}>
                    {selectedTicket.originalText}
                  </div>
                </div>
              )}

              {/* AI Metrics Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1rem' }}>
                <div style={{ padding: '0.75rem', backgroundColor: 'rgba(0,0,0,0.2)', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
                  <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '4px' }}>Sentiment Score</div>
                  <div style={{ fontSize: '1.1rem', fontWeight: 600, color: selectedTicket.sentiment < -0.3 ? '#ff6b6b' : selectedTicket.sentiment > 0.2 ? '#51cf66' : '#ffd43b' }}>
                    {selectedTicket.sentiment !== undefined ? selectedTicket.sentiment : 'N/A'}
                  </div>
                </div>
                <div style={{ padding: '0.75rem', backgroundColor: 'rgba(0,0,0,0.2)', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
                  <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '4px' }}>Cleaned Text</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', maxHeight: '40px', overflow: 'hidden' }}>
                    {selectedTicket.cleanedText || 'N/A'}
                  </div>
                </div>
              </div>
              
              {/* AI Analysis */}
              <div style={{ padding: '1rem', backgroundColor: 'rgba(0,0,0,0.2)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem', color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase' }}>
                  <Sparkles size={14} /> AI Recommendation
                </div>
                <div className="ai-chat-bubble">
                  <strong>Copilot:</strong> {selectedTicket.aiAction}
                </div>
              </div>

              <div style={{ marginTop: 'auto', paddingTop: '2rem', display: 'flex', gap: '1rem' }}>
                <button className="btn btn-primary glow-btn" style={{ flex: 1 }} onClick={() => setSelectedTicket(null)}>
                  Execute AI Action
                </button>
                <button className="btn btn-secondary" onClick={() => setSelectedTicket(null)}>Escalate</button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default SupportDashboard;
