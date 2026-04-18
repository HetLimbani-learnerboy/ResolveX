import React, { useState, useEffect, useCallback } from 'react';
import {
  PlayCircle, X, Sparkles, Mail, Phone, MessageSquare,
  Clock, BarChart as BarChartIcon, RefreshCw, ChevronDown,
  AlertTriangle, CheckCircle2, Loader2, TrendingUp,
  Shield, Zap, Eye, Filter, Search
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid, Cell
} from 'recharts';

// ─── Constants ──────────────────────────────────────────────────────────────
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://127.0.0.1:5000';

const PRIORITY_META = {
  Critical: { color: '#ef4444', bg: 'rgba(239,68,68,0.12)',  label: 'Critical'  },
  High:     { color: '#f97316', bg: 'rgba(249,115,22,0.12)', label: 'High'      },
  Medium:   { color: '#eab308', bg: 'rgba(234,179,8,0.12)',  label: 'Medium'    },
  Low:      { color: '#22c55e', bg: 'rgba(34,197,94,0.12)',  label: 'Low'       },
  None:     { color: '#6b7280', bg: 'rgba(107,114,128,0.1)', label: 'None'      },
};

const STATUS_META = {
  Open:         { color: '#60a5fa', bg: 'rgba(96,165,250,0.12)'  },
  'Under Review':{ color: '#a78bfa', bg: 'rgba(167,139,250,0.12)' },
  'In Progress': { color: '#fbbf24', bg: 'rgba(251,191,36,0.12)'  },
  Escalated:    { color: '#ef4444', bg: 'rgba(239,68,68,0.12)'   },
  Resolved:     { color: '#34d399', bg: 'rgba(52,211,153,0.12)'  },
  Closed:       { color: '#6b7280', bg: 'rgba(107,114,128,0.12)' },
};

const VALID_STATUSES = ['Open', 'Under Review', 'In Progress', 'Escalated', 'Resolved', 'Closed'];
const CHART_COLORS   = ['#818cf8','#34d399','#fbbf24','#f87171','#a78bfa','#22d3ee','#fb923c'];

// ─── Tiny helpers ────────────────────────────────────────────────────────────
const PriorityBadge = ({ priority }) => {
  const m = PRIORITY_META[priority] || PRIORITY_META.None;
  return (
    <span style={{
      padding: '3px 10px', borderRadius: '20px', fontSize: '0.72rem',
      fontWeight: 700, letterSpacing: '0.4px',
      background: m.bg, color: m.color,
      border: `1px solid ${m.color}40`,
    }}>{m.label}</span>
  );
};

const StatusBadge = ({ status }) => {
  const m = STATUS_META[status] || STATUS_META.Open;
  return (
    <span style={{
      padding: '3px 10px', borderRadius: '20px', fontSize: '0.72rem',
      fontWeight: 600, background: m.bg, color: m.color,
      border: `1px solid ${m.color}40`,
    }}>{status}</span>
  );
};

const ChannelIcon = ({ channel, size = 13 }) => {
  if (channel === 'Email') return <Mail size={size} />;
  if (channel === 'Call')  return <Phone size={size} />;
  return <MessageSquare size={size} />;
};

const shortId = (id) => id ? String(id).substring(0, 8).toUpperCase() : '—';
const fmtDate  = (iso) => {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-GB', { day:'2-digit', month:'short', year:'numeric' });
};

// ─── Main Component ──────────────────────────────────────────────────────────
const SupportDashboard = () => {
  // ── State ─────────────────────────────────────────────────────────────────
  const [tickets,         setTickets]         = useState([]);
  const [isLoading,       setIsLoading]       = useState(true);
  const [refreshing,      setRefreshing]      = useState(false);
  const [selectedTicket,  setSelectedTicket]  = useState(null);
  const [searchQuery,     setSearchQuery]     = useState('');
  const [filterPriority,  setFilterPriority]  = useState('All');
  const [filterStatus,    setFilterStatus]    = useState('All');

  // Input form
  const [complaintText,   setComplaintText]   = useState('');
  const [channel,         setChannel]         = useState('Email');
  const [isAiLoading,     setIsAiLoading]     = useState(false);
  const [aiError,         setAiError]         = useState('');

  // Drawer actions
  const [updatingStatus,  setUpdatingStatus]  = useState(false);
  const [escalating,      setEscalating]      = useState(false);
  const [followingAi,     setFollowingAi]     = useState(false);
  const [actionMsg,       setActionMsg]       = useState('');

  // ── Data fetching ─────────────────────────────────────────────────────────
  const fetchTickets = useCallback(async (silent = false) => {
    if (!silent) setIsLoading(true);
    else setRefreshing(true);
    try {
      const res  = await fetch(`${BACKEND_URL}/api/complaints/all`);
      const data = await res.json();
      setTickets(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('fetchTickets error:', err);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchTickets(); }, [fetchTickets]);

  // If drawer is open and tickets list updates, keep drawer in sync
  useEffect(() => {
    if (selectedTicket) {
      const fresh = tickets.find(t => t.id === selectedTicket.id);
      if (fresh) setSelectedTicket(fresh);
    }
  }, [tickets]);

  // ── AI Process & Save ─────────────────────────────────────────────────────
  const handleClassifyAI = async () => {
    if (!complaintText.trim()) return;
    setIsAiLoading(true);
    setAiError('');
    try {
      const res  = await fetch(`${BACKEND_URL}/api/customerse/process_complaint`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ text: complaintText, channel }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'AI processing failed');
      setComplaintText('');
      // Refresh list so the saved ticket appears at top
      await fetchTickets(true);
    } catch (err) {
      setAiError(err.message || 'Failed to reach AI backend.');
    } finally {
      setIsAiLoading(false);
    }
  };

  // ── Update Status ─────────────────────────────────────────────────────────
  const handleUpdateStatus = async (newStatus) => {
    if (!selectedTicket || updatingStatus) return;
    setUpdatingStatus(true);
    setActionMsg('');
    try {
      const res  = await fetch(`${BACKEND_URL}/api/complaints/update-status/${selectedTicket.id}`, {
        method:  'PUT',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Update failed');
      setTickets(prev => prev.map(t =>
        t.id === selectedTicket.id ? { ...t, status: data.status, progress: data.progress } : t
      ));
      setActionMsg(`✅ Status updated to "${data.status}"`);
    } catch (err) {
      setActionMsg(`❌ ${err.message}`);
    } finally {
      setUpdatingStatus(false);
    }
  };

  // ── Escalate ─────────────────────────────────────────────────────────────
  const handleEscalate = async () => {
    if (!selectedTicket || escalating) return;
    setEscalating(true);
    setActionMsg('');
    try {
      const res  = await fetch(`${BACKEND_URL}/api/complaints/escalate/${selectedTicket.id}`, {
        method: 'PUT',
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Escalation failed');
      setTickets(prev => prev.map(t =>
        t.id === selectedTicket.id
          ? { ...t, priority: data.priority, status: data.status, progress: data.progress }
          : t
      ));
      setActionMsg('🚨 Complaint escalated to Critical!');
    } catch (err) {
      setActionMsg(`❌ ${err.message}`);
    } finally {
      setEscalating(false);
    }
  };

  // ── Follow AI Suggested Resolution ────────────────────────────────────────
  const handleFollowAi = async () => {
    if (!selectedTicket || followingAi) return;
    setFollowingAi(true);
    setActionMsg('');
    try {
      const res = await fetch(`${BACKEND_URL}/api/complaints/update-status/${selectedTicket.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'In Progress' }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to follow AI');
      setTickets(prev => prev.map(t =>
        t.id === selectedTicket.id ? { ...t, status: data.status || 'In Progress', progress: data.progress || 50 } : t
      ));
      setActionMsg('✅ AI resolution accepted! Ticket moved to "In Progress".');
    } catch (err) {
      setActionMsg(`❌ ${err.message}`);
    } finally {
      setFollowingAi(false);
    }
  };

  // ── Filtered view ─────────────────────────────────────────────────────────
  const filteredTickets = tickets.filter(t => {
    const matchSearch   = !searchQuery || [t.subject, t.category, t.complaint_text].some(
      f => (f || '').toLowerCase().includes(searchQuery.toLowerCase())
    );
    const matchPriority = filterPriority === 'All' || t.priority === filterPriority;
    const matchStatus   = filterStatus   === 'All' || t.status   === filterStatus;
    return matchSearch && matchPriority && matchStatus;
  });

  // ── Stats ──────────────────────────────────────────────────────────────────
  const stats = {
    total:    tickets.length,
    critical: tickets.filter(t => t.priority === 'Critical').length,
    open:     tickets.filter(t => ['Open','In Progress','Under Review'].includes(t.status)).length,
    resolved: tickets.filter(t => ['Resolved','Closed'].includes(t.status)).length,
  };

  // ── Category chart data ───────────────────────────────────────────────────
  const chartData = Object.entries(
    tickets.reduce((acc, t) => {
      const k = t.category || 'Unknown';
      acc[k] = (acc[k] || 0) + 1;
      return acc;
    }, {})
  ).map(([name, count]) => ({ name, count }))
   .sort((a, b) => b.count - a.count);

  // ─────────────────────────────────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="dashboard-grid" style={{ position: 'relative' }}>

      {/* ══════════════════════════════════════════════════════
          STATS ROW
      ══════════════════════════════════════════════════════ */}
      <div className="col-span-12" style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '1.25rem', marginBottom: '1rem' }}>
        {[
          { label: 'Total Complaints', value: stats.total,    icon: <BarChartIcon size={22}/>, accent: 'var(--brand-primary)', bg: 'rgba(37,99,235,0.05)' },
          { label: 'Critical',          value: stats.critical, icon: <AlertTriangle size={22}/>, accent: '#ef4444', bg: 'rgba(239,68,68,0.05)' },
          { label: 'Active',            value: stats.open,     icon: <TrendingUp size={22}/>,   accent: '#fbbf24', bg: 'rgba(251,191,36,0.05)' },
          { label: 'Resolved',          value: stats.resolved, icon: <CheckCircle2 size={22}/>, accent: '#34d399', bg: 'rgba(52,211,153,0.05)' },
        ].map(s => (
          <div key={s.label} className="card" style={{ 
            padding: '1.5rem', 
            background: `linear-gradient(145deg, var(--bg-card) 0%, ${s.bg} 100%)`,
            border: '1px solid var(--border-subtle)',
            borderBottom: `3px solid ${s.accent}`,
            borderRadius: '16px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.04)',
            transition: 'transform 0.2s, box-shadow 0.2s',
            cursor: 'default'
          }}
          onMouseOver={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = `0 10px 25px ${s.bg.replace('0.05', '0.2')}`; }}
          onMouseOut={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.04)'; }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
              <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{s.label}</span>
              <div style={{ background: s.bg.replace('0.05', '0.15'), padding: '8px', borderRadius: '10px', color: s.accent, display: 'flex' }}>
                {s.icon}
              </div>
            </div>
            <div style={{ fontSize: '2.2rem', fontWeight: 800, color: 'var(--text-primary)', fontFamily: 'system-ui, -apple-system, sans-serif' }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* ══════════════════════════════════════════════════════
          AI INPUT PANEL
      ══════════════════════════════════════════════════════ */}
      <div className="col-span-12">
        <div className="card" style={{ 
          background: 'linear-gradient(135deg, rgba(30,30,42,0.9) 0%, rgba(15,15,22,1) 100%)', 
          border: '1px solid rgba(129, 140, 248, 0.3)',
          boxShadow: '0 10px 40px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.05)',
          position: 'relative',
          overflow: 'hidden'
        }}>
          {/* subtle background glow */}
          <div style={{ position: 'absolute', top: '-50px', right: '-50px', width: '200px', height: '200px', background: 'radial-gradient(circle, rgba(129,140,248,0.15) 0%, transparent 70%)', borderRadius: '50%', pointerEvents: 'none' }} />

          <div className="card-header" style={{ borderBottomColor: 'rgba(255,255,255,0.05)' }}>
            <h3 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#fff', fontSize: '1.1rem' }}>
              <div style={{ padding: '6px', background: 'rgba(129,140,248,0.15)', borderRadius: '8px', display: 'flex' }}>
                <Sparkles size={18} color="#818cf8" />
              </div>
              Live AI Complaint Classification
            </h3>
            <button onClick={() => fetchTickets(true)} disabled={refreshing}
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#ccc', borderRadius: '8px', padding: '6px 14px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', transition: 'all 0.2s' }}
              onMouseOver={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; }}
              onMouseOut={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; }}>
              <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} /> Refresh
            </button>
          </div>

          <div style={{ padding: '1.5rem', position: 'relative', zIndex: 1 }}>
            <p style={{ color: '#aaa', marginBottom: '1.25rem', fontSize: '0.95rem' }}>
              Paste a customer complaint from any channel. ResolveX Copilot will instantly classify, prioritize, and ingest it into the platform.
            </p>

            {/* Channel selector */}
            <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1rem' }}>
              {['Email', 'Call', 'Chat'].map(ch => (
                <button key={ch} onClick={() => setChannel(ch)}
                  style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 18px', borderRadius: '20px', fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s',
                    background: channel === ch ? 'linear-gradient(135deg, #4f46e5 0%, #6366f1 100%)' : 'rgba(255,255,255,0.03)',
                    color:      channel === ch ? '#fff' : '#888',
                    border:     channel === ch ? '1px solid #818cf8' : '1px solid rgba(255,255,255,0.1)',
                    boxShadow:  channel === ch ? '0 4px 12px rgba(79, 70, 229, 0.3)' : 'none'
                  }}>
                  <ChannelIcon channel={ch} size={15} /> {ch}
                </button>
              ))}
            </div>

            {/* Textarea + button */}
            <div style={{ display: 'flex', gap: '1.25rem', alignItems: 'flex-start', flexDirection: 'column' }}>
              <textarea
                placeholder={
                  channel === 'Email' ? 'Paste the full email body here…\n\ne.g., "Dear Support, I received my order #4521 and the box was completely crushed…"'
                  : channel === 'Call' ? 'Paste the call transcript or summary here…'
                  : 'Paste the chat message here…'
                }
                value={complaintText}
                onChange={e => setComplaintText(e.target.value)}
                rows={4}
                style={{ width: '100%', padding: '1rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.3)', color: '#fff', resize: 'vertical', fontFamily: 'inherit', fontSize: '0.95rem', lineHeight: '1.6', outline: 'none', transition: 'border-color 0.3s, box-shadow 0.3s' }}
                onFocus={e  => { e.target.style.borderColor = '#818cf8'; e.target.style.boxShadow = '0 0 0 3px rgba(129, 140, 248, 0.15)'; }}
                onBlur={e   => { e.target.style.borderColor = 'rgba(255,255,255,0.1)'; e.target.style.boxShadow = 'none'; }}
              />
              <button onClick={handleClassifyAI} disabled={isAiLoading || !complaintText.trim()}
                style={{ alignSelf: 'flex-end', padding: '0.8rem 1.5rem', borderRadius: '10px', background: 'linear-gradient(135deg, #4f46e5 0%, #6366f1 100%)', color: 'white', border: 'none', fontWeight: 600, fontSize: '0.95rem', cursor: (!complaintText.trim() || isAiLoading) ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: '8px', opacity: (!complaintText.trim() || isAiLoading) ? 0.6 : 1, transition: 'all 0.2s', boxShadow: (!complaintText.trim() || isAiLoading) ? 'none' : '0 6px 15px rgba(79, 70, 229, 0.4)' }}
                onMouseOver={e => { if(!(!complaintText.trim() || isAiLoading)) { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 20px rgba(79, 70, 229, 0.5)'; } }}
                onMouseOut={e => { if(!(!complaintText.trim() || isAiLoading)) { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 6px 15px rgba(79, 70, 229, 0.4)'; } }}>
                {isAiLoading ? <><Loader2 size={18} className="animate-spin" /> Processing AI…</> : <><Sparkles size={18} /> Ingest via ResolveX Copilot</>}
              </button>
            </div>

            {aiError && (
              <div style={{ marginTop: '0.75rem', padding: '0.7rem 1rem', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '8px', color: '#f87171', fontSize: '0.85rem' }}>
                ⚠️ {aiError}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════
          CHART  +  FILTERS
      ══════════════════════════════════════════════════════ */}
      <div className="col-span-4">
        <div className="card" style={{ height: '100%' }}>
          <div className="card-header">
            <h3 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <BarChartIcon size={18} /> Category Trend
            </h3>
            <span style={{ fontSize: '0.7rem', padding: '2px 8px', background: 'rgba(50,200,50,0.15)', color: '#34d399', borderRadius: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span style={{ width: '6px', height: '6px', background: '#34d399', borderRadius: '50%' }} /> LIVE
            </span>
          </div>
          <div style={{ padding: '0 1.5rem 1.5rem', height: '300px' }}>
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 10, right: 0, left: -20, bottom: 40 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                  <XAxis dataKey="name" stroke="var(--text-muted)" fontSize={10} tickLine={false} axisLine={false} angle={-40} textAnchor="end" interval={0} />
                  <YAxis stroke="var(--text-muted)" fontSize={11} tickLine={false} axisLine={false} allowDecimals={false} />
                  <Tooltip contentStyle={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-strong)', borderRadius: '8px' }} itemStyle={{ color: 'var(--brand-primary)', fontWeight: 'bold' }} cursor={{ fill: 'rgba(255,255,255,0.04)' }} />
                  <Bar dataKey="count" radius={[4,4,0,0]} animationDuration={600}>
                    {chartData.map((_, i) => (
                      <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                No data yet
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════
          TICKETS TABLE
      ══════════════════════════════════════════════════════ */}
      <div className="col-span-8">
        <div className="card" style={{ height: '100%' }}>
          <div className="card-header" style={{ flexWrap: 'wrap', gap: '0.75rem' }}>
            <h3 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              All Complaints
              <span style={{ fontSize: '0.75rem', padding: '2px 8px', background: 'rgba(96,165,250,0.1)', color: '#60a5fa', borderRadius: '20px', fontWeight: 600 }}>
                {filteredTickets.length}
              </span>
            </h3>

            {/* Search + filters */}
            <div style={{ display: 'flex', gap: '0.75rem', marginLeft: 'auto', flexWrap: 'wrap' }}>
              <div style={{ position: 'relative' }}>
                <Search size={14} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#888' }} />
                <input placeholder="Search tickets…" value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                  style={{ padding: '8px 12px 8px 34px', border: '1px solid var(--border-subtle)', borderRadius: '10px', background: 'var(--bg-secondary)', color: 'var(--text-primary)', fontSize: '0.85rem', outline: 'none', width: '200px', transition: 'border-color 0.2s, box-shadow 0.2s' }} 
                  onFocus={e => { e.target.style.borderColor = 'var(--brand-primary)'; e.target.style.boxShadow = '0 0 0 3px rgba(37,99,235,0.1)'; }}
                  onBlur={e => { e.target.style.borderColor = 'var(--border-subtle)'; e.target.style.boxShadow = 'none'; }}
                />
              </div>

              {/* Priority filter */}
              <select value={filterPriority} onChange={e => setFilterPriority(e.target.value)}
                style={{ padding: '8px 12px', border: '1px solid var(--border-subtle)', borderRadius: '10px', background: 'var(--bg-secondary)', color: 'var(--text-secondary)', fontSize: '0.85rem', cursor: 'pointer', outline: 'none', transition: 'border-color 0.2s', fontWeight: 500 }}
                onFocus={e => e.target.style.borderColor = 'var(--brand-primary)'} onBlur={e => e.target.style.borderColor = 'var(--border-subtle)'}>
                <option value="All">Priority: All</option>
                {Object.keys(PRIORITY_META).filter(p => p !== 'None').map(p => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>

              {/* Status filter */}
              <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
                style={{ padding: '8px 12px', border: '1px solid var(--border-subtle)', borderRadius: '10px', background: 'var(--bg-secondary)', color: 'var(--text-secondary)', fontSize: '0.85rem', cursor: 'pointer', outline: 'none', transition: 'border-color 0.2s', fontWeight: 500 }}
                onFocus={e => e.target.style.borderColor = 'var(--brand-primary)'} onBlur={e => e.target.style.borderColor = 'var(--border-subtle)'}>
                <option value="All">Status: All</option>
                {VALID_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>

          <div className="table-wrapper" style={{ overflowX: 'auto', padding: '0.5rem' }}>
            <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '0 0.5rem' }}>
              <thead>
                <tr>
                  {['Ticket ID', 'Channel', 'Subject', 'Category (AI)', 'Priority', 'Status', 'Copilot Action'].map(h => (
                    <th key={h} style={{ textAlign: 'left', padding: '0.5rem 1rem', color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', whiteSpace: 'nowrap', borderBottom: '1px solid var(--border-subtle)' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  Array(5).fill(0).map((_, i) => (
                    <tr key={i}>
                      <td colSpan="7" style={{ padding: '0.75rem 1rem' }}>
                        <div className="skeleton" style={{ height: '28px', borderRadius: '6px', background: 'var(--border-subtle)', animation: 'pulse 1.5s ease-in-out infinite' }} />
                      </td>
                    </tr>
                  ))
                ) : filteredTickets.length === 0 ? (
                  <tr>
                    <td colSpan="7" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                      No complaints found.
                    </td>
                  </tr>
                ) : (
                  filteredTickets.map((ticket, i) => (
                    <tr key={ticket.id} onClick={() => { setSelectedTicket(ticket); setActionMsg(''); }}
                      style={{ cursor: 'pointer', background: 'var(--bg-primary)', transition: 'transform 0.2s, box-shadow 0.2s', boxShadow: '0 2px 8px rgba(0,0,0,0.02)', borderRadius: '12px' }}
                      onMouseOver={e  => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 16px rgba(0,0,0,0.06)'; e.currentTarget.style.background = 'var(--bg-secondary)'; }}
                      onMouseOut={e   => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.02)'; e.currentTarget.style.background = 'var(--bg-primary)'; }}>

                      {/* Ticket ID */}
                      <td style={{ padding: '1rem', fontFamily: 'monospace', fontSize: '0.85rem', fontWeight: 700, color: 'var(--brand-primary)', whiteSpace: 'nowrap', borderTopLeftRadius: '12px', borderBottomLeftRadius: '12px', border: '1px solid var(--border-subtle)', borderRight: 'none' }}>
                        #{shortId(ticket.id)}
                      </td>

                      {/* Channel */}
                      <td style={{ padding: '0.85rem 1rem' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                          <ChannelIcon channel={ticket.complaint_source} />
                          {ticket.complaint_source || '—'}
                        </span>
                      </td>

                      {/* Subject */}
                      <td style={{ padding: '0.85rem 1rem', maxWidth: '200px' }}>
                        <div style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {ticket.subject || '—'}
                        </div>
                        {ticket.created_at && (
                          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <Clock size={10} /> {fmtDate(ticket.created_at)}
                          </div>
                        )}
                      </td>

                      {/* Category (AI) */}
                      <td style={{ padding: '0.85rem 1rem' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                          <Sparkles size={12} color="#818cf8" />
                          {ticket.category || '—'}
                        </span>
                      </td>

                      {/* Priority (AI) */}
                      <td style={{ padding: '0.85rem 1rem' }}>
                        <PriorityBadge priority={ticket.priority} />
                      </td>

                      {/* Status */}
                      <td style={{ padding: '0.85rem 1rem' }}>
                        <StatusBadge status={ticket.status} />
                      </td>

                      {/* AI Recommendation */}
                      <td style={{ padding: '1rem', maxWidth: '220px', borderTopRightRadius: '12px', borderBottomRightRadius: '12px', border: '1px solid var(--border-subtle)', borderLeft: 'none' }}>
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', display: 'flex', alignItems: 'flex-start', gap: '6px' }}>
                          <Zap size={14} color="#fbbf24" style={{ flexShrink: 0, marginTop: '2px' }} />
                          {ticket.recommended_action || '—'}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════
          DRAWER OVERLAY + PANEL
      ══════════════════════════════════════════════════════ */}
      {selectedTicket && (
        <>
          {/* Overlay */}
          <div
            onClick={() => { setSelectedTicket(null); setActionMsg(''); }}
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)', zIndex: 9998, animation: 'fadeIn 0.3s ease-out' }}
          />

          {/* Drawer panel */}
          <div style={{
            position: 'fixed', top: 0, right: 0, height: '100vh', width: '500px', maxWidth: '90vw',
            background: 'var(--bg-card)', borderLeft: '1px solid rgba(255,255,255,0.05)',
            boxShadow: '-20px 0 50px rgba(0,0,0,0.5)', zIndex: 9999,
            display: 'flex', flexDirection: 'column', overflowY: 'auto',
            animation: 'slideInRight 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
          }}>
            {/* Drawer header */}
            <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, background: 'rgba(var(--bg-card-rgb), 0.95)', backdropFilter: 'blur(10px)', zIndex: 10 }}>
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '10px', margin: 0, fontSize: '1.1rem', fontWeight: 700 }}>
                <div style={{ padding: '6px', background: 'rgba(99,102,241,0.1)', borderRadius: '8px', display: 'flex' }}>
                  <Sparkles size={18} color="var(--brand-primary)" />
                </div>
                Ticket #{shortId(selectedTicket.id)}
              </h3>
              <button onClick={() => { setSelectedTicket(null); setActionMsg(''); }}
                style={{ background: 'var(--bg-secondary)', border: 'none', cursor: 'pointer', padding: '8px', borderRadius: '50%', color: 'var(--text-secondary)', display: 'flex', transition: 'all 0.2s' }}
                onMouseOver={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.1)'; e.currentTarget.style.color = '#ef4444'; }}
                onMouseOut={e => { e.currentTarget.style.background = 'var(--bg-secondary)'; e.currentTarget.style.color = 'var(--text-secondary)'; }}>
                <X size={18} />
              </button>
            </div>

            {/* Drawer body */}
            <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem', flex: 1 }}>

              {/* Title + badges */}
              <div style={{ background: 'linear-gradient(145deg, var(--bg-secondary) 0%, rgba(30,30,40,0) 100%)', padding: '1.25rem', borderRadius: '12px', border: '1px solid var(--border-subtle)' }}>
                <h4 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1rem', color: 'var(--text-primary)', lineHeight: 1.5 }}>
                  {selectedTicket.subject || '—'}
                </h4>
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  <PriorityBadge priority={selectedTicket.priority} />
                  <StatusBadge   status={selectedTicket.status} />
                  {selectedTicket.complaint_source && (
                    <span style={{ padding: '3px 10px', borderRadius: '20px', fontSize: '0.72rem', fontWeight: 600, background: 'rgba(100,200,100,0.12)', color: '#4ade80', border: '1px solid rgba(74,222,128,0.25)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <ChannelIcon channel={selectedTicket.complaint_source} size={11} />
                      {selectedTicket.complaint_source}
                    </span>
                  )}
                </div>
              </div>

              {/* ── FEATURE 1: Auto Classified Category ── */}
              <Section icon={<Sparkles size={14} color="#818cf8" />} title="Auto Classified Category">
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ fontSize: '1.3rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                    {selectedTicket.category || '—'}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', padding: '3px 8px', background: 'rgba(129,140,248,0.1)', borderRadius: '6px', border: '1px solid rgba(129,140,248,0.2)' }}>
                    AI Confidence: {selectedTicket.ai_confidence != null ? `${selectedTicket.ai_confidence}%` : '—'}
                  </div>
                </div>
              </Section>

              {/* ── FEATURE 2: Assigned Priority ── */}
              <Section icon={<Shield size={14} color={(PRIORITY_META[selectedTicket.priority] || PRIORITY_META.None).color} />} title="Assigned Priority">
                <div style={{ display: 'flex', align: 'center', gap: '10px' }}>
                  <PriorityBadge priority={selectedTicket.priority} />
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', alignSelf: 'center' }}>
                    {selectedTicket.priority === 'Critical' && 'Immediate action required.'}
                    {selectedTicket.priority === 'High'     && 'Address within 4 hours.'}
                    {selectedTicket.priority === 'Medium'   && 'Address within 24 hours.'}
                    {selectedTicket.priority === 'Low'      && 'Address within 3 days.'}
                    {selectedTicket.priority === 'None'     && 'Invalid/spam — no action.'}
                  </span>
                </div>
              </Section>

              {/* ── FEATURE 3: AI Suggested Resolution ── */}
              <Section icon={<Zap size={14} color="#fbbf24" />} title="AI Suggested Resolution">
                <div style={{ padding: '0.85rem 1rem', background: 'rgba(251,191,36,0.05)', border: '1px solid rgba(251,191,36,0.2)', borderRadius: '10px', fontSize: '0.87rem', lineHeight: 1.6, color: 'var(--text-primary)' }}>
                  <strong style={{ color: '#fbbf24' }}>Copilot: </strong>
                  {selectedTicket.recommended_action || 'No recommendation available.'}
                </div>

                {/* Follow AI Resolution Button */}
                {selectedTicket.recommended_action && selectedTicket.status === 'Open' && (
                  <button onClick={handleFollowAi} disabled={followingAi}
                    style={{ width: '100%', marginTop: '0.75rem', padding: '0.75rem', borderRadius: '10px', border: '2px solid rgba(129,140,248,0.5)', background: 'linear-gradient(135deg, rgba(129,140,248,0.08) 0%, rgba(99,102,241,0.12) 100%)', color: '#818cf8', fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', transition: 'all 0.2s' }}
                    onMouseOver={e => { e.currentTarget.style.background = 'linear-gradient(135deg, rgba(129,140,248,0.15) 0%, rgba(99,102,241,0.2) 100%)'; e.currentTarget.style.borderColor = '#818cf8'; }}
                    onMouseOut={e => { e.currentTarget.style.background = 'linear-gradient(135deg, rgba(129,140,248,0.08) 0%, rgba(99,102,241,0.12) 100%)'; e.currentTarget.style.borderColor = 'rgba(129,140,248,0.5)'; }}>
                    {followingAi
                      ? <><Loader2 size={15} className="animate-spin" /> Applying…</>
                      : <><Sparkles size={15} /> Follow AI Resolution</>}
                  </button>
                )}
                {selectedTicket.status !== 'Open' && selectedTicket.status !== 'Escalated' && (
                  <div style={{ marginTop: '0.5rem', fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <CheckCircle2 size={12} /> AI recommendation acknowledged — ticket is {selectedTicket.status}.
                  </div>
                )}
              </Section>

              {/* Original complaint text */}
              {selectedTicket.complaint_text && (
                <Section icon={<Eye size={14} color="var(--text-muted)" />} title="Original Complaint">
                  <div style={{ maxHeight: '130px', overflowY: 'auto', padding: '0.75rem', background: 'rgba(0,0,0,0.2)', borderRadius: '8px', border: '1px solid var(--border-subtle)', fontSize: '0.83rem', lineHeight: 1.6, whiteSpace: 'pre-wrap', color: 'var(--text-secondary)' }}>
                    {selectedTicket.complaint_text}
                  </div>
                </Section>
              )}

              {/* AI Metrics row */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <MetricBox label="Sentiment Score" value={
                  selectedTicket.sentiment_score != null
                    ? selectedTicket.sentiment_score
                    : '—'
                } valueColor={
                  selectedTicket.sentiment_score < -0.3 ? '#f87171'
                  : selectedTicket.sentiment_score > 0.2  ? '#34d399'
                  : '#fbbf24'
                } />
                <MetricBox label="Submitted" value={fmtDate(selectedTicket.created_at)} />
              </div>

              {/* ── FEATURE 4: Update Status ── */}
              <Section icon={<RefreshCw size={14} color="#60a5fa" />} title="Update Status">
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '0.5rem' }}>
                  {VALID_STATUSES.map(s => {
                    const m       = STATUS_META[s] || STATUS_META.Open;
                    const active  = selectedTicket.status === s;
                    return (
                      <button key={s} onClick={() => handleUpdateStatus(s)}
                        disabled={updatingStatus || active}
                        style={{
                          padding: '7px 4px', borderRadius: '8px', fontSize: '0.72rem', fontWeight: 600, cursor: active ? 'default' : 'pointer',
                          border: `1px solid ${active ? m.color : 'var(--border-subtle)'}`,
                          background: active ? m.bg : 'transparent',
                          color: active ? m.color : 'var(--text-muted)',
                          transition: 'all 0.15s', whiteSpace: 'nowrap',
                          opacity: updatingStatus && !active ? 0.5 : 1,
                        }}
                        onMouseOver={e => { if (!active) e.currentTarget.style.background = m.bg; }}
                        onMouseOut={e  => { if (!active) e.currentTarget.style.background = 'transparent'; }}>
                        {updatingStatus && !active ? '…' : s}
                      </button>
                    );
                  })}
                </div>
              </Section>

              {/* ── FEATURE 5: Escalate Critical ── */}
              <Section icon={<AlertTriangle size={14} color="#ef4444" />} title="Escalate Complaint">
                {selectedTicket.status === 'Escalated' && selectedTicket.priority === 'Critical' ? (
                  <div style={{ padding: '0.75rem 1rem', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '8px', fontSize: '0.82rem', color: '#f87171', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <AlertTriangle size={14} /> This complaint is already escalated as Critical.
                  </div>
                ) : (
                  <button onClick={handleEscalate} disabled={escalating}
                    style={{ width: '100%', padding: '0.8rem', borderRadius: '10px', border: '2px solid rgba(239,68,68,0.5)', background: 'rgba(239,68,68,0.07)', color: '#ef4444', fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', transition: 'all 0.2s' }}
                    onMouseOver={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.14)'; e.currentTarget.style.borderColor = '#ef4444'; }}
                    onMouseOut={e  => { e.currentTarget.style.background = 'rgba(239,68,68,0.07)'; e.currentTarget.style.borderColor = 'rgba(239,68,68,0.5)'; }}>
                    {escalating
                      ? <><Loader2 size={15} className="animate-spin" /> Escalating…</>
                      : <><AlertTriangle size={15} /> Escalate to Critical</>}
                  </button>
                )}
              </Section>

              {/* Action feedback message */}
              {actionMsg && (
                <div style={{ padding: '0.7rem 1rem', borderRadius: '8px', fontSize: '0.83rem', fontWeight: 500,
                  background: actionMsg.startsWith('✅') || actionMsg.startsWith('🚨') ? 'rgba(34,197,94,0.08)' : 'rgba(239,68,68,0.08)',
                  color:      actionMsg.startsWith('✅') || actionMsg.startsWith('🚨') ? '#34d399' : '#f87171',
                  border: `1px solid ${actionMsg.startsWith('✅') || actionMsg.startsWith('🚨') ? 'rgba(34,197,94,0.25)' : 'rgba(239,68,68,0.25)'}`,
                }}>
                  {actionMsg}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

// ─── Sub-components ──────────────────────────────────────────────────────────
const Section = ({ icon, title, children }) => (
  <div>
    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '0.6rem' }}>
      {icon}
      <span style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.7px', color: 'var(--text-muted)', fontWeight: 700 }}>{title}</span>
    </div>
    {children}
  </div>
);

const MetricBox = ({ label, value, valueColor }) => (
  <div style={{ padding: '0.75rem', background: 'rgba(0,0,0,0.2)', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
    <div style={{ fontSize: '0.68rem', textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--text-muted)', marginBottom: '4px' }}>{label}</div>
    <div style={{ fontSize: '1rem', fontWeight: 700, color: valueColor || 'var(--text-primary)' }}>{value}</div>
  </div>
);

export default SupportDashboard;