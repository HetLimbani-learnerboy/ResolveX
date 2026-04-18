import React, { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Activity, Clock, ShieldAlert, Loader2, AlertCircle } from 'lucide-react';

const ManagerDashboard = () => {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://127.0.0.1:5000';

  useEffect(() => {
    fetch(`${BACKEND_URL}/api/complaints/all`)
      .then(res => {
        if (!res.ok) throw new Error('Failed to fetch complaints');
        return res.json();
      })
      .then(data => {
        setComplaints(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(err => {
        console.error("Failed to fetch complaints data", err);
        setError(err.message);
        setLoading(false);
      });
  }, [BACKEND_URL]);

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
        <Loader2 size={40} className="animate-spin" color="var(--brand-primary)" />
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '50vh', gap: '1rem', color: 'var(--text-muted)' }}>
        <AlertCircle size={48} style={{ opacity: 0.4 }} />
        <h3 style={{ fontWeight: 500 }}>Could not load data</h3>
        <p style={{ fontSize: '0.9rem' }}>{error}</p>
      </div>
    );
  }

  // --- Real Values from PostgreSQL DB ---
  const totalTickets = complaints.length;
  const openTickets = complaints.filter(c => c.status === 'Open' || c.status === 'In Progress').length;
  const resolvedTickets = complaints.filter(c => c.status === 'Resolved' || c.status === 'Closed').length;

  // Category Distribution from real DB data
  const categoryCount = {};
  complaints.forEach(c => {
    const cat = c.category || 'Other';
    categoryCount[cat] = (categoryCount[cat] || 0) + 1;
  });

  const pieColors = ['#0ea5e9', '#3b82f6', '#8b5cf6', '#a855f7', '#ec4899', '#f43f5e', '#facc15', '#22c55e', '#64748b'];
  const categoryData = Object.keys(categoryCount).map((key, index) => ({
    name: key,
    value: categoryCount[key],
    color: pieColors[index % pieColors.length]
  })).sort((a, b) => b.value - a.value);

  // Priority Breakdown from real DB data
  const priorityCount = { 'Critical': 0, 'High': 0, 'Medium': 0, 'Low': 0 };
  complaints.forEach(c => {
    const p = c.priority || 'Medium';
    if (priorityCount[p] !== undefined) {
      priorityCount[p]++;
    } else {
      priorityCount['Medium']++;
    }
  });

  const priorityData = [
    { name: 'Critical', count: priorityCount['Critical'], color: '#dc2626' },
    { name: 'High', count: priorityCount['High'], color: '#ef4444' },
    { name: 'Medium', count: priorityCount['Medium'], color: '#fcd34d' },
    { name: 'Low', count: priorityCount['Low'], color: '#6ee7b7' },
  ].filter(p => p.count > 0);

  // Avg AI confidence from real data
  const avgConfidence = complaints.length > 0
    ? (complaints.reduce((sum, c) => sum + (c.ai_confidence || 0), 0) / complaints.length).toFixed(1)
    : '0.0';

  return (
    <div className="dashboard-grid animate-fade-in">
      <div className="col-span-12" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ marginBottom: '1rem', fontWeight: 600, fontSize: '1.5rem', color: 'var(--text-primary)' }}>Operations Overview</h2>
        <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', background: 'rgba(16,185,129,0.08)', padding: '4px 12px', borderRadius: '20px', fontWeight: 500 }}>● Live from Database</span>
      </div>

      {/* Stats Row */}
      <div className="col-span-3">
        <div className="card" style={{ padding: '1.5rem', background: 'linear-gradient(135deg, var(--bg-card) 0%, rgba(37,99,235,0.05) 100%)', borderLeft: '4px solid var(--brand-primary)' }}>
          <div className="card-header border-none">
            <h3 className="card-title" style={{ fontSize: '0.95rem' }}><Activity size={18} color="var(--brand-primary)" /> Total Tickets</h3>
          </div>
          <div className="stat-value text-gradient" style={{ fontSize: '2.5rem', marginTop: '0.5rem' }}>{totalTickets}</div>
          <div className="stat-label" style={{ marginTop: '0.25rem' }}>All complaints in system</div>
        </div>
      </div>
      <div className="col-span-3">
        <div className="card" style={{ padding: '1.5rem', background: 'linear-gradient(135deg, var(--bg-card) 0%, rgba(245,158,11,0.05) 100%)', borderLeft: '4px solid #f59e0b' }}>
          <div className="card-header border-none">
            <h3 className="card-title" style={{ fontSize: '0.95rem' }}><Clock size={18} color="#f59e0b" /> Open / Active</h3>
          </div>
          <div className="stat-value" style={{ fontSize: '2.5rem', marginTop: '0.5rem', color: '#f59e0b' }}>{openTickets}</div>
          <div className="stat-label" style={{ marginTop: '0.25rem' }}>Awaiting resolution</div>
        </div>
      </div>
      <div className="col-span-3">
        <div className="card" style={{ padding: '1.5rem', background: 'linear-gradient(135deg, var(--bg-card) 0%, rgba(16,185,129,0.05) 100%)', borderLeft: '4px solid #10b981' }}>
          <div className="card-header border-none">
            <h3 className="card-title" style={{ fontSize: '0.95rem' }}><ShieldAlert size={18} color="#10b981" /> Resolved</h3>
          </div>
          <div className="stat-value" style={{ fontSize: '2.5rem', marginTop: '0.5rem', color: '#10b981' }}>{resolvedTickets}</div>
          <div className="stat-label" style={{ marginTop: '0.25rem' }}>Successfully closed</div>
        </div>
      </div>
      <div className="col-span-3">
        <div className="card" style={{ padding: '1.5rem', background: 'linear-gradient(135deg, var(--bg-card) 0%, rgba(99,102,241,0.05) 100%)', borderLeft: '4px solid #6366f1' }}>
          <div className="card-header border-none">
            <h3 className="card-title" style={{ fontSize: '0.95rem' }}><ShieldAlert size={18} color="#6366f1" /> Avg AI Score</h3>
          </div>
          <div className="stat-value" style={{ fontSize: '2.5rem', marginTop: '0.5rem', color: '#6366f1' }}>{avgConfidence}%</div>
          <div className="stat-label" style={{ marginTop: '0.25rem' }}>Classification accuracy</div>
        </div>
      </div>

      {/* Charts */}
      <div className="col-span-6">
        <div className="card" style={{ height: '400px', boxShadow: '0 4px 20px rgba(0,0,0,0.05)', border: '1px solid var(--border-subtle)' }}>
          <div className="card-header" style={{ paddingBottom: '1rem', borderBottom: '1px solid var(--border-subtle)' }}>
            <h3 className="card-title" style={{ fontSize: '1.1rem' }}>Category Distribution</h3>
          </div>
          {categoryData.length === 0 ? (
            <div style={{ height: '260px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>No data available</div>
          ) : (
            <div style={{ height: '260px', marginTop: '1rem' }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={categoryData} cx="50%" cy="50%" innerRadius={70} outerRadius={100} paddingAngle={5} dataKey="value">
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-strong)', borderRadius: '8px' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
          <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', flexWrap: 'wrap', padding: '0 1rem' }}>
            {categoryData.slice(0, 6).map(item => (
              <div key={item.name} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', fontWeight: 500 }}>
                <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: item.color }}></span>
                {item.name} ({item.value})
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="col-span-6">
        <div className="card" style={{ height: '400px', boxShadow: '0 4px 20px rgba(0,0,0,0.05)', border: '1px solid var(--border-subtle)' }}>
          <div className="card-header" style={{ paddingBottom: '1rem', borderBottom: '1px solid var(--border-subtle)' }}>
            <h3 className="card-title" style={{ fontSize: '1.1rem' }}>Priority Breakdown</h3>
          </div>
          <div style={{ height: '300px', marginTop: '1rem' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={priorityData} layout="vertical" margin={{ top: 5, right: 30, left: 30, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" horizontal={false} />
                <XAxis type="number" stroke="var(--text-muted)" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis dataKey="name" type="category" stroke="var(--text-muted)" fontSize={12} tickLine={false} axisLine={false} fontWeight={600} />
                <Tooltip cursor={{ fill: 'var(--bg-secondary)' }} contentStyle={{ backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-strong)', borderRadius: '8px' }} />
                <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                  {priorityData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Recent Tickets Table */}
      <div className="col-span-12">
        <div className="card">
          <div className="card-header" style={{ paddingBottom: '1rem', borderBottom: '1px solid var(--border-subtle)' }}>
            <h3 className="card-title" style={{ fontSize: '1.1rem' }}>Recent Tickets</h3>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr>
                  <th style={{ padding: '1rem', borderBottom: '2px solid var(--border-subtle)', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)' }}>SUBJECT</th>
                  <th style={{ padding: '1rem', borderBottom: '2px solid var(--border-subtle)', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)' }}>CATEGORY</th>
                  <th style={{ padding: '1rem', borderBottom: '2px solid var(--border-subtle)', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)' }}>PRIORITY</th>
                  <th style={{ padding: '1rem', borderBottom: '2px solid var(--border-subtle)', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)' }}>STATUS</th>
                  <th style={{ padding: '1rem', borderBottom: '2px solid var(--border-subtle)', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)' }}>AI SCORE</th>
                  <th style={{ padding: '1rem', borderBottom: '2px solid var(--border-subtle)', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', textAlign: 'right' }}>ACTION</th>
                </tr>
              </thead>
              <tbody>
                {complaints.slice(0, 10).map((c, i) => (
                  <tr key={c.id || i} style={{ borderBottom: '1px solid var(--border-subtle)', transition: 'background 0.2s' }} onMouseOver={e => e.currentTarget.style.background = 'var(--bg-secondary)'} onMouseOut={e => e.currentTarget.style.background = 'transparent'}>
                    <td style={{ padding: '1rem', fontSize: '0.85rem', fontWeight: 500, maxWidth: '250px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.subject || c.complaint_text?.substring(0, 40)}</td>
                    <td style={{ padding: '1rem', fontSize: '0.85rem' }}>{c.category || 'N/A'}</td>
                    <td style={{ padding: '1rem' }}>
                      <span style={{ fontSize: '0.75rem', padding: '4px 8px', borderRadius: '4px', fontWeight: 600, background: c.priority === 'High' || c.priority === 'Critical' ? '#fef2f2' : c.priority === 'Medium' ? '#fefce8' : '#f0fdf4', color: c.priority === 'High' || c.priority === 'Critical' ? '#ef4444' : c.priority === 'Medium' ? '#eab308' : '#22c55e' }}>{c.priority}</span>
                    </td>
                    <td style={{ padding: '1rem', fontSize: '0.85rem' }}>
                      <span style={{ padding: '4px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 600, background: c.status === 'Open' ? 'rgba(37,99,235,0.1)' : c.status === 'Resolved' || c.status === 'Closed' ? 'rgba(16,185,129,0.1)' : 'rgba(245,158,11,0.1)', color: c.status === 'Open' ? 'var(--brand-primary)' : c.status === 'Resolved' || c.status === 'Closed' ? '#10b981' : '#f59e0b' }}>{c.status}</span>
                    </td>
                    <td style={{ padding: '1rem', fontSize: '0.85rem', fontWeight: 600 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <div style={{ width: '50px', height: '5px', background: 'var(--bg-secondary)', borderRadius: '3px', overflow: 'hidden' }}>
                          <div style={{ height: '100%', width: `${c.ai_confidence || 0}%`, background: (c.ai_confidence || 0) >= 80 ? '#10b981' : '#f59e0b' }}></div>
                        </div>
                        <span style={{ color: (c.ai_confidence || 0) >= 80 ? '#10b981' : '#f59e0b' }}>{c.ai_confidence || 0}%</span>
                      </div>
                    </td>
                    <td style={{ padding: '1rem', textAlign: 'right' }}>
                      <select
                        defaultValue={c.status}
                        onChange={async (e) => {
                          const newStatus = e.target.value;
                          try {
                            await fetch(`${BACKEND_URL}/api/complaints/update-status/${c.id}`, {
                              method: 'PUT',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ status: newStatus })
                            });
                            setComplaints(prev => prev.map(item => item.id === c.id ? { ...item, status: newStatus } : item));
                          } catch (err) {
                            alert('Failed to update status');
                          }
                        }}
                        style={{ padding: '6px 10px', borderRadius: '6px', border: '1px solid var(--border-strong)', background: 'var(--bg-primary)', fontSize: '0.8rem', fontWeight: 500, cursor: 'pointer', outline: 'none' }}
                      >
                        <option value="Open">Open</option>
                        <option value="In Progress">In Progress</option>
                        <option value="Resolved">Resolved</option>
                        <option value="Closed">Closed</option>
                      </select>
                    </td>
                  </tr>
                ))}
                {complaints.length === 0 && (
                  <tr><td colSpan="6" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>No complaints in database yet.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ManagerDashboard;
