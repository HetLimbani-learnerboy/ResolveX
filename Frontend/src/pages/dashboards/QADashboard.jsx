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
  const trendData = [
    { name: 'Mon', bugs: 12, billing: 5 },
    { name: 'Tue', bugs: 19, billing: 6 },
    { name: 'Wed', bugs: 15, billing: 8 },
    { name: 'Thu', bugs: 10, billing: 4 },
    { name: 'Fri', bugs: 8, billing: 3 },
    { name: 'Sat', bugs: 5, billing: 2 },
    { name: 'Sun', bugs: 6, billing: 2 }
  ];

  const issues = [
    {
      issue: 'Payment Gateway Timeout',
      count: 42,
      severity: 'High'
    },
    {
      issue: 'Reset Password Email Delay',
      count: 28,
      severity: 'Medium'
    },
    {
      issue: 'Dashboard Loading Slow',
      count: 15,
      severity: 'Medium'
    }
  ];

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
            12
          </div>

          <div className="stat-label">
            Flagged this week
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
                  <linearGradient
                    id="colorBugs"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop
                      offset="5%"
                      stopColor="#6366f1"
                      stopOpacity={0.35}
                    />

                    <stop
                      offset="95%"
                      stopColor="#6366f1"
                      stopOpacity={0}
                    />
                  </linearGradient>
                </defs>

                <CartesianGrid
                  strokeDasharray="3 3"
                />

                <XAxis dataKey="name" />

                <YAxis />

                <Tooltip />

                <Area
                  type="monotone"
                  dataKey="bugs"
                  stroke="#6366f1"
                  fillOpacity={1}
                  fill="url(#colorBugs)"
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