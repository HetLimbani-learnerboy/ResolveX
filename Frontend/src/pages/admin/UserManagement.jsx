import React, { useState } from 'react';
import { UserPlus, MoreVertical, Trash2, Edit } from 'lucide-react';

const UserManagement = () => {
  const [users, setUsers] = useState([
    { id: 1, name: 'Super Admin', email: 'admin@resolvex.com', role: 'admin' },
    { id: 2, name: 'Acme Corp', email: 'customer@resolvex.com', role: 'customer' },
    { id: 3, name: 'Alex Support', email: 'support@resolvex.com', role: 'support' },
    { id: 4, name: 'Sam Quality', email: 'qa@resolvex.com', role: 'qa' },
    { id: 5, name: 'Morgan Ops', email: 'manager@resolvex.com', role: 'manager' },
  ]);

  const [newUser, setNewUser] = useState({ name: '', email: '', role: 'customer', password: '' });
  const [isAdding, setIsAdding] = useState(false);

  const handleCreate = (e) => {
    e.preventDefault();
    setUsers([...users, { ...newUser, id: Date.now() }]);
    setNewUser({ name: '', email: '', role: 'customer', password: '' });
    setIsAdding(false);
  };

  return (
    <div className="dashboard-grid">
      <div className="col-span-12">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h2 style={{ fontWeight: '500' }}>User Management</h2>
          <button className="btn btn-primary" onClick={() => setIsAdding(!isAdding)}>
            <UserPlus size={18} style={{ marginRight: '0.5rem' }} /> Add User
          </button>
        </div>
      </div>

      {isAdding && (
        <div className="col-span-12">
          <div className="card animate-fade-in">
            <div className="card-header">
              <h3 className="card-title">Create New User</h3>
            </div>
            <form onSubmit={handleCreate} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="form-group">
                <label>Full Name</label>
                <input 
                  type="text" 
                  style={{
                    padding: '0.5rem 0.75rem', backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-strong)', borderRadius: 'var(--radius-md)', color: 'white'
                  }}
                  value={newUser.name}
                  onChange={(e) => setNewUser({...newUser, name: e.target.value})}
                  required
                />
              </div>
              <div className="form-group">
                <label>Email Address</label>
                <input 
                  type="email" 
                  style={{
                    padding: '0.5rem 0.75rem', backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-strong)', borderRadius: 'var(--radius-md)', color: 'white'
                  }}
                  value={newUser.email}
                  onChange={(e) => setNewUser({...newUser, email: e.target.value})}
                  required
                />
              </div>
              <div className="form-group">
                <label>Role</label>
                <select 
                  style={{
                    padding: '0.5rem 0.75rem', backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-strong)', borderRadius: 'var(--radius-md)', color: 'white'
                  }}
                  value={newUser.role}
                  onChange={(e) => setNewUser({...newUser, role: e.target.value})}
                >
                  <option value="customer">Customer</option>
                  <option value="support">Support Executive</option>
                  <option value="qa">Quality Assurance</option>
                  <option value="manager">Operations Manager</option>
                  <option value="admin">Administrator</option>
                </select>
              </div>
              <div className="form-group">
                <label>Temporary Password</label>
                <input 
                  type="password" 
                  style={{
                     padding: '0.5rem 0.75rem', backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-strong)', borderRadius: 'var(--radius-md)', color: 'white'
                  }}
                  value={newUser.password}
                  onChange={(e) => setNewUser({...newUser, password: e.target.value})}
                  required
                />
              </div>
              <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                <button type="submit" className="btn btn-primary">Create Account</button>
                <button type="button" className="btn btn-secondary" onClick={() => setIsAdding(false)}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="col-span-12">
        <div className="card">
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map(user => (
                  <tr key={user.id}>
                    <td style={{ fontWeight: '500' }}>{user.name}</td>
                    <td style={{ color: 'var(--text-secondary)' }}>{user.email}</td>
                    <td>
                      <span style={{
                        padding: '0.25rem 0.75rem', 
                        borderRadius: 'var(--radius-full)', 
                        fontSize: '0.75rem',
                        fontWeight: '600',
                        backgroundColor: 'rgba(255,255,255,0.05)',
                        border: '1px solid var(--border-subtle)',
                        textTransform: 'capitalize'
                      }}>
                        {user.role}
                      </span>
                    </td>
                    <td>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.875rem', color: 'var(--status-low-text)' }}>
                        <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: 'currentColor' }}></span> Active
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button className="icon-btn" title="Edit"><Edit size={16} /></button>
                        <button className="icon-btn" title="Delete" style={{ color: 'var(--status-high-text)' }}><Trash2 size={16} /></button>
                        <button className="icon-btn"><MoreVertical size={16} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserManagement;
