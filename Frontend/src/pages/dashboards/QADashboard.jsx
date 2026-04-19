import React, { useState, useEffect, useMemo } from 'react';
import {
  AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';
import {
  Target, AlertTriangle, ShieldAlert, CheckCircle2, TrendingUp, Loader2, AlertCircle, Star, MessageSquare
} from 'lucide-react';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://127.0.0.1:5000';
const CHART_COLORS = ['#3b82f6', '#8b5cf6', '#ec4899', '#f43f5e', '#facc15', '#22c55e', '#64748b'];

const QADashboard = () => {
  const [complaints, setComplaints] = useState([]);
  const [feedbacks, setFeedbacks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    Promise.all([
      fetch(`${BACKEND_URL}/api/complaints/all`).then(r => { if(!r.ok) throw new Error('Failed to fetch complaints'); return r.json() }),
      fetch(`${BACKEND_URL}/api/feedback/all`).then(r => { if(!r.ok) throw new Error('Failed to fetch feedback'); return r.json() })
    ])
      .then(([complaintsData, feedbackData]) => {
        setComplaints(Array.isArray(complaintsData) ? complaintsData : []);
        setFeedbacks(Array.isArray(feedbackData) ? feedbackData : []);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setError(err.message);
        setLoading(false);
      });
  }, []);

  // ─── DERIVED METRICS (Memoized) ──────────────────────────────────
  const metrics = useMemo(() => {
    if (!complaints.length) return null;

    const total = complaints.length;
    let highPriority = 0;
    let breachedSLA = 0;
    
    const categoryCounts = {};
    const dayCounts = { 'Mon': 0, 'Tue': 0, 'Wed': 0, 'Thu': 0, 'Fri': 0, 'Sat': 0, 'Sun': 0 };
    
    // Group "Root Causes" naively using Subject similarity or category subsets
    // For SaaS real data, we group by 'recommended_action' or 'category' as an approximation for root cause
    const rootCauses = {};

    complaints.forEach(c => {
      // Priority
      if (c.priority === 'High' || c.priority === 'Critical') highPriority++;
      
      // SLA Breaches
      if (c.sla_status === 'Breached') breachedSLA++;

      // Category Distribution
      const cat = c.category || 'Other';
      categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;

      // Weekly Trend (mapping created_at to Day of Week)
      if (c.created_at) {
        const d = new Date(c.created_at);
        const dayStr = d.toLocaleDateString('en-US', { weekday: 'short' }); // Mon, Tue...
        if (dayCounts[dayStr] !== undefined) {
          dayCounts[dayStr]++;
        }
      }

      // Root Cause aggregation (Using subject fragment + category as proxy)
      const rcKey = c.subject ? c.subject.substring(0, 30) : cat;
      if (!rootCauses[rcKey]) {
        rootCauses[rcKey] = {
          issue: rcKey,
          count: 0,
          priority: c.priority || 'Medium',
          category: cat
        };
      }
      rootCauses[rcKey].count++;
    });

    const categoryData = Object.keys(categoryCounts).map((k) => ({
      name: k, value: categoryCounts[k]
    })).sort((a, b) => b.value - a.value);

    // Filter root causes that appear more than once
    const recurringIssues = Object.values(rootCauses)
      .filter(rc => rc.count >= 1)
      .sort((a, b) => b.count - a.count)
      .slice(0, 8); // Top 8

    // Map ordered days for the chart
    const daysArr = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const trendData = daysArr.map(d => ({
      name: d,
      complaints: dayCounts[d]
    }));

    return { total, highPriority, breachedSLA, recurringIssues, trendData, categoryData };
  }, [complaints]);


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

  if (!metrics) {
    return <div style={{ padding: '2rem' }}>No data available to analyze.</div>;
  }

  return (
    <div className="dashboard-grid animate-fade-in">

      {/* Header */}
      <div className="col-span-12" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h2 style={{ fontWeight: '600', fontSize: '1.5rem', color: 'var(--text-primary)' }}>
          QA & Insights Engine
        </h2>
        <span style={{ fontSize: '0.85rem', background: 'var(--brand-primary)', color: 'white', padding: '4px 12px', borderRadius: '20px', fontWeight: 600 }}>LIVE SYSTEM</span>
      </div>

      {/* ─── METRICS CARDS ────────────────────────────────────────────── */}
      <div className="col-span-4">
        <div className="card" style={{ padding: '1.5rem', background: 'linear-gradient(135deg, var(--bg-card) 0%, rgba(59,130,246,0.05) 100%)', borderTop: '4px solid #3b82f6' }}>
          <div className="card-header border-none" style={{ padding: 0, marginBottom: '0.5rem' }}>
            <h3 className="card-title" style={{ fontSize: '0.95rem' }}><Target size={18} color="#3b82f6" /> Total Complaints Analyzed</h3>
          </div>
          <div className="stat-value text-gradient" style={{ fontSize: '2.5rem', color: '#3b82f6' }}>{metrics.total}</div>
          <div className="stat-label">System-wide volume</div>
        </div>
      </div>

      <div className="col-span-4">
        <div className="card" style={{ padding: '1.5rem', background: 'linear-gradient(135deg, var(--bg-card) 0%, rgba(244,63,94,0.05) 100%)', borderTop: '4px solid #f43f5e' }}>
          <div className="card-header border-none" style={{ padding: 0, marginBottom: '0.5rem' }}>
            <h3 className="card-title" style={{ fontSize: '0.95rem' }}><AlertTriangle size={18} color="#f43f5e" /> SLA Breaches Detected</h3>
          </div>
          <div className="stat-value" style={{ fontSize: '2.5rem', color: '#f43f5e' }}>{metrics.breachedSLA}</div>
          <div className="stat-label">Issues failing operational bounds</div>
        </div>
      </div>

      <div className="col-span-4">
        <div className="card" style={{ padding: '1.5rem', background: 'linear-gradient(135deg, var(--bg-card) 0%, rgba(139,92,246,0.05) 100%)', borderTop: '4px solid #8b5cf6' }}>
          <div className="card-header border-none" style={{ padding: 0, marginBottom: '0.5rem' }}>
            <h3 className="card-title" style={{ fontSize: '0.95rem' }}><ShieldAlert size={18} color="#8b5cf6" /> High Priority Backlog</h3>
          </div>
          <div className="stat-value" style={{ fontSize: '2.5rem', color: '#8b5cf6' }}>{metrics.highPriority}</div>
          <div className="stat-label">Critical escalations</div>
        </div>
      </div>

      {/* ─── CHARTS ROW ──────────────────────────────────────────────── */}
      <div className="col-span-8">
        <div className="card" style={{ height: '420px', display: 'flex', flexDirection: 'column' }}>
          <div className="card-header">
            <h3 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <TrendingUp size={18} /> Issue Trends (Weekly Volume)
            </h3>
          </div>
          <div style={{ flex: 1, padding: '1rem 1.5rem 1.5rem' }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={metrics.trendData}>
                <defs>
                  <linearGradient id="colorVolume" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" vertical={false} />
                <XAxis dataKey="name" stroke="var(--text-muted)" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="var(--text-muted)" fontSize={12} tickLine={false} axisLine={false} allowDecimals={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: '8px', boxShadow: '0 10px 25px rgba(0,0,0,0.1)' }}
                  itemStyle={{ fontSize: '14px', fontWeight: 600, color: '#3b82f6' }}
                  cursor={{ stroke: 'var(--brand-primary)', strokeWidth: 1, strokeDasharray: '4 4' }}
                />
                <Area type="monotone" dataKey="complaints" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorVolume)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Right Side Category Distribution */}
      <div className="col-span-4">
        <div className="card" style={{ height: '420px', display: 'flex', flexDirection: 'column' }}>
          <div className="card-header">
            <h3 className="card-title">Category Distribution</h3>
          </div>
          <div style={{ flex: 1, padding: '1rem', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div style={{ flex: 1, width: '100%' }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={metrics.categoryData} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={4} dataKey="value">
                    {metrics.categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-strong)', borderRadius: '8px' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            {/* Legend */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', justifyContent: 'center', marginTop: '1rem' }}>
              {metrics.categoryData.slice(0, 6).map((cat, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', fontWeight: 500, color: 'var(--text-secondary)' }}>
                  <span style={{ width: '10px', height: '10px', borderRadius: '3px', background: CHART_COLORS[i % CHART_COLORS.length] }}></span>
                  {cat.name} ({cat.value})
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ─── ROOT CAUSES PANEL ────────────────────────────────────────── */}
      <div className="col-span-12">
        <div className="card">
          <div className="card-header" style={{ paddingBottom: '1rem', borderBottom: '1px solid var(--border-subtle)' }}>
            <h3 className="card-title">Top Root Causes / Recurring Issues</h3>
          </div>
          <div style={{ padding: '0.5rem', overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr>
                  <th style={{ padding: '1rem', borderBottom: '2px solid var(--border-subtle)', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Identified Issue Profile</th>
                  <th style={{ padding: '1rem', borderBottom: '2px solid var(--border-subtle)', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Classification</th>
                  <th style={{ padding: '1rem', borderBottom: '2px solid var(--border-subtle)', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Volume</th>
                  <th style={{ padding: '1rem', borderBottom: '2px solid var(--border-subtle)', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', textAlign: 'right' }}>Severity</th>
                </tr>
              </thead>
              <tbody>
                {metrics.recurringIssues.map((item, index) => (
                  <tr key={index} style={{ borderBottom: '1px solid var(--border-subtle)', transition: 'background 0.2s', cursor: 'default' }} onMouseOver={e => e.currentTarget.style.background = 'var(--bg-secondary)'} onMouseOut={e => e.currentTarget.style.background = 'transparent'}>
                    <td style={{ padding: '1rem', fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                      {item.issue}
                    </td>
                    <td style={{ padding: '1rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                      <span style={{ background: 'rgba(99,102,241,0.1)', color: 'var(--brand-primary)', padding: '4px 10px', borderRadius: '6px', fontWeight: 600 }}>{item.category}</span>
                    </td>
                    <td style={{ padding: '1rem', fontSize: '0.9rem', fontWeight: 700 }}>
                      {item.count}
                    </td>
                    <td style={{ padding: '1rem', textAlign: 'right' }}>
                      <span style={{ 
                        padding: '4px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 600,
                        background: item.priority === 'Critical' || item.priority === 'High' ? '#fef2f2' : item.priority === 'Medium' ? '#fefce8' : '#f0fdf4',
                        color: item.priority === 'Critical' || item.priority === 'High' ? '#ef4444' : item.priority === 'Medium' ? '#eab308' : '#22c55e'
                      }}>
                        {item.priority}
                      </span>
                    </td>
                  </tr>
                ))}
                {metrics.recurringIssues.length === 0 && (
                  <tr><td colSpan="4" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>No recurring grouped issues detected.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ─── RECENT CUSTOMER FEEDBACK ────────────────────────────────────────── */}
      <div className="col-span-12">
        <div className="card">
          <div className="card-header" style={{ paddingBottom: '1rem', borderBottom: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between' }}>
            <h3 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><MessageSquare size={18} /> Recent Customer Feedback</h3>
            <a href="/qa-feedback" style={{ fontSize: '0.8rem', color: 'var(--brand-primary)', fontWeight: 600, textDecoration: 'none' }}>View All Feedback →</a>
          </div>
          <div style={{ padding: '0.5rem', overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr>
                  <th style={{ padding: '1rem', borderBottom: '2px solid var(--border-subtle)', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Complaint ID</th>
                  <th style={{ padding: '1rem', borderBottom: '2px solid var(--border-subtle)', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Customer Review</th>
                  <th style={{ padding: '1rem', borderBottom: '2px solid var(--border-subtle)', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', textAlign: 'right' }}>Rating</th>
                </tr>
              </thead>
              <tbody>
                {feedbacks.slice(0, 5).map((fb) => (
                  <tr key={fb.id} style={{ borderBottom: '1px solid var(--border-subtle)', transition: 'background 0.2s', cursor: 'default' }} onMouseOver={e => e.currentTarget.style.background = 'var(--bg-secondary)'} onMouseOut={e => e.currentTarget.style.background = 'transparent'}>
                    <td style={{ padding: '1rem', fontSize: '0.85rem', fontWeight: 600, color: 'var(--brand-primary)', fontFamily: 'monospace' }}>
                      {fb.complaint_id?.substring(0, 8)}
                    </td>
                    <td style={{ padding: '1rem', fontSize: '0.85rem', color: 'var(--text-primary)' }}>
                      <div style={{ fontStyle: 'italic', color: 'var(--text-secondary)' }}>"{fb.feedback_text || 'No comment provided.'}"</div>
                    </td>
                    <td style={{ padding: '1rem', textAlign: 'right' }}>
                       <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '4px' }}>
                          {[...Array(5)].map((_, i) => (
                            <Star 
                              key={i} 
                              size={14} 
                              fill={i < fb.rating ? '#fbbf24' : 'transparent'} 
                              color={i < fb.rating ? '#fbbf24' : 'var(--border-strong)'} 
                            />
                          ))}
                        </div>
                    </td>
                  </tr>
                ))}
                {feedbacks.length === 0 && (
                  <tr><td colSpan="3" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>No customer feedback received yet.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

    </div>
  );
};

export default QADashboard;