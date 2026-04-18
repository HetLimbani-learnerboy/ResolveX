import React, { useState, useEffect } from 'react';
import { PlayCircle, CheckCircle, X, Sparkles, AlertCircle, Mail, Phone, MessageSquare } from 'lucide-react';

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
        customer: 'Live Insight',
        channel: channel,
        title: data.original_text.substring(0, 40) + (data.original_text.length > 40 ? '...' : ''),
        category: data.category || 'Unknown',
        priority: data.priority || 'Medium',
        status: 'Pending',
        aiAction: data.recommendation || 'Escalate to QA',
        sentiment: data.sentiment_score
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
                      <td>{ticket.title}</td>
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
              <div style={{ marginBottom: '1.5rem' }}>
                <h4 style={{ fontSize: '1.1rem', marginBottom: '0.25rem' }}>{selectedTicket.title}</h4>
                <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Customer: {selectedTicket.customer}</div>
              </div>
              
              <div style={{ padding: '1rem', backgroundColor: 'rgba(0,0,0,0.2)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem', color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase' }}>
                  <AlertCircle size={14} /> AI Analysis Log
                </div>
                <div className="ai-chat-bubble">
                  <strong>Copilot:</strong> I've scanned the logs. The server downtime appears to be due to an out-of-memory exception on Node B. 
                </div>
                <div className="ai-chat-bubble">
                  <strong>Copilot:</strong> Suggested action: {selectedTicket.aiAction}
                </div>
                {selectedTicket.sentiment !== undefined && (
                   <div style={{ marginTop: '0.5rem', fontSize: '0.8rem', color: 'var(--brand-accent)' }}>
                     * Model Sentiment Score: {selectedTicket.sentiment}
                   </div>
                )}
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
