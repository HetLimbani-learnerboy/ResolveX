import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Send, Clock, AlertCircle, CheckCircle2, UploadCloud, Loader2, Sparkles } from 'lucide-react';

const CustomerDashboard = () => {
  const { user } = useAuth();
  const [complaint, setComplaint] = useState('');
  const [category, setCategory] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const mockTickets = [
    { id: 'TKT-1042', title: 'Payment failed but amount deducted', status: 'In Progress', priority: 'High', date: '2 hours ago', sla: '4h remaining' },
    { id: 'TKT-1040', title: 'Cannot access my account', status: 'Resolved', priority: 'Medium', date: 'Yesterday', sla: 'Resolved in 2h' },
  ];

  const handleSubmit = (e) => {
    e.preventDefault();
    setIsAnalyzing(true);
    
    // Simulate AI scanning animation before submitting
    setTimeout(() => {
      setIsAnalyzing(false);
      setIsSubmitted(true);
      setComplaint('');
      setCategory('');
      
      setTimeout(() => setIsSubmitted(false), 3000);
    }, 2000);
  };

  return (
    <div className="dashboard-grid">
      <div className="col-span-8">
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Submit New Complaint</h3>
          </div>
          
          {isSubmitted ? (
            <div className="animate-fade-in" style={{ padding: '2rem', textAlign: 'center', color: 'var(--status-low-text)' }}>
              <CheckCircle2 size={48} style={{ margin: '0 auto 1rem' }} />
              <h3>Ticket Successfully Filed!</h3>
              <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem' }}>AI has routed your issue to the appropriate team.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div className="form-group" style={{ gap: '0.5rem', display: 'flex', flexDirection: 'column' }}>
                <label style={{ fontSize: '0.875rem', fontWeight: 500 }}>Issue Title</label>
                <input 
                  type="text" 
                  placeholder="Brief summary of the issue" 
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  style={{
                    padding: '0.875rem 1rem', background: 'var(--bg-secondary)', border: '1px solid var(--border-strong)', borderRadius: 'var(--radius-md)', color: 'var(--text-primary)', outline: 'none', transition: 'var(--transition-fast)'
                  }}
                  onFocus={(e) => { e.target.style.borderColor = 'var(--brand-primary)'; e.target.style.boxShadow = 'var(--shadow-focus)'; }}
                  onBlur={(e) => { e.target.style.borderColor = 'var(--border-strong)'; e.target.style.boxShadow = 'none'; }}
                  required 
                />
              </div>
              <div className="form-group" style={{ gap: '0.5rem', display: 'flex', flexDirection: 'column' }}>
                <label style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--text-secondary)' }}>Detailed Description</label>
                <textarea 
                  placeholder="Please describe your issue in detail..." 
                  rows="4"
                  style={{
                    padding: '0.875rem 1rem', backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-strong)', borderRadius: 'var(--radius-md)', color: 'var(--text-primary)', resize: 'vertical', outline: 'none', transition: 'var(--transition-fast)'
                  }}
                  onFocus={(e) => { e.target.style.borderColor = 'var(--brand-primary)'; e.target.style.boxShadow = 'var(--shadow-focus)'; }}
                  onBlur={(e) => { e.target.style.borderColor = 'var(--border-strong)'; e.target.style.boxShadow = 'none'; }}
                  value={complaint}
                  onChange={(e) => setComplaint(e.target.value)}
                  required
                ></textarea>
              </div>
              
              <div className="upload-zone" style={{
                border: '1px dashed var(--border-strong)', borderRadius: 'var(--radius-md)', padding: '2.5rem', textAlign: 'center', cursor: 'pointer', transition: 'all var(--transition-fast)', background: 'var(--bg-secondary)'
              }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--brand-primary)'; e.currentTarget.style.background = 'rgba(37, 99, 235, 0.05)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border-strong)'; e.currentTarget.style.background = 'var(--bg-secondary)'; }}
              >
                <UploadCloud size={32} style={{ margin: '0 auto 1rem', color: 'var(--brand-primary)' }} />
                <p style={{ fontSize: '0.875rem', color: 'var(--text-primary)', fontWeight: 500 }}>Drag and drop attachments here or click to upload</p>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>(Screenshots, logs, etc.)</p>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <button type="submit" className="btn btn-primary glow-btn" disabled={isAnalyzing}>
                  {isAnalyzing ? (
                    <><Loader2 className="animate-spin" size={16} /> Analyzing Context...</>
                  ) : (
                    <><Sparkles size={16} /> Analyze & Submit</>
                  )}
                </button>
                {isAnalyzing && <span className="ai-typewriter" style={{ fontSize: '0.875rem', color: 'var(--brand-accent)' }}>AI routing agent is evaluating payload...</span>}
              </div>
            </form>
          )}
        </div>
      </div>

      <div className="col-span-4">
        <div className="card h-full">
          <div className="card-header">
            <h3 className="card-title">Recent Tickets</h3>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {mockTickets.map(ticket => (
              <div key={ticket.id} style={{ 
                padding: '1rem', 
                backgroundColor: 'var(--bg-primary)', 
                borderRadius: 'calc(var(--radius-md))',
                border: '1px solid var(--border-subtle)'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <span style={{ fontSize: '0.875rem', fontWeight: '500', color: 'var(--brand-primary)' }}>{ticket.id}</span>
                  <span className={`badge ${ticket.priority.toLowerCase()}`}>{ticket.priority}</span>
                </div>
                <h4 style={{ fontSize: '0.95rem', marginBottom: '0.5rem' }}>{ticket.title}</h4>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    {ticket.status === 'Resolved' ? <CheckCircle2 size={14} color="var(--status-low-text)" /> : <AlertCircle size={14} color="var(--status-medium-text)" />}
                    {ticket.status}
                  </span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    <Clock size={14} /> {ticket.sla}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomerDashboard;
