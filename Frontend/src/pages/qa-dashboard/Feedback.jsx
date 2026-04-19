import React, { useState, useEffect, useMemo } from 'react';
import { 
  Star, MessageSquare, AlertCircle, FileText, CheckCircle2, 
  XOctagon, Loader2, ArrowRight
} from 'lucide-react';
import { format as timeAgo } from 'timeago.js';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://127.0.0.1:5000';

const Feedback = () => {
  const [feedbacks, setFeedbacks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters
  const [filterRating, setFilterRating] = useState('All');
  const [filterMismatch, setFilterMismatch] = useState('All');

  useEffect(() => {
    fetch(`${BACKEND_URL}/api/feedback/all`)
      .then(res => {
        if (!res.ok) throw new Error('Failed to fetch feedback logs');
        return res.json();
      })
      .then(data => {
        setFeedbacks(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(err => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  const filteredData = useMemo(() => {
    return feedbacks.filter(item => {
      // Rating filter
      if (filterRating !== 'All' && String(item.rating) !== filterRating) {
        return false;
      }
      
      // Mismatch filter
      // (For this system, if the customer gave a 1 or 2 star rating, it usually indicates AI failure/mismatch or bad resolution)
      const isMismatch = item.rating <= 2; 
      if (filterMismatch === 'Mismatch' && !isMismatch) return false;
      if (filterMismatch === 'Accurate' && isMismatch) return false;

      return true;
    });
  }, [feedbacks, filterRating, filterMismatch]);

  // Derive simple metrics
  const avgRating = feedbacks.length 
    ? (feedbacks.reduce((acc, curr) => acc + curr.rating, 0) / feedbacks.length).toFixed(1)
    : 0.0;
  
  const mismatches = feedbacks.filter(f => f.rating <= 2).length;

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
        <Loader2 size={40} className="animate-spin" color="var(--brand-primary)" />
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '50vh', color: 'var(--text-muted)' }}>
        <AlertCircle size={48} style={{ opacity: 0.4, marginBottom: '1rem' }} />
        <h3>Data pipeline offline</h3>
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="dashboard-grid animate-fade-in">

      {/* Header */}
      <div className="col-span-12" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <div>
          <h2 style={{ fontWeight: '700', fontSize: '1.6rem', color: 'var(--text-primary)', marginBottom: '4px' }}>
            QA Validation: User Feedback
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Review customer feedback directly against AI categorizations.</p>
        </div>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <div style={{ background: 'var(--bg-card)', padding: '0.5rem 1.25rem', borderRadius: '12px', border: '1px solid var(--border-subtle)', display: 'flex', flexDirection: 'column' }}>
             <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Avg QA Score</span>
             <span style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--brand-primary)', lineHeight: 1 }}>{avgRating} <span style={{fontSize: '0.9rem', color: 'var(--text-muted)'}}>/ 5.0</span></span>
          </div>
        </div>
      </div>

      <div className="col-span-12">
        <div className="card">
          {/* Controls */}
          <div className="card-header" style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
            <h3 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <MessageSquare size={18} />
              Feedback Logs
            </h3>

            <div style={{ display: 'flex', gap: '1rem' }}>
              <select 
                value={filterRating} 
                onChange={e => setFilterRating(e.target.value)}
                style={{ padding: '8px 16px', borderRadius: '8px', border: '1px solid var(--border-subtle)', background: 'var(--bg-secondary)', color: 'var(--text-primary)', outline: 'none', cursor: 'pointer', fontWeight: 500 }}
              >
                <option value="All">All Ratings</option>
                <option value="5">5 Stars (Excellent)</option>
                <option value="4">4 Stars</option>
                <option value="3">3 Stars</option>
                <option value="2">2 Stars</option>
                <option value="1">1 Star (Critical)</option>
              </select>

              <select 
                value={filterMismatch} 
                onChange={e => setFilterMismatch(e.target.value)}
                style={{ padding: '8px 16px', borderRadius: '8px', border: '1px solid var(--border-subtle)', background: 'var(--bg-secondary)', color: 'var(--text-primary)', outline: 'none', cursor: 'pointer', fontWeight: 500 }}
              >
                <option value="All">All Accuracies</option>
                <option value="Accurate">Highly Accurate predictions (≥ 3 Stars)</option>
                <option value="Mismatch">Mismatches / Errors (≤ 2 Stars)</option>
              </select>
            </div>
          </div>

          {/* Table */}
          <div style={{ overflowX: 'auto', padding: '0.5rem' }}>
            <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '0 0.5rem', textAlign: 'left' }}>
              <thead>
                <tr>
                  <th style={{ padding: '0.75rem 1.5rem', color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Complaint ID</th>
                  <th style={{ padding: '0.75rem 1.5rem', color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Customer Details</th>
                  <th style={{ padding: '0.75rem 1.5rem', color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Customer Feedback</th>
                  <th style={{ padding: '0.75rem 1.5rem', color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>QA Rating</th>
                </tr>
              </thead>
              <tbody>
                {filteredData.length === 0 ? (
                  <tr>
                    <td colSpan="4" style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-muted)' }}>
                      No feedback logs match your current filters.
                    </td>
                  </tr>
                ) : (
                  filteredData.map((item) => {
                    // In SaaS reality, rating <= 2 implies prediction failed to solve issue
                    const isMismatch = item.rating <= 2; 

                    return (
                      <tr key={item.id} style={{
                        background: isMismatch ? 'rgba(239,68,68,0.03)' : 'var(--bg-primary)',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.02)',
                        transition: 'transform 0.2s, box-shadow 0.2s',
                        borderRadius: '12px'
                      }} onMouseOver={e => e.currentTarget.style.transform = 'translateY(-2px)'} onMouseOut={e => e.currentTarget.style.transform = 'translateY(0)'}>
                        
                        {/* ID */}
                        <td style={{ padding: '1.25rem 1.5rem', borderTopLeftRadius: '12px', borderBottomLeftRadius: '12px', border: `1px solid ${isMismatch ? 'rgba(239,68,68,0.2)' : 'var(--border-subtle)'}`, borderRight: 'none', borderLeft: isMismatch ? '4px solid #ef4444' : `1px solid var(--border-subtle)` }}>
                           <div style={{ fontFamily: 'monospace', fontWeight: 700, color: 'var(--text-primary)' }}>{item.complaint_id?.substring(0, 8)}</div>
                           {item.created_at && (
                             <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '4px' }}>{timeAgo(item.created_at)}</div>
                           )}
                        </td>

                        {/* Customer Details */}
                        <td style={{ padding: '1.25rem 1.5rem', borderTop: `1px solid ${isMismatch ? 'rgba(239,68,68,0.2)' : 'var(--border-subtle)'}`, borderBottom: `1px solid ${isMismatch ? 'rgba(239,68,68,0.2)' : 'var(--border-subtle)'}` }}>
                           <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                             <span style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.9rem' }}>{item.customer_name || 'Customer'}</span>
                             <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{item.customer_email || 'No email provided'}</span>
                           </div>
                        </td>

                        {/* Customer Feedback */}
                        <td style={{ padding: '1.25rem 1.5rem', maxWidth: '300px', borderTop: `1px solid ${isMismatch ? 'rgba(239,68,68,0.2)' : 'var(--border-subtle)'}`, borderBottom: `1px solid ${isMismatch ? 'rgba(239,68,68,0.2)' : 'var(--border-subtle)'}` }}>
                           <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.5, background: 'var(--bg-secondary)', padding: '0.75rem', borderRadius: '8px', borderLeft: '2px solid rgba(0,0,0,0.1)' }}>
                             "{item.feedback_text || 'No comment provided.'}"
                           </div>
                        </td>

                        {/* Ratings */}
                        <td style={{ padding: '1.25rem 1.5rem', borderTopRightRadius: '12px', borderBottomRightRadius: '12px', border: `1px solid ${isMismatch ? 'rgba(239,68,68,0.2)' : 'var(--border-subtle)'}`, borderLeft: 'none' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                              {[...Array(5)].map((_, i) => (
                                <Star 
                                  key={i} 
                                  size={16} 
                                  fill={i < item.rating ? (isMismatch ? '#ef4444' : '#fbbf24') : 'transparent'} 
                                  color={i < item.rating ? (isMismatch ? '#ef4444' : '#fbbf24') : 'var(--border-strong)'} 
                                />
                              ))}
                            </div>
                            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '6px', fontWeight: 500, textTransform: 'uppercase' }}>
                               {item.rating}/5 Score
                            </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Feedback;