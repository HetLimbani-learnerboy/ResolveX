import React, { useState, useEffect } from 'react';
import { PlayCircle, CheckCircle, X, Sparkles, AlertCircle } from 'lucide-react';

const SupportDashboard = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTicket, setSelectedTicket] = useState(null);

  const tickets = [
    { id: 'TKT-1043', customer: 'Acme Corp', title: 'Server downtime since Monday', category: 'Infrastructure', priority: 'High', status: 'Pending', aiAction: 'Restart nodes & refund SLA.' },
    { id: 'TKT-1044', customer: 'Stark Ind', title: 'Billing issue for pro plan', category: 'Billing', priority: 'Medium', status: 'Pending', aiAction: 'Apply adjustment credit.' },
    { id: 'TKT-1045', customer: 'Wayne Ent', title: 'UI bug on settings page', category: 'Bug', priority: 'Low', status: 'Pending', aiAction: 'Log to engineering backlog.' }
  ];

  useEffect(() => {
    // Simulate complex data fetching
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1200);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="dashboard-grid relative">
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
                  <th>Customer</th>
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
                      <td>{ticket.customer}</td>
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
