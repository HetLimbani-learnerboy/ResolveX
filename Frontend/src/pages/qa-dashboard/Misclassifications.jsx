import React, { useEffect, useState } from "react";
import { AlertTriangle, Edit, X, Save, Search, CheckCircle2, Loader2, AlertCircle } from 'lucide-react';
import { createPortal } from 'react-dom';
import toast from 'react-hot-toast';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://127.0.0.1:5000';
const CATEGORIES = ["Product", "Packaging", "Trade", "Payment", "Delivery", "Service", "Account", "App/Website", "Other", "Wrong Complain"];

const Misclassifications = () => {
  const [allComplaints, setAllComplaints] = useState([]);
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Edit modal states
  const [editingTicket, setEditingTicket] = useState(null);
  const [editCategory, setEditCategory] = useState('');
  const [editPriority, setEditPriority] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/complaints/all`);
      if (!res.ok) throw new Error("Failed to fetch data");
      const data = await res.json();
      const arr = Array.isArray(data) ? data : [];
      setAllComplaints(arr);
      
      // Filter for misclassifications: complaints with low AI confidence (<80%)
      const misclassified = arr.filter(c => (c.ai_confidence || 0) < 80);
      setComplaints(misclassified);
      setLoading(false);
    } catch (err) {
      console.error(err);
      setError("Could not connect to backend.");
      setLoading(false);
    }
  };

  const handleEditClick = (ticket) => {
    setEditingTicket(ticket);
    setEditCategory(ticket.category || 'Other');
    setEditPriority(ticket.priority || 'Medium');
  };

  const handleSaveEdit = async () => {
    setSaving(true);
    try {
      // Update via the complaint update endpoint
      const res = await fetch(`${BACKEND_URL}/api/complaints/update/${editingTicket.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ category: editCategory, priority: editPriority })
      });
      
      // Update local state regardless (UI correction)
      setComplaints(prev => prev.map(c => 
        c.id === editingTicket.id 
          ? { ...c, category: editCategory, priority: editPriority, corrected: true } 
          : c
      ));
      setEditingTicket(null);
    } catch (err) {
      toast.error('Network error updating ticket.');
    } finally {
      setSaving(false);
    }
  };

  const filteredComplaints = complaints.filter(c => {
    const text = (c.subject || '') + ' ' + (c.complaint_text || '') + ' ' + (c.id || '');
    return text.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const renderEditModal = () => {
    if (!editingTicket) return null;
    return createPortal(
      <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15,23,42,0.6)', backdropFilter: 'blur(4px)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="card animate-fade-in" style={{ width: '480px', background: 'var(--bg-primary)', borderRadius: '16px', boxShadow: '0 20px 40px rgba(0,0,0,0.2)', padding: '2rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Edit size={20} color="var(--brand-primary)" /> Correct Classification
            </h3>
            <button onClick={() => setEditingTicket(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}><X size={20} /></button>
          </div>

          <div style={{ padding: '1rem', background: 'var(--bg-secondary)', borderRadius: '8px', marginBottom: '1.5rem', fontSize: '0.85rem', color: 'var(--text-secondary)', borderLeft: '3px solid var(--brand-primary)' }}>
            <div style={{ fontWeight: 600, marginBottom: '4px', color: 'var(--text-primary)' }}>{editingTicket.subject || 'No Subject'}</div>
            <div>"{(editingTicket.complaint_text || '').substring(0, 120)}..."</div>
            <div style={{ marginTop: '8px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Current AI Confidence: <span style={{ color: '#f59e0b', fontWeight: 700 }}>{editingTicket.ai_confidence || 0}%</span>
            </div>
          </div>

          <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1.25rem' }}>
            <label style={{ fontSize: '0.875rem', fontWeight: 600 }}>Correct Category</label>
            <select value={editCategory} onChange={e => setEditCategory(e.target.value)} style={{ padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-strong)', background: 'var(--bg-card)', outline: 'none' }}>
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '2rem' }}>
            <label style={{ fontSize: '0.875rem', fontWeight: 600 }}>Correct Priority</label>
            <select value={editPriority} onChange={e => setEditPriority(e.target.value)} style={{ padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-strong)', background: 'var(--bg-card)', outline: 'none' }}>
              <option value="Critical">Critical</option>
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>
          </div>

          <div style={{ display: 'flex', gap: '1rem' }}>
            <button onClick={() => setEditingTicket(null)} style={{ flex: 1, padding: '0.85rem', background: 'var(--bg-secondary)', border: '1px solid var(--border-strong)', borderRadius: '8px', fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
            <button disabled={saving} onClick={handleSaveEdit} style={{ flex: 1, padding: '0.85rem', background: 'var(--brand-primary)', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', cursor: 'pointer' }}>
              {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />} Save Corrections
            </button>
          </div>
        </div>
      </div>,
      document.body
    );
  };

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}><Loader2 size={40} className="animate-spin" color="var(--brand-primary)" /></div>;

  if (error) return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '50vh', gap: '1rem' }}>
      <AlertCircle size={48} style={{ color: '#ef4444', opacity: 0.6 }} />
      <p>{error}</p>
    </div>
  );

  return (
    <div className="p-2 animate-fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 600, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '10px' }}>
            Misclassifications
            <span style={{ padding: '4px 10px', background: complaints.length > 0 ? '#fef2f2' : '#f0fdf4', color: complaints.length > 0 ? '#ef4444' : '#10b981', fontSize: '0.8rem', borderRadius: '20px', fontWeight: 700 }}>
              {complaints.length} Flagged
            </span>
          </h2>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
            {"Tickets where AI confidence was below 80% — review and correct classifications"}
          </div>
        </div>
        <div style={{ position: 'relative' }}>
          <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input 
            type="text" 
            placeholder="Search tickets..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ padding: '0.6rem 1rem 0.6rem 2.2rem', borderRadius: '8px', border: '1px solid var(--border-strong)', background: 'var(--bg-primary)', outline: 'none', fontSize: '0.85rem', width: '250px' }} 
          />
        </div>
      </div>

      <div className="card">
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ background: 'var(--bg-secondary)' }}>
                <th style={{ padding: '1rem', borderBottom: '1px solid var(--border-subtle)', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)' }}>SUBJECT</th>
                <th style={{ padding: '1rem', borderBottom: '1px solid var(--border-subtle)', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)' }}>COMPLAINT TEXT</th>
                <th style={{ padding: '1rem', borderBottom: '1px solid var(--border-subtle)', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)' }}>AI CATEGORY / PRIORITY</th>
                <th style={{ padding: '1rem', borderBottom: '1px solid var(--border-subtle)', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)' }}>CONFIDENCE</th>
                <th style={{ padding: '1rem', borderBottom: '1px solid var(--border-subtle)', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', textAlign: 'right' }}>ACTION</th>
              </tr>
            </thead>
            <tbody>
              {filteredComplaints.length > 0 ? (
                filteredComplaints.map(item => (
                  <tr key={item.id} style={{ borderBottom: '1px solid var(--border-subtle)', transition: 'background 0.2s' }} onMouseOver={e => e.currentTarget.style.background = 'var(--bg-secondary)'} onMouseOut={e => e.currentTarget.style.background = 'transparent'}>
                    <td style={{ padding: '1rem', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)', maxWidth: '180px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.subject || '-'}</td>
                    <td style={{ padding: '1rem', fontSize: '0.85rem', color: 'var(--text-secondary)', maxWidth: '280px' }}>
                      <div style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>"{item.complaint_text}"</div>
                    </td>
                    <td style={{ padding: '1rem' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <span style={{ fontSize: '0.85rem', fontWeight: 500 }}>{item.category || 'N/A'}</span>
                        <span style={{ fontSize: '0.7rem', padding: '2px 6px', background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: '4px', width: 'fit-content' }}>{item.priority}</span>
                      </div>
                    </td>
                    <td style={{ padding: '1rem', fontSize: '0.85rem', fontWeight: 600 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#f59e0b' }}>
                        <AlertTriangle size={14} /> {item.ai_confidence || 0}%
                      </div>
                    </td>
                    <td style={{ padding: '1rem', textAlign: 'right' }}>
                      {item.corrected ? (
                         <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '6px 10px', background: '#ecfdf5', color: '#10b981', border: '1px solid #a7f3d0', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 600 }}>
                           <CheckCircle2 size={14} /> Corrected
                         </span>
                      ) : (
                        <button onClick={() => handleEditClick(item)} style={{ padding: '6px 12px', background: 'white', border: '1px solid var(--border-strong)', borderRadius: '6px', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px', transition: 'all 0.2s' }} onMouseOver={e => {e.currentTarget.style.borderColor = 'var(--brand-primary)'; e.currentTarget.style.color = 'var(--brand-primary)';}} onMouseOut={e => {e.currentTarget.style.borderColor = 'var(--border-strong)'; e.currentTarget.style.color = 'var(--text-primary)';}}>
                          <Edit size={14} /> Edit
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                    <CheckCircle2 size={40} style={{ margin: '0 auto 10px', color: '#10b981', opacity: 0.5 }} />
                    <div style={{ fontWeight: 500, color: 'var(--text-primary)', marginBottom: '0.25rem' }}>All Clear!</div>
                    <div style={{ fontSize: '0.9rem' }}>No misclassified records found. All AI predictions are above 80% confidence.</div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      {renderEditModal()}
    </div>
  );
}

export default Misclassifications;