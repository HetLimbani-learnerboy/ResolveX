import React from 'react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Activity, Clock, ShieldAlert } from 'lucide-react';

const ManagerDashboard = () => {
  const categoryData = [
    { name: 'Billing', value: 400, color: '#00e5ff' },
    { name: 'Technical', value: 300, color: '#00b4d8' },
    { name: 'Account', value: 300, color: '#0077b6' },
    { name: 'Other', value: 100, color: '#03045e' },
  ];

  const priorityData = [
    { name: 'High', count: 120, color: '#ef4444' }, /* Keep red for high */
    { name: 'Medium', count: 450, color: '#fcd34d' }, /* Soft amber */
    { name: 'Low', count: 800, color: '#6ee7b7' }, /* Muted green */
  ];

  return (
    <div className="dashboard-grid">
      <div className="col-span-12">
        <h2 style={{ marginBottom: '1rem', fontWeight: '500' }}>Operations Overview</h2>
      </div>

      <div className="col-span-4">
        <div className="card">
          <div className="card-header border-none">
            <h3 className="card-title"><Activity size={18} /> Active Tickets</h3>
          </div>
          <div className="stat-value text-gradient">1,370</div>
          <div className="stat-label">Currently open in system</div>
        </div>
      </div>
      <div className="col-span-4">
        <div className="card">
          <div className="card-header border-none">
            <h3 className="card-title"><Clock size={18} /> Avg. Resolution Time</h3>
          </div>
          <div className="stat-value">4.2h</div>
          <div className="stat-label" style={{ color: 'var(--status-low-text)' }}>-1.1h vs last month</div>
        </div>
      </div>
      <div className="col-span-4">
        <div className="card">
          <div className="card-header border-none">
            <h3 className="card-title"><ShieldAlert size={18} /> SLA Breaches</h3>
          </div>
          <div className="stat-value">2</div>
          <div className="stat-label" style={{ color: 'var(--status-medium-text)' }}>Needs attention</div>
        </div>
      </div>

      <div className="col-span-6">
        <div className="card" style={{ height: '360px' }}>
          <div className="card-header">
            <h3 className="card-title">Category Distribution</h3>
          </div>
          <div style={{ height: '260px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  innerRadius={70}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)' }}
                  itemStyle={{ color: 'var(--text-primary)' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem' }}>
            {categoryData.map(item => (
              <div key={item.name} style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.75rem' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: item.color }}></span>
                {item.name}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="col-span-6">
        <div className="card" style={{ height: '360px' }}>
          <div className="card-header">
            <h3 className="card-title">Priority Breakdown</h3>
          </div>
          <div style={{ height: '280px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={priorityData} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" horizontal={false} />
                <XAxis type="number" stroke="var(--text-muted)" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis dataKey="name" type="category" stroke="var(--text-muted)" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip
                  cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                  contentStyle={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)' }}
                />
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
    </div>
  );
};

export default ManagerDashboard;
