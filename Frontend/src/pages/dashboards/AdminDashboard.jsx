import React, { useState, useEffect } from 'react';
import { Database, Server, Users, Layers, RefreshCw, Activity, FileText, Download, Settings, Tag, Cpu, Trash2, Plus, X, CheckCircle, AlertCircle, Clock } from 'lucide-react';
import { Link } from 'react-router-dom';
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';

const COLORS = ['#2563eb', '#059669', '#d97706', '#dc2626', '#6366f1', '#0891b2', '#f97316'];
const API = 'http://localhost:5000/api/admin';

const AdminDashboard = () => {
  // Tab state
  const [activeTab, setActiveTab] = useState('overview');

  // Overview data
  const [stats, setStats] = useState({ total_users: 0, active_users: 0, role_breakdown: {}, total_complaints: 0, total_categories: 0 });
  const [isLoading, setIsLoading] = useState(true);

  // Categories
  const [categories, setCategories] = useState([]);
  const [newCat, setNewCat] = useState({ name: '', description: '' });
  const [showAddCat, setShowAddCat] = useState(false);

  // Complaints (for export)
  const [complaints, setComplaints] = useState([]);

  // Retrain
  const [retrainStatus, setRetrainStatus] = useState({ status: 'idle', last_trained: null, message: '' });
  const [isRetraining, setIsRetraining] = useState(false);

  // System Config
  const [config, setConfig] = useState(null);

  // ============ Fetch Functions ============
  const fetchStats = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`${API}/stats`);
      setStats(await res.json());
    } catch (err) { console.error(err); }
    finally { setIsLoading(false); }
  };

  const fetchCategories = async () => {
    try {
      const res = await fetch(`${API}/categories`);
      setCategories(await res.json());
    } catch (err) { console.error(err); }
  };

  const fetchComplaints = async () => {
    try {
      const res = await fetch(`${API}/complaints`);
      setComplaints(await res.json());
    } catch (err) { console.error(err); }
  };

  const fetchRetrainStatus = async () => {
    try {
      const res = await fetch(`${API}/retrain/status`);
      const data = await res.json();
      setRetrainStatus(data);
      if (data.status === 'training') setIsRetraining(true);
      else setIsRetraining(false);
    } catch (err) { console.error(err); }
  };

  const fetchConfig = async () => {
    try {
      const res = await fetch(`${API}/config`);
      setConfig(await res.json());
    } catch (err) { console.error(err); }
  };

  useEffect(() => { fetchStats(); fetchComplaints(); }, []);

  useEffect(() => {
    if (activeTab === 'overview') { fetchStats(); fetchComplaints(); }
    if (activeTab === 'categories') { fetchCategories(); fetchComplaints(); }
    if (activeTab === 'export') fetchComplaints();
    if (activeTab === 'retrain') fetchRetrainStatus();
    if (activeTab === 'config') fetchConfig();
  }, [activeTab]);

  // ============ Actions ============
  const addCategory = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API}/categories`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newCat)
      });
      if (res.ok) { setNewCat({ name: '', description: '' }); setShowAddCat(false); fetchCategories(); fetchStats(); }
      else { const d = await res.json(); alert(d.error); }
    } catch (err) { alert('Failed'); }
  };

  const deleteCategory = async (name) => {
    if (!window.confirm(`Delete category "${name}"?`)) return;
    await fetch(`${API}/categories/${name}`, { method: 'DELETE' });
    fetchCategories(); fetchStats();
  };

  const triggerRetrain = async () => {
    setIsRetraining(true);
    try {
      await fetch(`${API}/retrain`, { method: 'POST' });
      // Poll for status
      const poll = setInterval(async () => {
        const res = await fetch(`${API}/retrain/status`);
        const data = await res.json();
        setRetrainStatus(data);
        if (data.status !== 'training') { clearInterval(poll); setIsRetraining(false); }
      }, 2000);
    } catch (err) { setIsRetraining(false); alert('Failed to start retraining'); }
  };

  const exportCSV = () => { window.open(`${API}/export/csv`, '_blank'); };
  const exportJSON = () => { window.open(`${API}/export/json`, '_blank'); };

  // ============ Derived Data ============
  const roleChartData = Object.entries(stats.role_breakdown).map(([name, value]) => ({
    name: name.charAt(0).toUpperCase() + name.slice(1), value
  }));
  const displayRoleData = roleChartData.length > 0 ? roleChartData : [
    { name: 'Admin', value: 2 }, { name: 'Support', value: 8 }, { name: 'Customer', value: 45 }, { name: 'QA', value: 3 },
  ];

  // Category-wise complaint breakdown from real data
  const categoryBreakdown = complaints.reduce((acc, c) => {
    acc[c.category] = (acc[c.category] || 0) + 1;
    return acc;
  }, {});
  const categoryChartData = Object.entries(categoryBreakdown).map(([name, count]) => ({ name, count }));

  // Shared styles
  const inputStyle = {
    padding: '0.5rem 0.75rem', backgroundColor: 'var(--bg-primary)',
    border: '1px solid var(--border-strong)', borderRadius: 'var(--radius-md)',
    color: 'var(--text-primary)', width: '100%', fontSize: '0.875rem'
  };

  const tabStyle = (tab) => ({
    padding: '0.6rem 1.25rem', borderRadius: 'var(--radius-md)', fontSize: '0.85rem', fontWeight: 500,
    cursor: 'pointer', transition: 'all 0.2s',
    background: activeTab === tab ? 'var(--brand-primary)' : 'transparent',
    color: activeTab === tab ? '#fff' : 'var(--text-secondary)',
    border: activeTab === tab ? '1px solid var(--brand-primary)' : '1px solid var(--border-subtle)',
    display: 'flex', alignItems: 'center', gap: '6px'
  });

  const sectionCard = { padding: '1.5rem' };

  // ============ Render ============
  return (
    <div className="dashboard-grid">
      {/* Header */}
      <div className="col-span-12">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h2 style={{ fontWeight: '500' }}>System Administration</h2>
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button className="btn btn-secondary" onClick={() => { fetchStats(); if (activeTab === 'categories') fetchCategories(); if (activeTab === 'export') fetchComplaints(); }} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <RefreshCw size={16} /> Refresh
            </button>
            <Link to="/admin/users" className="btn btn-primary">Manage Users</Link>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="col-span-12">
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1.5rem', padding: '0.5rem', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-lg)' }}>
          <button style={tabStyle('overview')} onClick={() => setActiveTab('overview')}><Activity size={15} /> Overview</button>
          <button style={tabStyle('categories')} onClick={() => setActiveTab('categories')}><Tag size={15} /> Manage Categories</button>
          <button style={tabStyle('export')} onClick={() => setActiveTab('export')}><Download size={15} /> Export Reports</button>
          <button style={tabStyle('retrain')} onClick={() => setActiveTab('retrain')}><Cpu size={15} /> Retrain Models</button>
          <button style={tabStyle('config')} onClick={() => setActiveTab('config')}><Settings size={15} /> System Config</button>
        </div>
      </div>

      {/* ==================== OVERVIEW TAB ==================== */}
      {activeTab === 'overview' && (
        <>
          {/* Stat Cards */}
          <div className="col-span-3">
            <div className="card"><div className="card-header border-none"><h3 className="card-title"><Users size={18} /> Total Users</h3></div>
              <div className="stat-value">{isLoading ? '...' : stats.total_users}</div><div className="stat-label">Registered accounts</div></div>
          </div>
          <div className="col-span-3">
            <div className="card"><div className="card-header border-none"><h3 className="card-title"><Users size={18} /> Active Users</h3></div>
              <div className="stat-value" style={{ color: 'var(--brand-primary)' }}>{isLoading ? '...' : stats.active_users}</div><div className="stat-label">Currently active</div></div>
          </div>
          <div className="col-span-3">
            <div className="card"><div className="card-header border-none"><h3 className="card-title"><FileText size={18} /> Complaints</h3></div>
              <div className="stat-value">{isLoading ? '...' : stats.total_complaints}</div><div className="stat-label">Processed this session</div></div>
          </div>
          <div className="col-span-3">
            <div className="card"><div className="card-header border-none"><h3 className="card-title"><Tag size={18} /> Categories</h3></div>
              <div className="stat-value">{isLoading ? '...' : stats.total_categories}</div><div className="stat-label">Active categories</div></div>
          </div>

          {/* Charts */}
          <div className="col-span-8">
            <div className="card" style={{ height: '100%' }}>
              <div className="card-header">
                <h3 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Activity size={18} color="var(--brand-accent)" /> Category-wise Complaint Volume
                </h3>
              </div>
              <div style={{ padding: '0 1.5rem 1.5rem', height: '300px' }}>
                {categoryChartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={categoryChartData} margin={{ top: 10, right: 10, left: -20, bottom: 30 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" vertical={false} />
                      <XAxis dataKey="name" stroke="var(--text-muted)" fontSize={11} tickLine={false} axisLine={false} angle={-35} textAnchor="end" interval={0} />
                      <YAxis stroke="var(--text-muted)" fontSize={11} tickLine={false} axisLine={false} allowDecimals={false} />
                      <Tooltip contentStyle={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-strong)', borderRadius: '8px' }} />
                      <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                        {categoryChartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-muted)', flexDirection: 'column', gap: '0.5rem' }}>
                    <FileText size={32} strokeWidth={1} />
                    <span>No complaints yet. Process some from the Support Dashboard.</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="col-span-4">
            <div className="card" style={{ height: '100%' }}>
              <div className="card-header"><h3 className="card-title"><Users size={18} /> Role Distribution</h3></div>
              <div style={{ padding: '0 0.5rem 1.5rem', height: '300px' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={displayRoleData} cx="50%" cy="45%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value" stroke="none">
                      {displayRoleData.map((entry, index) => (<Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />))}
                    </Pie>
                    <Tooltip contentStyle={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-strong)', borderRadius: '8px' }} />
                    <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '12px' }}/>
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* AI Module Status Grid */}
          <div className="col-span-12">
            <div className="card">
              <div className="card-header"><h3 className="card-title"><Layers size={18} /> AI Module Status Grid</h3></div>
              <div style={{ padding: '1.5rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                {['Fraud Detection', 'Category Classifier', 'Priority Predictor', 'Summary Generator', 'Recommendation Engine'].map((mod, i) => (
                  <div key={i} style={{ padding: '1rem', background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)', borderRadius: '8px', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 500 }}>{mod}</span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', color: 'var(--status-low-text)', fontWeight: 600 }}>
                      <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'currentColor', boxShadow: '0 0 6px currentColor' }}></span>
                      Online
                    </span>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Engine: Gemini 1.5 Flash</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}

      {/* ==================== MANAGE CATEGORIES TAB ==================== */}
      {activeTab === 'categories' && (
        <div className="col-span-12">
          <div className="card">
            <div className="card-header">
              <h3 className="card-title"><Tag size={18} /> Manage Complaint Categories</h3>
              <button className="btn btn-primary" onClick={() => setShowAddCat(!showAddCat)} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Plus size={16} /> Add Category
              </button>
            </div>

            {showAddCat && (
              <form onSubmit={addCategory} className="animate-fade-in" style={{ padding: '0 1.5rem 1rem', display: 'flex', gap: '1rem', alignItems: 'flex-end' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Category Name</label>
                  <input style={inputStyle} placeholder="e.g. Warranty" value={newCat.name} onChange={e => setNewCat({ ...newCat, name: e.target.value })} required />
                </div>
                <div style={{ flex: 2 }}>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Description</label>
                  <input style={inputStyle} placeholder="Brief description..." value={newCat.description} onChange={e => setNewCat({ ...newCat, description: e.target.value })} />
                </div>
                <button type="submit" className="btn btn-primary">Save</button>
                <button type="button" className="btn btn-secondary" onClick={() => setShowAddCat(false)}>Cancel</button>
              </form>
            )}

            <div className="table-wrapper">
              <table>
                <thead>
                  <tr><th>#</th><th>Category Name</th><th>Description</th><th>Complaints</th><th>Action</th></tr>
                </thead>
                <tbody>
                  {categories.map((cat, i) => (
                    <tr key={i}>
                      <td style={{ color: 'var(--text-muted)' }}>{i + 1}</td>
                      <td style={{ fontWeight: 600 }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: COLORS[i % COLORS.length] }}></span>
                          {cat.name}
                        </span>
                      </td>
                      <td style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>{cat.description || '—'}</td>
                      <td>
                        <span style={{ padding: '2px 10px', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-full)', fontSize: '0.8rem', fontWeight: 600 }}>
                          {categoryBreakdown[cat.name] || 0}
                        </span>
                      </td>
                      <td>
                        <button className="icon-btn" title="Delete" style={{ color: 'var(--status-high-text)' }} onClick={() => deleteCategory(cat.name)}>
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ==================== EXPORT REPORTS TAB ==================== */}
      {activeTab === 'export' && (
        <div className="col-span-12">
          <div className="card">
            <div className="card-header">
              <h3 className="card-title"><Download size={18} /> Export Complaint Reports</h3>
            </div>
            <div style={sectionCard}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem', marginBottom: '2rem' }}>
                <div style={{ padding: '1.25rem', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)', textAlign: 'center' }}>
                  <div style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--brand-primary)' }}>{complaints.length}</div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Total Complaints</div>
                </div>
                <div style={{ padding: '1.25rem', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)', textAlign: 'center' }}>
                  <div style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--status-high-text)' }}>
                    {complaints.filter(c => c.priority === 'High').length}
                  </div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>High Priority</div>
                </div>
                <div style={{ padding: '1.25rem', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)', textAlign: 'center' }}>
                  <div style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--status-low-text)' }}>
                    {Object.keys(categoryBreakdown).length}
                  </div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Categories Observed</div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem' }}>
                <button className="btn btn-primary" onClick={exportCSV} disabled={complaints.length === 0} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '0.75rem 1.5rem' }}>
                  <Download size={18} /> Download CSV Report
                </button>
                <button className="btn btn-secondary" onClick={exportJSON} disabled={complaints.length === 0} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '0.75rem 1.5rem' }}>
                  <FileText size={18} /> Download JSON Report
                </button>
              </div>

              {complaints.length === 0 && (
                <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)' }}>
                  <AlertCircle size={32} strokeWidth={1} style={{ marginBottom: '0.5rem' }} />
                  <p>No complaints have been processed yet. Go to the <strong>Support Dashboard</strong>, analyze some complaints, and come back here to export.</p>
                </div>
              )}

              {complaints.length > 0 && (
                <div className="table-wrapper" style={{ maxHeight: '350px', overflowY: 'auto' }}>
                  <table>
                    <thead><tr><th>ID</th><th>Time</th><th>Category</th><th>Priority</th><th>Sentiment</th><th>Summary</th></tr></thead>
                    <tbody>
                      {complaints.map((c, i) => (
                        <tr key={i}>
                          <td style={{ fontWeight: 500, color: 'var(--brand-primary)' }}>{c.id}</td>
                          <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{c.timestamp}</td>
                          <td>{c.category}</td>
                          <td><span className={`badge ${c.priority?.toLowerCase()}`}>{c.priority}</span></td>
                          <td style={{ color: c.sentiment_score < -0.3 ? 'var(--status-high-text)' : c.sentiment_score > 0.2 ? 'var(--status-low-text)' : 'var(--status-medium-text)' }}>{c.sentiment_score}</td>
                          <td style={{ fontSize: '0.8rem', maxWidth: '250px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.summary}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ==================== RETRAIN MODELS TAB ==================== */}
      {activeTab === 'retrain' && (
        <div className="col-span-12">
          <div className="card">
            <div className="card-header">
              <h3 className="card-title"><Cpu size={18} /> Retrain AI Models</h3>
            </div>
            <div style={sectionCard}>
              <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem', fontSize: '0.9rem', lineHeight: '1.6' }}>
                Retrain all 5 AI modules (Fraud Detection, Category Classifier, Priority Predictor, Summary Generator, Recommendation Engine) using the latest complaint data. The LLM-based models are always up-to-date, but the ML fallback models (LinearSVC + RandomForest) can be refreshed here.
              </p>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '2rem' }}>
                <div style={{ padding: '1.25rem', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
                  <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '8px' }}>Current Status</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1rem', fontWeight: 600,
                    color: retrainStatus.status === 'completed' ? 'var(--status-low-text)' : retrainStatus.status === 'training' ? 'var(--status-medium-text)' : retrainStatus.status === 'failed' ? 'var(--status-high-text)' : 'var(--text-secondary)' }}>
                    {retrainStatus.status === 'training' && <><RefreshCw size={16} className="animate-pulse" /> Training in progress...</>}
                    {retrainStatus.status === 'completed' && <><CheckCircle size={16} /> Completed</>}
                    {retrainStatus.status === 'failed' && <><AlertCircle size={16} /> Failed</>}
                    {retrainStatus.status === 'idle' && <><Clock size={16} /> Idle — Ready to train</>}
                  </div>
                </div>
                <div style={{ padding: '1.25rem', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
                  <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '8px' }}>Last Trained</div>
                  <div style={{ fontSize: '1rem', fontWeight: 600 }}>
                    {retrainStatus.last_trained || 'Never'}
                  </div>
                </div>
              </div>

              {retrainStatus.message && retrainStatus.status !== 'idle' && (
                <div style={{ padding: '0.75rem 1rem', marginBottom: '1.5rem', borderRadius: 'var(--radius-md)',
                  background: retrainStatus.status === 'completed' ? 'var(--status-low-bg)' : retrainStatus.status === 'failed' ? 'var(--status-high-bg)' : 'var(--status-medium-bg)',
                  color: retrainStatus.status === 'completed' ? 'var(--status-low-text)' : retrainStatus.status === 'failed' ? 'var(--status-high-text)' : 'var(--status-medium-text)',
                  fontSize: '0.875rem', fontWeight: 500 }}>
                  {retrainStatus.message}
                </div>
              )}

              <button className="btn btn-primary" onClick={triggerRetrain} disabled={isRetraining}
                style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '0.75rem 2rem' }}>
                {isRetraining ? <><RefreshCw size={18} className="animate-pulse" /> Retraining...</> : <><Cpu size={18} /> Start Retraining</>}
              </button>

              <div style={{ marginTop: '2rem' }}>
                <h4 style={{ fontSize: '0.9rem', marginBottom: '1rem', color: 'var(--text-secondary)' }}>Modules that will be retrained:</h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.75rem' }}>
                  {['Fraud Detection (LLM)', 'Category Classifier (LLM)', 'Priority Predictor (LLM)', 'Summary Generator (LLM)', 'Recommendation Engine (LLM)'].map((m, i) => (
                    <div key={i} style={{ padding: '0.75rem', background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)', borderRadius: '6px', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <CheckCircle size={14} color="var(--status-low-text)" /> {m}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==================== SYSTEM CONFIG TAB ==================== */}
      {activeTab === 'config' && config && (
        <div className="col-span-12">
          <div className="card">
            <div className="card-header">
              <h3 className="card-title"><Settings size={18} /> System Configuration</h3>
            </div>
            <div style={sectionCard}>
              {/* API Keys & Database */}
              <h4 style={{ fontSize: '0.85rem', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '1rem', letterSpacing: '0.05em' }}>Credentials & Connections</h4>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '2rem' }}>
                <div style={{ padding: '1rem', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
                  <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '6px' }}>Gemini API Key</div>
                  <div style={{ fontFamily: 'monospace', fontSize: '0.9rem', marginBottom: '4px' }}>{config.gemini_api_key}</div>
                  <div style={{ fontSize: '0.8rem', color: config.gemini_status === 'Connected' ? 'var(--status-low-text)' : 'var(--status-high-text)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: 'currentColor' }}></span>
                    {config.gemini_status}
                  </div>
                </div>
                <div style={{ padding: '1rem', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
                  <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '6px' }}>Database URL</div>
                  <div style={{ fontFamily: 'monospace', fontSize: '0.9rem', marginBottom: '4px', wordBreak: 'break-all' }}>{config.database_url}</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--status-medium-text)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: 'currentColor' }}></span>
                    {config.database_status}
                  </div>
                </div>
              </div>

              {/* Server Info */}
              <h4 style={{ fontSize: '0.85rem', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '1rem', letterSpacing: '0.05em' }}>Server & Runtime</h4>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem', marginBottom: '2rem' }}>
                <div style={{ padding: '1rem', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
                  <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '4px' }}>Server Port</div>
                  <div style={{ fontWeight: 600 }}>{config.server_port}</div>
                </div>
                <div style={{ padding: '1rem', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
                  <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '4px' }}>Debug Mode</div>
                  <div style={{ fontWeight: 600, color: config.debug_mode ? 'var(--status-medium-text)' : 'var(--text-primary)' }}>{config.debug_mode ? 'Enabled' : 'Disabled'}</div>
                </div>
                <div style={{ padding: '1rem', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
                  <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '4px' }}>ML Fallback</div>
                  <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>{config.ml_fallback}</div>
                </div>
              </div>

              {/* AI Modules Config */}
              <h4 style={{ fontSize: '0.85rem', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '1rem', letterSpacing: '0.05em' }}>AI Module Configuration</h4>
              <div className="table-wrapper">
                <table>
                  <thead><tr><th>Module</th><th>Engine</th><th>Status</th></tr></thead>
                  <tbody>
                    {config.ai_modules.map((m, i) => (
                      <tr key={i}>
                        <td style={{ fontWeight: 500 }}>{m.name}</td>
                        <td style={{ fontFamily: 'monospace', fontSize: '0.85rem' }}>{m.engine}</td>
                        <td>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--status-low-text)', fontSize: '0.85rem', fontWeight: 500 }}>
                            <span style={{ width: '7px', height: '7px', borderRadius: '50%', backgroundColor: 'currentColor' }}></span>
                            Active
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
