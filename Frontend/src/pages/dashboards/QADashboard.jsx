import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { Target, Zap, AlertTriangle } from 'lucide-react';

const QADashboard = () => {
  const trendData = [
    { name: 'Mon', bugs: 12, billing: 5 },
    { name: 'Tue', bugs: 19, billing: 6 },
    { name: 'Wed', bugs: 15, billing: 8 },
    { name: 'Thu', bugs: 10, billing: 4 },
    { name: 'Fri', bugs: 8, billing: 3 },
    { name: 'Sat', bugs: 5, billing: 2 },
    { name: 'Sun', bugs: 6, billing: 2 },
  ];

  return (
    <div className="dashboard-grid">
      <div className="col-span-12">
        <h2 style={{ marginBottom: '1rem', fontWeight: '500' }}>Quality Assurance & Insights</h2>
      </div>

      <div className="col-span-4">
        <div className="card">
          <div className="card-header border-none">
            <h3 className="card-title"><Target size={18} /> Resolution Accuracy</h3>
          </div>
          <div className="stat-value text-gradient">94.2%</div>
          <div className="stat-label" style={{ color: 'var(--status-low-text)' }}>+2.4% vs last week</div>
        </div>
      </div>
      <div className="col-span-4">
        <div className="card">
          <div className="card-header border-none">
            <h3 className="card-title"><Zap size={18} /> AI Categorization</h3>
          </div>
          <div className="stat-value">98.5%</div>
          <div className="stat-label">Successful auto-routes</div>
        </div>
      </div>
      <div className="col-span-4">
        <div className="card">
          <div className="card-header border-none">
            <h3 className="card-title"><AlertTriangle size={18} /> Recurring Issues</h3>
          </div>
          <div className="stat-value">12</div>
          <div className="stat-label" style={{ color: 'var(--status-high-text)' }}>Flagged this week</div>
        </div>
      </div>

      <div className="col-span-8">
        <div className="card" style={{ height: '400px' }}>
          <div className="card-header">
            <h3 className="card-title">Issue Trends (Weekly)</h3>
          </div>
          <div style={{ height: '300px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData}>
                <defs>
                  <linearGradient id="colorBugs" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--brand-accent)" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="var(--brand-accent)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" vertical={false} />
                <XAxis dataKey="name" stroke="var(--text-muted)" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="var(--text-muted)" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)' }}
                  itemStyle={{ fontSize: '14px' }}
                />
                <Area type="monotone" dataKey="bugs" stroke="var(--brand-accent)" fillOpacity={1} fill="url(#colorBugs)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="col-span-4">
        <div className="card" style={{ height: '400px' }}>
          <div className="card-header">
            <h3 className="card-title">Root Cause Summary</h3>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem' }}>
            {[
              { issue: 'Payment Gateway Timeout', count: 42, severity: 'High' },
              { issue: 'Reset Password Email Delay', count: 28, severity: 'Medium' },
              { issue: 'Dashboard Loading Slow', count: 15, severity: 'Medium' }
            ].map((item, idx) => (
              <div key={idx} style={{ padding: '0.75rem', backgroundColor: 'var(--bg-primary)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                  <span style={{ fontSize: '0.875rem', fontWeight: '500' }}>{item.issue}</span>
                  <span className={`badge ${item.severity.toLowerCase()}`}>{item.severity}</span>
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{item.count} occurrences</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default QADashboard;
