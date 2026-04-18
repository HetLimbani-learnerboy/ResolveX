import React, { useState, useEffect } from 'react';
import { UserPlus, Trash2, Edit, RefreshCw, Shield, Check, X } from 'lucide-react';

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [newUser, setNewUser] = useState({ name: '', email: '', role: 'customer', password: '' });
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editRole, setEditRole] = useState('');
  const API = 'http://localhost:5000/api/admin';

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`${API}/users`);
      const data = await res.json();
      if (Array.isArray(data)) {
        setUsers(data);
      }
    } catch (err) {
      console.error('Fetch users error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchUsers(); }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API}/users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newUser)
      });
      const data = await res.json();
      if (res.ok) {
        setNewUser({ name: '', email: '', role: 'customer', password: '' });
        setIsAdding(false);
        fetchUsers();
      } else {
        alert(data.error || 'Failed to create user');
      }
    } catch (err) {
      alert('Backend connection error');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this user?')) return;
    try {
      await fetch(`${API}/users/${id}`, { method: 'DELETE' });
      fetchUsers();
    } catch (err) {
      alert('Delete failed');
    }
  };

  const handleUpdateRole = async (id) => {
    try {
      await fetch(`${API}/users/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: editRole })
      });
      setEditingId(null);
      fetchUsers();
    } catch (err) {
      alert('Update failed');
    }
  };

  const handleToggleActive = async (id, currentStatus) => {
    try {
      await fetch(`${API}/users/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: !currentStatus })
      });
      fetchUsers();
    } catch (err) {
      alert('Toggle failed');
    }
  };

  const inputStyle = {
    padding: '0.5rem 0.75rem', 
    backgroundColor: 'var(--bg-primary)', 
    border: '1px solid var(--border-strong)', 
    borderRadius: 'var(--radius-md)', 
    color: 'var(--text-primary)',
    width: '100%'
  };

  return (
    <div className="dashboard-grid">
      <div className="col-span-12">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h2 style={{ fontWeight: '500' }}>User Management</h2>
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button className="btn btn-secondary" onClick={fetchUsers} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <RefreshCw size={16} /> Refresh
            </button>
            <button className="btn btn-primary" onClick={() => setIsAdding(!isAdding)}>
              <UserPlus size={18} style={{ marginRight: '0.5rem' }} /> Add User
            </button>
          </div>
        </div>
      </div>

      {isAdding && (
        <div className="col-span-12">
          <div className="card animate-fade-in">
            <div className="card-header">
              <h3 className="card-title">Create New User</h3>
            </div>
            <form onSubmit={handleCreate} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', padding: '0 1.5rem 1.5rem' }}>
              <div className="form-group">
                <label>Full Name</label>
                <input type="text" style={inputStyle} value={newUser.name} onChange={(e) => setNewUser({...newUser, name: e.target.value})} required />
              </div>
              <div className="form-group">
                <label>Email Address</label>
                <input type="email" style={inputStyle} value={newUser.email} onChange={(e) => setNewUser({...newUser, email: e.target.value})} required />
              </div>
              <div className="form-group">
                <label>Role</label>
                <select style={inputStyle} value={newUser.role} onChange={(e) => setNewUser({...newUser, role: e.target.value})}>
                  <option value="customer">Customer</option>
                  <option value="support">Support Executive</option>
                  <option value="qa">Quality Assurance</option>
                  <option value="manager">Operations Manager</option>
                  <option value="admin">Administrator</option>
                </select>
              </div>
              <div className="form-group">
                <label>Password</label>
                <input type="password" style={inputStyle} value={newUser.password} onChange={(e) => setNewUser({...newUser, password: e.target.value})} required />
              </div>
              <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
                <button type="submit" className="btn btn-primary">Create Account</button>
                <button type="button" className="btn btn-secondary" onClick={() => setIsAdding(false)}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="col-span-12">
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">{users.length} Registered Users</h3>
          </div>
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Created</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  Array(3).fill(0).map((_, i) => (
                    <tr key={i}>
                      <td colSpan="6">
                        <div className="skeleton" style={{ height: '32px', borderRadius: '4px', width: '100%' }}></div>
                      </td>
                    </tr>
                  ))
                ) : users.length === 0 ? (
                  <tr>
                    <td colSpan="6" style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem' }}>
                      No users found. Database may be offline.
                    </td>
                  </tr>
                ) : (
                  users.map(user => (
                    <tr key={user.id}>
                      <td style={{ fontWeight: '500' }}>{user.name}</td>
                      <td style={{ color: 'var(--text-secondary)' }}>{user.email}</td>
                      <td>
                        {editingId === user.id ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <select style={{ ...inputStyle, padding: '4px 8px', fontSize: '0.8rem', width: 'auto' }} value={editRole} onChange={(e) => setEditRole(e.target.value)}>
                              <option value="customer">Customer</option>
                              <option value="support">Support</option>
                              <option value="qa">QA</option>
                              <option value="manager">Manager</option>
                              <option value="admin">Admin</option>
                            </select>
                            <button className="icon-btn" title="Save" onClick={() => handleUpdateRole(user.id)} style={{ color: 'var(--status-low-text)' }}><Check size={14} /></button>
                            <button className="icon-btn" title="Cancel" onClick={() => setEditingId(null)}><X size={14} /></button>
                          </div>
                        ) : (
                          <span style={{
                            padding: '0.25rem 0.75rem', borderRadius: 'var(--radius-full)',
                            fontSize: '0.75rem', fontWeight: '600',
                            backgroundColor: user.role === 'admin' ? 'rgba(255,100,100,0.15)' : 'rgba(255,255,255,0.05)',
                            color: user.role === 'admin' ? '#ff6b6b' : 'inherit',
                            border: '1px solid var(--border-subtle)', textTransform: 'capitalize'
                          }}>
                            {user.role === 'admin' && <Shield size={11} style={{ marginRight: '4px', display: 'inline' }} />}
                            {user.role}
                          </span>
                        )}
                      </td>
                      <td>
                        <span 
                          style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.875rem', color: user.is_active ? 'var(--status-low-text)' : 'var(--status-high-text)', cursor: 'pointer' }}
                          onClick={() => handleToggleActive(user.id, user.is_active)}
                          title="Click to toggle"
                        >
                          <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: 'currentColor' }}></span>
                          {user.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{user.created_at || '—'}</td>
                      <td>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <button className="icon-btn" title="Edit Role" onClick={() => { setEditingId(user.id); setEditRole(user.role); }}><Edit size={16} /></button>
                          <button className="icon-btn" title="Delete" style={{ color: 'var(--status-high-text)' }} onClick={() => handleDelete(user.id)}><Trash2 size={16} /></button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserManagement;
