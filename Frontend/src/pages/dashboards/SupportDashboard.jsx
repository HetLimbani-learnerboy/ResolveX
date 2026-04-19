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

const TimeRemaining = ({ deadline }) => {
  const [timeLeft, setTimeLeft] = useState('');

  const calculate = useCallback(() => {
    if (!deadline) return "—";
    const now = new Date();
    const target = new Date(deadline);
    const diff = target - now;
    if (diff <= 0) return "EXPIRED";
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);
    return `${hours}h ${minutes}m ${seconds}s`;
  }, [deadline]);

  useEffect(() => {
    setTimeLeft(calculate());
    const timer = setInterval(() => setTimeLeft(calculate()), 1000);
    return () => clearInterval(timer);
  }, [calculate]);

  if (timeLeft === '—') return <span>—</span>;
  const isExpired = timeLeft === "EXPIRED";
  
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
      <Clock size={12} color={isExpired ? "#ef4444" : "#6366f1"} />
      <span style={{ 
        color: isExpired ? '#ef4444' : 'var(--text-primary)',
        fontWeight: isExpired ? 800 : 700,
        fontFamily: 'SFMono-Regular, Consolas, monospace',
        fontSize: '0.78rem'
      }}>
        {timeLeft}
      </span>
    </div>
  );
};

const DynamicSLAScore = ({ createdAt, deadline, priority, initialScore }) => {
  const [data, setData] = useState({ score: initialScore, status: 'Calculating...' });

  const calculate = useCallback(() => {
    if (!createdAt || !deadline) return { score: initialScore, status: 'No SLA' };
    
    const start = new Date(createdAt);
    const end = new Date(deadline);
    const now = new Date();
    
    const total = end - start;
    const remaining = end - now;
    
    if (remaining <= 0) return { score: 0.00, status: 'Breached' };
    
    let base = (remaining / total) * 100;
    base = Math.min(100, Math.max(0, base));
    
    let weight = 1.0;
    const p = (priority || '').toLowerCase();
    if (p === 'high' || p === 'critical') weight = 1.5;
    else if (p === 'medium') weight = 1.2;
    
    let final = base * weight;
    final = Math.min(100, final);
    
    let stat = "On Track";
    if (final <= 30) stat = "Breached";
    else if (final <= 70) stat = "At Risk";
    
    return { score: final.toFixed(2), status: stat };
  }, [createdAt, deadline, priority, initialScore]);

  useEffect(() => {
    setData(calculate());
    const timer = setInterval(() => {
      setData(calculate());
    }, 1000);
    return () => clearInterval(timer);
  }, [calculate]);

  const color = data.status === 'Breached' ? '#ef4444' : data.status === 'At Risk' ? '#f59e0b' : '#10b981';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
      <span style={{ fontSize: '0.95rem', fontWeight: 800, color: color, fontFamily: 'monospace' }}>{data.score}/100</span>
      <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.3px' }}>{data.status}</span>
    </div>
  );
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
  const [lastBreach,      setLastBreach]      = useState(null); // For escalation alerts

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
      const freshTickets = Array.isArray(data) ? data : [];
      
      // Check for newly escalated tickets (Breach Alert)
      if (tickets.length > 0) {
        const newlyEscalated = freshTickets.find(newT => {
          const oldT = tickets.find(t => t.id === newT.id);
          return oldT && oldT.status !== 'Escalated' && newT.status === 'Escalated';
        });
        if (newlyEscalated) {
             setLastBreach(newlyEscalated);
             // Auto-clear after 10 seconds
             setTimeout(() => setLastBreach(null), 10000);
        }
      }

      setTickets(freshTickets);
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
    const res = await fetch(`${BACKEND_URL}/api/customerse/process_complaint`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        text: complaintText, 
        channel: channel 
      }),
    });
    
    const data = await res.json();
    
    if (!res.ok) throw new Error(data.error || 'AI processing failed');

    // Success logic
    setComplaintText('');
    
    // Show a small success toast/feedback
    setActionMsg(`✅ Ticket #${data.ticket_id.substring(0,8)} ingested and classified as ${data.data.category}`);
    
    // Refresh the list to show the new ticket with AI suggestions at the top
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
      
      {/* 🚨 ESCALATION ALERT OVERLAY 🚨 */}
      {lastBreach && (
        <div style={{
          position: 'fixed', top: '24px', left: '50%', transform: 'translateX(-50%)',
          zIndex: 10000, width: '450px', maxWidth: '90vw',
          background: 'rgba(239, 68, 68, 0.95)', backdropFilter: 'blur(10px)',
          border: '2px solid rgba(255,255,255,0.2)', borderRadius: '16px',
          boxShadow: '0 20px 50px rgba(239,68,68,0.4)', color: 'white',
          padding: '1.25rem', display: 'flex', alignItems: 'center', gap: '16px',
          animation: 'slideInDown 0.5s cubic-bezier(0.16, 1, 0.3, 1)'
        }}>
          <div style={{
            background: 'white', color: '#ef4444', borderRadius: '50%',
            padding: '10px', display: 'flex', animation: 'pulse 1s infinite'
          }}>
            <AlertTriangle size={24} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 800, fontSize: '1.1rem', letterSpacing: '0.5px' }}>SLA BREACH DETECTED</div>
            <div style={{ fontSize: '0.85rem', opacity: 0.9, marginTop: '2px' }}>
              Ticket <strong>#{lastBreach.id.substring(0,8)}</strong> has been auto-escalated to Critical.
            </div>
          </div>
          <button onClick={() => setLastBreach(null)} style={{ background: 'transparent', border: 'none', color: 'white', cursor: 'pointer', opacity: 0.7 }}>
            <X size={20} />
          </button>
        </div>
      )}

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
          background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)', 
          border: '1px solid rgba(99, 102, 241, 0.2)',
          boxShadow: '0 10px 40px rgba(99, 102, 241, 0.08), inset 0 1px 0 rgba(255,255,255,0.8)',
          position: 'relative',
          overflow: 'hidden',
          borderRadius: '20px'
        }}>
          {/* subtle animated background glow */}
          <div style={{ position: 'absolute', top: '-100px', right: '-50px', width: '300px', height: '300px', background: 'radial-gradient(circle, rgba(99,102,241,0.08) 0%, transparent 70%)', borderRadius: '50%', pointerEvents: 'none' }} />
          <div style={{ position: 'absolute', bottom: '-50px', left: '-50px', width: '200px', height: '200px', background: 'radial-gradient(circle, rgba(56,189,248,0.06) 0%, transparent 70%)', borderRadius: '50%', pointerEvents: 'none' }} />

          <div className="card-header" style={{ borderBottomColor: 'rgba(0,0,0,0.04)', padding: '1.25rem 1.5rem', background: 'rgba(255,255,255,0.5)', backdropFilter: 'blur(10px)', zIndex: 2, position: 'relative' }}>
            <h3 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--text-primary)', fontSize: '1.15rem', fontWeight: 800 }}>
              <div style={{ padding: '8px', background: 'linear-gradient(135deg, rgba(99,102,241,0.15) 0%, rgba(99,102,241,0.05) 100%)', borderRadius: '10px', display: 'flex', border: '1px solid rgba(99,102,241,0.1)' }}>
                <Sparkles size={20} color="var(--brand-primary)" />
              </div>
              Live AI Complaint Classification
            </h3>
            <button onClick={() => fetchTickets(true)} disabled={refreshing}
              style={{ background: 'white', border: '1px solid var(--border-subtle)', color: 'var(--text-secondary)', borderRadius: '10px', padding: '8px 16px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', fontWeight: 600, transition: 'all 0.2s', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}
              onMouseOver={e => { e.currentTarget.style.background = '#f8fafc'; e.currentTarget.style.borderColor = 'var(--brand-primary)'; e.currentTarget.style.color = 'var(--brand-primary)'; }}
              onMouseOut={e => { e.currentTarget.style.background = 'white'; e.currentTarget.style.borderColor = 'var(--border-subtle)'; e.currentTarget.style.color = 'var(--text-secondary)'; }}>
              <RefreshCw size={15} className={refreshing ? 'animate-spin' : ''} /> Refresh
            </button>
          </div>

          <div style={{ padding: '1.5rem 1.75rem.75rem', position: 'relative', zIndex: 1 }}>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem', fontSize: '0.95rem', lineHeight: '1.6', maxWidth: '800px' }}>
              Paste a customer complaint from any channel. <strong style={{ color: 'var(--brand-primary)' }}>ResolveX Copilot</strong> will instantly classify, prioritize, and ingest it into the platform.
            </p>

            {/* Channel selector */}
            <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.25rem' }}>
              {['Email', 'Call', 'Chat'].map(ch => (
                <button key={ch} onClick={() => setChannel(ch)}
                  style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 20px', borderRadius: '30px', fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer', transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                    background: channel === ch ? 'linear-gradient(135deg, var(--brand-primary) 0%, rgba(99,102,241,0.9) 100%)' : 'white',
                    color:      channel === ch ? 'white' : 'var(--text-secondary)',
                    border:     channel === ch ? '1px solid transparent' : '1px solid var(--border-subtle)',
                    boxShadow:  channel === ch ? '0 4px 15px rgba(99,102,241,0.3)' : '0 1px 3px rgba(0,0,0,0.02)'
                  }}>
                  <ChannelIcon channel={ch} size={16} /> {ch}
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
                style={{ width: '100%', padding: '1.25rem', borderRadius: '14px', border: '2px solid var(--border-subtle)', background: 'rgba(255,255,255,0.8)', color: 'var(--text-primary)', resize: 'vertical', fontFamily: 'inherit', fontSize: '1rem', lineHeight: '1.6', outline: 'none', transition: 'all 0.3s', boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.02)' }}
                onFocus={e  => { e.target.style.borderColor = 'var(--brand-primary)'; e.target.style.boxShadow = '0 0 0 4px rgba(99,102,241,0.1), inset 0 2px 4px rgba(0,0,0,0.01)'; e.target.style.background = 'white'; }}
                onBlur={e   => { e.target.style.borderColor = 'var(--border-subtle)'; e.target.style.boxShadow = 'inset 0 2px 4px rgba(0,0,0,0.02)'; e.target.style.background = 'rgba(255,255,255,0.8)'; }}
              />
              <button onClick={handleClassifyAI} disabled={isAiLoading || !complaintText.trim()}
                style={{ alignSelf: 'flex-end', padding: '0.9rem 1.75rem', borderRadius: '12px', background: 'linear-gradient(135deg, var(--brand-primary) 0%, rgba(99,102,241,0.9) 100%)', color: 'white', border: 'none', fontWeight: 700, fontSize: '0.95rem', cursor: (!complaintText.trim() || isAiLoading) ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: '8px', opacity: (!complaintText.trim() || isAiLoading) ? 0.6 : 1, transition: 'all 0.25s', boxShadow: (!complaintText.trim() || isAiLoading) ? 'none' : '0 8px 20px rgba(99,102,241,0.35)' }}
                onMouseOver={e => { if(!(!complaintText.trim() || isAiLoading)) { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 12px 25px rgba(99,102,241,0.45)'; } }}
                onMouseOut={e => { if(!(!complaintText.trim() || isAiLoading)) { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 8px 20px rgba(99,102,241,0.35)'; } }}>
                {isAiLoading ? <><Loader2 size={18} className="animate-spin" /> Processing AI…</> : <><Sparkles size={18} /> Ingest via ResolveX Copilot</>}
              </button>
            </div>

            {aiError && (
              <div style={{ marginTop: '1rem', padding: '1rem 1.25rem', background: 'rgba(239,68,68,0.05)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '10px', color: '#ef4444', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <AlertTriangle size={18} /> {aiError}
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

              <button onClick={() => fetchTickets(true)} disabled={refreshing}
                style={{ background: 'var(--brand-primary)', border: 'none', color: 'white', borderRadius: '10px', padding: '8px 14px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', fontWeight: 600, transition: 'all 0.2s', boxShadow: '0 4px 12px rgba(37,99,235,0.2)' }}
                onMouseOver={e => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 6px 15px rgba(37,99,235,0.3)'; }}
                onMouseOut={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(37,99,235,0.2)'; }}>
                <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} /> Refresh SLA
              </button>

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
                  {['Ticket ID', 'Channel', 'Subject', 'Category', 'Priority', 'Status', 'SLA Score', 'Time Left', 'Actions'].map(h => (
                    <th key={h} style={{ textAlign: 'left', padding: '0.5rem 1rem', color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', whiteSpace: 'nowrap', borderBottom: '1px solid var(--border-subtle)' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  Array(5).fill(0).map((_, i) => (
                    <tr key={i}>
                      <td colSpan="8" style={{ padding: '0.75rem 1rem' }}>
                        <div className="skeleton" style={{ height: '28px', borderRadius: '6px', background: 'var(--border-subtle)', animation: 'pulse 1.5s ease-in-out infinite' }} />
                      </td>
                    </tr>
                  ))
                ) : filteredTickets.length === 0 ? (
                  <tr>
                    <td colSpan="8" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
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

                      {/* SLA Score (Real-time) */}
                      <td style={{ padding: '0.85rem 1rem' }}>
                        <DynamicSLAScore 
                          createdAt={ticket.created_at} 
                          deadline={ticket.sla_deadline} 
                          priority={ticket.priority} 
                          initialScore={ticket.sla_score} 
                        />
                      </td>

                      {/* Time Left (Real-time) */}
                      <td style={{ padding: '0.85rem 1rem' }}>
                        <TimeRemaining deadline={ticket.sla_deadline} />
                      </td>

                      {/* AI Recommendation */}
                      <td style={{ padding: '1rem', maxWidth: '180px', borderTopRightRadius: '12px', borderBottomRightRadius: '12px', border: '1px solid var(--border-subtle)', borderLeft: 'none' }}>
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

          {/* Centered Modal Dashboard */}
          <div style={{
            position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
            width: '950px', maxWidth: '95vw', maxHeight: '90vh',
            background: 'rgba(255, 255, 255, 0.98)', backdropFilter: 'blur(30px)', 
            border: '1px solid rgba(255,255,255,1)',
            boxShadow: '0 40px 100px rgba(0,0,0,0.15), 0 0 0 1px rgba(99,102,241,0.08)', zIndex: 9999,
            display: 'flex', flexDirection: 'column', overflowY: 'hidden',
            animation: 'fadeIn 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
            borderRadius: '24px'
          }}>
            {/* Modal header (Subject + Badges) */}
            <div style={{ padding: '2rem 2.5rem', position: 'relative', overflow: 'hidden', borderBottom: '1px solid rgba(0,0,0,0.04)' }}>
               {/* Ambient Glows */}
               <div style={{ position: 'absolute', top: '-50px', left: '-50px', width: '300px', height: '300px', background: 'radial-gradient(circle, rgba(99,102,241,0.08) 0%, transparent 70%)', borderRadius: '50%', pointerEvents: 'none' }} />
               <div style={{ position: 'absolute', bottom: '-50px', right: '-50px', width: '200px', height: '200px', background: 'radial-gradient(circle, rgba(168,85,247,0.06) 0%, transparent 70%)', borderRadius: '50%', pointerEvents: 'none' }} />
               
               {/* Top Bar: Ticket ID + Close */}
               <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'relative', zIndex: 1, marginBottom: '1.25rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ padding: '6px', background: 'linear-gradient(135deg, rgba(99,102,241,0.15) 0%, rgba(99,102,241,0.05) 100%)', borderRadius: '8px', border: '1px solid rgba(99,102,241,0.1)' }}>
                      <Sparkles size={16} color="var(--brand-primary)" />
                    </div>
                    <span style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-secondary)', letterSpacing: '0.5px' }}>TICKET #{shortId(selectedTicket.id)}</span>
                  </div>
                  <button onClick={() => { setSelectedTicket(null); setActionMsg(''); }}
                    style={{ background: 'white', border: '1px solid var(--border-subtle)', cursor: 'pointer', padding: '8px', borderRadius: '50%', color: 'var(--text-secondary)', display: 'flex', transition: 'all 0.2s', boxShadow: '0 2px 5px rgba(0,0,0,0.02)' }}
                    onMouseOver={e => { e.currentTarget.style.borderColor = '#ef4444'; e.currentTarget.style.color = '#ef4444'; e.currentTarget.style.transform = 'rotate(90deg)' }}
                    onMouseOut={e => { e.currentTarget.style.borderColor = 'var(--border-subtle)'; e.currentTarget.style.color = 'var(--text-secondary)'; e.currentTarget.style.transform = 'rotate(0)' }}>
                    <X size={16} />
                  </button>
               </div>

               {/* Subject Line & Badges Side-By-Side */}
               <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', position: 'relative', zIndex: 1, gap: '2rem' }}>
                 <h2 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-primary)', margin: '0', lineHeight: 1.2, letterSpacing: '-0.5px', flex: 1 }}>
                   {selectedTicket.subject || 'No Subject Provided'}
                 </h2>

                 <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', justifyContent: 'flex-end', flexShrink: 0 }}>
                    <PriorityBadge priority={selectedTicket.priority} />
                    <StatusBadge   status={selectedTicket.status} />
                    {selectedTicket.sla_score != null && (
                      <span style={{ padding: '4px 12px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 600, border: `1px solid ${selectedTicket.sla_status === 'Breached' ? 'rgba(239,68,68,0.3)' : selectedTicket.sla_status === 'At Risk' ? 'rgba(245,158,11,0.3)' : 'rgba(16,185,129,0.3)'}`, display: 'flex', alignItems: 'center', gap: '4px', background: selectedTicket.sla_status === 'Breached' ? 'rgba(239,68,68,0.1)' : selectedTicket.sla_status === 'At Risk' ? 'rgba(245,158,11,0.1)' : 'rgba(16,185,129,0.1)', color: selectedTicket.sla_status === 'Breached' ? '#ef4444' : selectedTicket.sla_status === 'At Risk' ? '#f59e0b' : '#10b981' }}>
                        SLA: {selectedTicket.sla_score}/100
                      </span>
                    )}
                    {selectedTicket.complaint_source && (
                      <span style={{ padding: '4px 12px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 600, background: 'linear-gradient(135deg, rgba(16,185,129,0.1) 0%, rgba(52,211,153,0.1) 100%)', color: '#059669', border: '1px solid rgba(16,185,129,0.2)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <ChannelIcon channel={selectedTicket.complaint_source} size={12} />
                        {selectedTicket.complaint_source}
                      </span>
                    )}
                 </div>
               </div>
            </div>

            {/* Modal Body - 2 Columns */}
            <div style={{ padding: '2rem 2.5rem', display: 'grid', gridTemplateColumns: 'minmax(0, 1.2fr) minmax(0, 1fr)', gap: '2.5rem', flex: 1, overflowY: 'auto', background: 'linear-gradient(to bottom, rgba(248,250,252,0) 0%, rgba(248,250,252,0.8) 100%)' }}>
               
               {/* ── LEFT COLUMN: Context & Controls ── */}
               <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                  {/* ORIGINAL COMPLAINT */}
                  {selectedTicket.complaint_text && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Eye size={14} color="var(--text-muted)" />
                        <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.7px', color: 'var(--text-muted)', fontWeight: 700 }}>Original Customer Payload</span>
                      </div>
                      <div style={{ padding: '1.5rem', background: 'white', borderRadius: '16px', border: '1px solid var(--border-subtle)', boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.02)', fontSize: '0.95rem', lineHeight: 1.6, whiteSpace: 'pre-wrap', color: 'var(--text-secondary)', fontFamily: 'system-ui, sans-serif' }}>
                        {selectedTicket.complaint_text}
                      </div>
                    </div>
                  )}

                  {/* OPERATIONAL CONTROLS */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <RefreshCw size={14} color="var(--text-muted)" />
                      <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.7px', color: 'var(--text-muted)', fontWeight: 700 }}>Manual Status Override</span>
                    </div>
                    {/* Fixed Overflow: Used Flex Wrap instead of hard Grid */}
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', background: 'white', padding: '0.75rem', borderRadius: '16px', border: '1px solid var(--border-subtle)', boxShadow: '0 2px 10px rgba(0,0,0,0.02)' }}>
                      {VALID_STATUSES.map(s => {
                        const m       = STATUS_META[s] || STATUS_META.Open;
                        const active  = selectedTicket.status === s;
                        return (
                          <button key={s} onClick={() => handleUpdateStatus(s)}
                            disabled={updatingStatus || active}
                            style={{
                              flex: '1 1 auto', padding: '10px 14px', borderRadius: '10px', fontSize: '0.75rem', fontWeight: 600, cursor: active ? 'default' : 'pointer',
                              background: active ? m.bg : 'var(--bg-secondary)',
                              color: active ? m.color : 'var(--text-muted)',
                              border: `1px solid ${active ? m.color + '40' : 'transparent'}`,
                              transition: 'all 0.2s', whiteSpace: 'nowrap',
                              opacity: updatingStatus && !active ? 0.5 : 1,
                              boxShadow: active ? `0 2px 8px ${m.color}30` : 'none'
                            }}
                            onMouseOver={e => { if (!active) { e.currentTarget.style.background = '#f1f5f9'; e.currentTarget.style.color = 'var(--text-primary)'; } }}
                            onMouseOut={e  => { if (!active) { e.currentTarget.style.background = 'var(--bg-secondary)'; e.currentTarget.style.color = 'var(--text-muted)'; } }}>
                            {updatingStatus && !active ? '…' : s}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                  
                  {/* Action feedback message */}
                  {actionMsg && (
                    <div style={{ padding: '1rem 1.25rem', borderRadius: '12px', fontSize: '0.85rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px',
                      background: actionMsg.startsWith('✅') || actionMsg.startsWith('🚨') ? 'rgba(34,197,94,0.08)' : 'rgba(239,68,68,0.08)',
                      color:      actionMsg.startsWith('✅') || actionMsg.startsWith('🚨') ? '#059669' : '#e11d48',
                      border: `1px solid ${actionMsg.startsWith('✅') || actionMsg.startsWith('🚨') ? 'rgba(34,197,94,0.3)' : 'rgba(239,68,68,0.3)'}`,
                      boxShadow: `0 4px 15px ${actionMsg.startsWith('✅') || actionMsg.startsWith('🚨') ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)'}`
                    }}>
                      {actionMsg}
                    </div>
                  )}
               </div>

               {/* ── RIGHT COLUMN: AI Intelligence ── */}
               <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                  {/* INTELLIGENCE HUB */}
                  <div style={{ background: 'white', borderRadius: '20px', border: '1px solid var(--border-subtle)', boxShadow: '0 10px 30px rgba(0,0,0,0.04)', padding: '1.75rem', position: 'relative', overflow: 'hidden' }}>
                    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '4px', background: 'linear-gradient(90deg, var(--brand-primary) 0%, #a855f7 100%)' }} />
                    
                    {/* Hub Header */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1.5rem' }}>
                      <Sparkles size={18} color="#8b5cf6" />
                      <span style={{ fontSize: '0.8rem', fontWeight: 800, color: '#8b5cf6', textTransform: 'uppercase', letterSpacing: '1px' }}>ResolveX Copilot Insight</span>
                    </div>

                    {/* AI Meta (Category + Priority) */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', marginBottom: '1.5rem', paddingBottom: '1.5rem', borderBottom: '1px dashed var(--border-subtle)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 700 }}>Classified Category</div>
                        <div style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '10px' }}>
                          {selectedTicket.category || '—'}
                          <span style={{ fontSize: '0.7rem', padding: '3px 8px', background: 'rgba(139,92,246,0.1)', color: '#8b5cf6', borderRadius: '10px' }}>
                            {selectedTicket.ai_confidence != null ? `${selectedTicket.ai_confidence}% Match` : ''}
                          </span>
                        </div>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 700 }}>Assigned Protocol</div>
                        <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                          {selectedTicket.priority === 'Critical' && <span style={{color:'#ef4444', fontWeight:800}}>Immediate.</span>}
                          {selectedTicket.priority === 'High'     && 'Address < 4 hours.'}
                          {selectedTicket.priority === 'Medium'   && 'Address < 24 hours.'}
                          {selectedTicket.priority === 'Low'      && 'Standard Queue.'}
                          {selectedTicket.priority === 'None'     && 'No action needed.'}
                        </div>
                      </div>
                    </div>

                    {/* AI Recommendation Box */}
                    {selectedTicket.recommended_action ? (
                      <div style={{ padding: '1.25rem', background: 'linear-gradient(135deg, rgba(245,158,11,0.06) 0%, rgba(245,158,11,0.01) 100%)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: '14px', marginBottom: '1.5rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                          <Zap size={14} color="#d97706" />
                          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#d97706', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Suggested Action</span>
                        </div>
                        <div style={{ fontSize: '0.95rem', lineHeight: 1.6, color: 'var(--text-primary)', fontWeight: 500 }}>
                          {selectedTicket.recommended_action}
                        </div>
                      </div>
                    ) : (
                      <div style={{ padding: '1.25rem', background: 'var(--bg-secondary)', border: '1px dashed var(--border-subtle)', borderRadius: '14px', marginBottom: '1.5rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                        No automated recommendation available. Manual review required.
                      </div>
                    )}

                    {/* Follow AI Resolution Button */}
                    {selectedTicket.recommended_action && selectedTicket.status === 'Open' && (
                      <button onClick={handleFollowAi} disabled={followingAi}
                        style={{ width: '100%', padding: '1rem', borderRadius: '12px', border: 'none', background: 'linear-gradient(135deg, var(--brand-primary) 0%, #a855f7 100%)', color: 'white', fontWeight: 700, fontSize: '0.95rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)', boxShadow: '0 8px 25px rgba(99,102,241,0.3)' }}
                        onMouseOver={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 12px 30px rgba(99,102,241,0.4)'; }}
                        onMouseOut={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 8px 25px rgba(99,102,241,0.3)'; }}>
                        {followingAi
                          ? <><Loader2 size={18} className="animate-spin" /> Applying Intelligence…</>
                          : <><Sparkles size={18} /> Execute AI Resolution</>}
                      </button>
                    )}
                    {selectedTicket.status !== 'Open' && selectedTicket.status !== 'Escalated' && (
                      <div style={{ padding: '0.85rem', borderRadius: '12px', background: 'rgba(16,185,129,0.05)', border: '1px solid rgba(16,185,129,0.2)', fontSize: '0.85rem', color: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontWeight: 600 }}>
                        <CheckCircle2 size={16} /> Resolution applied properly.
                      </div>
                    )}
                  </div>

                  {/* ESCALATION BLOCK */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                     {selectedTicket.status === 'Escalated' && selectedTicket.priority === 'Critical' ? (
                       <div style={{ height: '52px', padding: '0 1rem', background: 'rgba(239,68,68,0.05)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '14px', fontSize: '0.85rem', color: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontWeight: 600 }}>
                         <AlertTriangle size={16} /> Complaint is flagged Critical
                       </div>
                     ) : (
                       <button onClick={handleEscalate} disabled={escalating}
                         style={{ height: '52px', padding: '0 1.25rem', borderRadius: '14px', border: '1px solid rgba(239,68,68,0.3)', background: 'rgba(239,68,68,0.02)', color: '#ef4444', fontWeight: 700, fontSize: '0.9rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', transition: 'all 0.2s', boxShadow: '0 4px 10px rgba(239,68,68,0.05)' }}
                         onMouseOver={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.08)'; e.currentTarget.style.borderColor = '#ef4444'; e.currentTarget.style.transform = 'translateY(-2px)' }}
                         onMouseOut={e  => { e.currentTarget.style.background = 'rgba(239,68,68,0.02)'; e.currentTarget.style.borderColor = 'rgba(239,68,68,0.3)'; e.currentTarget.style.transform = 'translateY(0)' }}>
                         {escalating
                           ? <><Loader2 size={16} className="animate-spin" /></>
                           : <><AlertTriangle size={16} /> Escalate to Critical Level</>}
                       </button>
                     )}
                  </div>
               </div>
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
  <div style={{ padding: '1rem', background: 'var(--bg-secondary)', borderRadius: '12px', border: '1px solid var(--border-subtle)' }}>
    <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--text-muted)', marginBottom: '6px', fontWeight: 600 }}>{label}</div>
    <div style={{ fontSize: '1.2rem', fontWeight: 800, color: valueColor || 'var(--text-primary)' }}>{value}</div>
  </div>
);

export default SupportDashboard;