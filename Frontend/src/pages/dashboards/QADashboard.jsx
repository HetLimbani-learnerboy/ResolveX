import React from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';

import {
  Target,
  Zap,
  AlertTriangle
} from 'lucide-react';

const QADashboard = () => {
  const [trendData, setTrendData] = React.useState([
    { name: 'Mon', bugs: 12, billing: 5 },
    { name: 'Tue', bugs: 19, billing: 6 },
    { name: 'Wed', bugs: 15, billing: 8 },
    { name: 'Thu', bugs: 10, billing: 4 },
    { name: 'Fri', bugs: 8, billing: 3 },
    { name: 'Sat', bugs: 5, billing: 2 },
    { name: 'Sun', bugs: 6, billing: 2 }
  ]);
  const [stats, setStats] = React.useState(null);
  const [recurrenceData, setRecurrenceData] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://127.0.0.1:5000';

  React.useEffect(() => {
    Promise.all([
      fetch(`${BACKEND_URL}/api/admin/stats`).then(res => res.json()),
      fetch(`${BACKEND_URL}/api/admin/recurring-issues`).then(res => res.json())
    ])
      .then(([statsInfo, recurringInfo]) => {
        setStats(statsInfo);
        setRecurrenceData(recurringInfo);
        setLoading(false);
      })
      .catch(err => {
        console.error("QA Dashboard Fetch Error:", err);
        setLoading(false);
      });
  }, []);

  const issues = recurrenceData?.clusters?.slice(0, 3).map(cluster => ({
    issue: cluster.topic,
    count: cluster.count,
    severity: cluster.count > 5 ? 'High' : 'Medium'
  })) || [];

  return (
    <div className="dashboard-grid">

      {/* Header */}
      <div className="col-span-12">
        <h2
          style={{
            marginBottom: '1rem',
            fontWeight: '600'
          }}
        >
          Quality Assurance & Insights
        </h2>
      </div>

      {/* Card 1 */}
      <div className="col-span-4">
        <div className="card">
          <div className="card-header border-none">
            <h3 className="card-title">
              <Target size={18} />
              Resolution Accuracy
            </h3>
          </div>

          <div className="stat-value text-gradient">
            94.2%
          </div>

          <div className="stat-label">
            +2.4% vs last week
          </div>
        </div>
      </div>

      {/* Card 2 */}
      <div className="col-span-4">
        <div className="card">
          <div className="card-header border-none">
            <h3 className="card-title">
              <Zap size={18} />
              AI Categorization
            </h3>
          </div>

          <div className="stat-value">
            98.5%
          </div>

          <div className="stat-label">
            Successful auto-routes
          </div>
        </div>
      </div>

      {/* Card 3 */}
      <div className="col-span-4">
        <div className="card">
          <div className="card-header border-none">
            <h3 className="card-title">
              <AlertTriangle size={18} />
              Recurring Issues
            </h3>
          </div>

          <div className="stat-value">
            {recurrenceData?.similar_complaints || 0}
          </div>

          <div className="stat-label">
            {stats?.recurrence_score || 0}% Score
          </div>
        </div>
      </div>

      {/* Graph */}
      <div className="col-span-8">
        <div
          className="card"
          style={{ height: '420px' }}
        >
          <div className="card-header">
            <h3 className="card-title">
              Issue Trends (Weekly)
            </h3>
          </div>

          <div style={{ height: '320px' }}>
            <ResponsiveContainer
              width="100%"
              height="100%"
            >
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
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Right Side Issues */}
      <div className="col-span-4">
        <div
          className="card"
          style={{ height: '420px' }}
        >
          <div className="card-header">
            <h3 className="card-title">
              Root Cause Summary
            </h3>
          </div>

          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '1rem',
              marginTop: '1rem'
            }}
          >
            {issues.map((item, index) => (
              <div
                key={index}
                style={{
                  padding: '0.75rem',
                  borderRadius: '12px',
                  border:
                    '1px solid #e5e7eb'
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    justifyContent:
                      'space-between',
                    marginBottom:
                      '0.35rem'
                  }}
                >
                  <span
                    style={{
                      fontSize:
                        '0.9rem',
                      fontWeight:
                        '600'
                    }}
                  >
                    {item.issue}
                  </span>

                  <span>
                    {item.severity}
                  </span>
                </div>

                <div
                  style={{
                    fontSize:
                      '0.8rem',
                    color: '#6b7280'
                  }}
                >
                  {item.count}{' '}
                  occurrences
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

    </div>
  );
};

export default QADashboard;