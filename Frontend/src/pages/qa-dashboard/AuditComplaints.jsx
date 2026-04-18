import React, { useEffect, useState } from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  LineChart,
  Line,
  Cell
} from "recharts";
import { AlertCircle, CheckCircle2, BarChart3, Target, Loader2, Search } from 'lucide-react';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://127.0.0.1:5000';

const AuditComplaints = () => {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch(`${BACKEND_URL}/api/complaints/all`)
      .then(res => {
        if (!res.ok) throw new Error("Failed to fetch audit data");
        return res.json();
      })
      .then(data => {
        // Use the real ai_confidence from the database
        const enhancedData = (Array.isArray(data) ? data : []).map(c => ({
          ...c,
          ai_confidence: c.ai_confidence || 0
        }));
        setComplaints(enhancedData);
        setLoading(false);
      })
      .catch(err => {
        console.error("Audit Fetch Error:", err);
        setError("Could not load audit data. Please check backend connection.");
        setLoading(false);
      });
  }, []);

  /* ======================================
     METRICS — Real from DB
  ====================================== */
  const totalReviewed = complaints.length;
  
  const correctCount = complaints.filter(
    (item) => (item.ai_confidence || 0) >= 80
  ).length;

  const aiAccuracy = totalReviewed > 0 
    ? (complaints.reduce((acc, curr) => acc + (curr.ai_confidence || 0), 0) / totalReviewed).toFixed(1) 
    : '0.0';

  const flaggedCount = totalReviewed - correctCount;

  /* ======================================
     CATEGORY GRAPH DATA
  ====================================== */
  const categoryMap = {};
  complaints.forEach(item => {
    const cat = item.category || 'Other';
    if (!categoryMap[cat]) categoryMap[cat] = { total: 0, highConfidence: 0 };
    categoryMap[cat].total += 1;
    if ((item.ai_confidence || 0) >= 80) categoryMap[cat].highConfidence += 1;
  });

  const categoryData = Object.keys(categoryMap).map(cat => ({
    name: cat,
    total: categoryMap[cat].total,
    correct: categoryMap[cat].highConfidence
  }));

  /* ======================================
     STATUS DISTRIBUTION
  ====================================== */
  const statusMap = {};
  complaints.forEach(item => {
    const s = item.status || 'Open';
    statusMap[s] = (statusMap[s] || 0) + 1;
  });
  const statusData = Object.keys(statusMap).map(s => ({
    name: s,
    count: statusMap[s]
  }));

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
        <Loader2 size={40} className="animate-spin" color="var(--brand-primary)" />
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '50vh', gap: '1rem' }}>
        <AlertCircle size={48} style={{ color: '#ef4444', opacity: 0.6 }} />
        <h3 style={{ fontWeight: 500 }}>Error Loading Data</h3>
        <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>{error}</p>
      </div>
    );
  }

  return (
    <div className="p-2 animate-fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 600, color: 'var(--text-primary)' }}>AI Quality Audit</h2>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>Real-time evaluation of AI classification accuracy from database</div>
        </div>
        <span style={{ fontSize: '0.8rem', color: '#10b981', background: 'rgba(16,185,129,0.08)', padding: '4px 12px', borderRadius: '20px', fontWeight: 500 }}>● Live Data</span>
      </div>

      <div className="dashboard-grid">
        {/* Metric Cards */}
        <div className="col-span-4">
          <div className="card" style={{ padding: '1.5rem', background: 'linear-gradient(135deg, var(--bg-card) 0%, rgba(99,102,241,0.05) 100%)', borderLeft: '4px solid #6366f1' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{ padding: '0.75rem', borderRadius: '12px', background: 'rgba(99,102,241,0.1)' }}>
                <BarChart3 size={24} color="#6366f1" />
              </div>
              <div>
                <div style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--text-primary)' }}>{totalReviewed}</div>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Total Complaints in DB</div>
              </div>
            </div>
          </div>
        </div>

        <div className="col-span-4">
          <div className="card" style={{ padding: '1.5rem', background: 'linear-gradient(135deg, var(--bg-card) 0%, rgba(16,185,129,0.05) 100%)', borderLeft: '4px solid #10b981' }}>
             <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{ padding: '0.75rem', borderRadius: '12px', background: 'rgba(16,185,129,0.1)' }}>
                <Target size={24} color="#10b981" />
              </div>
              <div>
                <div style={{ fontSize: '2rem', fontWeight: 700, color: '#10b981' }}>{aiAccuracy}%</div>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Avg AI Confidence Score</div>
              </div>
            </div>
          </div>
        </div>

        <div className="col-span-4">
          <div className="card" style={{ padding: '1.5rem', background: 'linear-gradient(135deg, var(--bg-card) 0%, rgba(244,63,94,0.05) 100%)', borderLeft: '4px solid #f43f5e' }}>
             <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{ padding: '0.75rem', borderRadius: '12px', background: 'rgba(244,63,94,0.1)' }}>
                <AlertCircle size={24} color="#f43f5e" />
              </div>
              <div>
                <div style={{ fontSize: '2rem', fontWeight: 700, color: '#f43f5e' }}>{flaggedCount}</div>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600 }}>{"Flagged (< 80% Confidence)"}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Charts */}
        <div className="col-span-6">
          <div className="card" style={{ height: '380px' }}>
            <div className="card-header" style={{ paddingBottom: '1rem', borderBottom: '1px solid var(--border-subtle)' }}>
              <h3 className="card-title" style={{ fontSize: '1.1rem' }}>Accuracy by Category</h3>
            </div>
            <div style={{ height: '280px', marginTop: '1rem' }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={categoryData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-subtle)" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'var(--text-muted)' }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'var(--text-muted)' }} />
                  <Tooltip cursor={{fill: 'var(--bg-secondary)'}} contentStyle={{ backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-strong)', borderRadius: '8px' }} />
                  <Bar dataKey="total" name="Total" fill="var(--border-strong)" radius={[4, 4, 0, 0]} barSize={20} />
                  <Bar dataKey="correct" name="High Confidence" fill="#6366f1" radius={[4, 4, 0, 0]} barSize={20} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <div className="col-span-6">
          <div className="card" style={{ height: '380px' }}>
            <div className="card-header" style={{ paddingBottom: '1rem', borderBottom: '1px solid var(--border-subtle)' }}>
              <h3 className="card-title" style={{ fontSize: '1.1rem' }}>Ticket Status Distribution</h3>
            </div>
            <div style={{ height: '280px', marginTop: '1rem' }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={statusData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-subtle)" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'var(--text-muted)' }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'var(--text-muted)' }} />
                  <Tooltip contentStyle={{ backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-strong)', borderRadius: '8px' }} />
                  <Bar dataKey="count" name="Count" fill="#0ea5e9" radius={[4, 4, 0, 0]} barSize={30} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Audit Table */}
        <div className="col-span-12">
          <div className="card">
            <div className="card-header" style={{ paddingBottom: '1rem', borderBottom: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 className="card-title" style={{ fontSize: '1.1rem' }}>Detailed AI Audits</h3>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Showing {Math.min(complaints.length, 10)} of {complaints.length}</span>
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr>
                    <th style={{ padding: '1rem', borderBottom: '1px solid var(--border-subtle)', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)' }}>SUBJECT</th>
                    <th style={{ padding: '1rem', borderBottom: '1px solid var(--border-subtle)', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)' }}>CATEGORY</th>
                    <th style={{ padding: '1rem', borderBottom: '1px solid var(--border-subtle)', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)' }}>PRIORITY</th>
                    <th style={{ padding: '1rem', borderBottom: '1px solid var(--border-subtle)', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)' }}>STATUS</th>
                    <th style={{ padding: '1rem', borderBottom: '1px solid var(--border-subtle)', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)' }}>AI CONFIDENCE</th>
                  </tr>
                </thead>
                <tbody>
                  {complaints.length > 0 ? (
                    complaints.slice(0, 10).map((item, index) => (
                      <tr key={item.id || index} style={{ borderBottom: '1px solid var(--border-subtle)', transition: 'background 0.2s', cursor: 'pointer' }} onMouseOver={e => e.currentTarget.style.background = 'var(--bg-secondary)'} onMouseOut={e => e.currentTarget.style.background = 'transparent'}>
                        <td style={{ padding: '1rem', fontSize: '0.85rem', fontWeight: 500, maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.subject || 'No Subject'}</td>
                        <td style={{ padding: '1rem', fontSize: '0.85rem', color: 'var(--text-primary)' }}>{item.category}</td>
                        <td style={{ padding: '1rem' }}>
                          <span style={{ fontSize: '0.75rem', padding: '4px 8px', borderRadius: '4px', background: item.priority === 'High' || item.priority === 'Critical' ? '#fef2f2' : item.priority === 'Medium' ? '#fdf8ea' : '#ecfdf5', color: item.priority === 'High' || item.priority === 'Critical' ? '#ef4444' : item.priority === 'Medium' ? '#f59e0b' : '#10b981', fontWeight: 600 }}>{item.priority}</span>
                        </td>
                        <td style={{ padding: '1rem', fontSize: '0.85rem' }}>
                          <span style={{ padding: '4px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 600, background: item.status === 'Open' ? 'rgba(37,99,235,0.1)' : 'rgba(16,185,129,0.1)', color: item.status === 'Open' ? 'var(--brand-primary)' : '#10b981' }}>{item.status}</span>
                        </td>
                        <td style={{ padding: '1rem', fontSize: '0.85rem', fontWeight: 600 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <div style={{ width: '60px', height: '6px', background: 'var(--bg-secondary)', borderRadius: '3px', overflow: 'hidden' }}>
                              <div style={{ height: '100%', width: `${item.ai_confidence || 0}%`, background: (item.ai_confidence || 0) >= 80 ? '#10b981' : '#f59e0b' }}></div>
                            </div>
                            <span style={{ color: (item.ai_confidence || 0) >= 80 ? '#10b981' : '#f59e0b' }}>{item.ai_confidence || 0}%</span>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="5" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>No audit records found in database</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuditComplaints;