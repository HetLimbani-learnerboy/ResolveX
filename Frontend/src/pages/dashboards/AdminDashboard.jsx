import React from 'react';
import { Database, Server, Users, Layers } from 'lucide-react';
import { Link } from 'react-router-dom';

const AdminDashboard = () => {
  return (
    <div className="dashboard-grid">
      <div className="col-span-12">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h2 style={{ fontWeight: '500' }}>System Administration</h2>
          <Link to="/admin/users" className="btn btn-primary">Manage Users</Link>
        </div>
      </div>

      <div className="col-span-3">
        <div className="card">
          <div className="card-header border-none">
            <h3 className="card-title"><Users size={18} /> Total Users</h3>
          </div>
          <div className="stat-value">1,204</div>
          <div className="stat-label">Active accounts</div>
        </div>
      </div>
      <div className="col-span-3">
        <div className="card">
          <div className="card-header border-none">
            <h3 className="card-title"><Server size={18} /> Server Status</h3>
          </div>
          <div className="stat-value text-gradient" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            99.9% <span style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: 'var(--status-low-text)', display: 'inline-block' }}></span>
          </div>
          <div className="stat-label">Operational</div>
        </div>
      </div>
      <div className="col-span-3">
        <div className="card">
          <div className="card-header border-none">
            <h3 className="card-title"><Database size={18} /> AI Model API</h3>
          </div>
          <div className="stat-value">12ms</div>
          <div className="stat-label">Average latency</div>
        </div>
      </div>
      <div className="col-span-3">
        <div className="card">
          <div className="card-header border-none">
            <h3 className="card-title"><Layers size={18} /> Storage</h3>
          </div>
          <div className="stat-value">4.2 TB</div>
          <div className="stat-label">Used across org</div>
        </div>
      </div>

      <div className="col-span-12">
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Recent System Logs</h3>
          </div>
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Timestamp</th>
                  <th>Level</th>
                  <th>Message</th>
                  <th>Service</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>2026-04-18 10:23:41</td>
                  <td><span className="badge low">INFO</span></td>
                  <td>Model cache cleared successfully</td>
                  <td>AI-Classifier</td>
                </tr>
                <tr>
                  <td>2026-04-18 10:15:22</td>
                  <td><span className="badge medium">WARN</span></td>
                  <td>High memory usage detected (85%)</td>
                  <td>DB-Primary</td>
                </tr>
                <tr>
                  <td>2026-04-18 09:45:10</td>
                  <td><span className="badge low">INFO</span></td>
                  <td>New batch of 50 users imported</td>
                  <td>Auth-Service</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
