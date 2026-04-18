import React, { useEffect, useState } from "react";
import { Search, Filter, Loader2, CheckCircle2, MessageSquare, AlertCircle } from 'lucide-react';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://127.0.0.1:5000';

const ResolutionReview = () => {
    const [reviews, setReviews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterCategory, setFilterCategory] = useState('');

    useEffect(() => {
        fetch(`${BACKEND_URL}/api/complaints/all`)
            .then(res => {
                if (!res.ok) throw new Error('Failed to fetch');
                return res.json();
            })
            .then(data => {
                const sorted = Array.isArray(data) ? data : [];
                setReviews(sorted);
                setLoading(false);
            })
            .catch(err => {
                console.error(err);
                setLoading(false);
            });
    }, []);

    const filteredReviews = reviews.filter(r => {
        const text = (r.subject || '') + ' ' + (r.complaint_text || '') + ' ' + (r.id || '');
        const matchesSearch = text.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCat = filterCategory ? r.category === filterCategory : true;
        return matchesSearch && matchesCat;
    });

    const uniqueCategories = [...new Set(reviews.map(r => r.category))].filter(Boolean);

    if (loading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
                <Loader2 size={40} className="animate-spin" color="var(--brand-primary)" />
            </div>
        );
    }

    return (
        <div className="p-2 animate-fade-in">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                    <h2 style={{ fontSize: '1.5rem', fontWeight: 600, color: 'var(--text-primary)' }}>Resolution Review</h2>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>Comprehensive log of all complaint reviews and AI recommended actions</div>
                </div>
                
                <div style={{ display: 'flex', gap: '1rem' }}>
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
                    <div style={{ position: 'relative' }}>
                        <Filter size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
                        <select 
                            value={filterCategory} 
                            onChange={(e) => setFilterCategory(e.target.value)}
                            style={{ padding: '0.6rem 1rem 0.6rem 2.2rem', borderRadius: '8px', border: '1px solid var(--border-strong)', background: 'var(--bg-primary)', outline: 'none', fontSize: '0.85rem', appearance: 'none', width: '150px', cursor: 'pointer' }}
                        >
                            <option value="">All Categories</option>
                            {uniqueCategories.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                    </div>
                </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                {filteredReviews.length > 0 ? filteredReviews.map((review, idx) => (
                    <div key={review.id || idx} className="card" style={{ padding: '1.5rem', border: '1px solid var(--border-subtle)', boxShadow: '0 4px 15px rgba(0,0,0,0.03)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '1rem' }}>
                            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
                                <div style={{ fontWeight: 700, color: 'var(--brand-primary)', fontSize: '1rem' }}>{review.subject || 'No Subject'}</div>
                                <span style={{ padding: '4px 10px', background: 'var(--bg-secondary)', border: '1px solid var(--border-strong)', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 600 }}>{review.category}</span>
                                <span style={{ padding: '4px 10px', background: review.priority === 'High' || review.priority === 'Critical' ? '#fef2f2' : review.priority === 'Medium' ? '#fefce8' : '#f0fdf4', color: review.priority === 'High' || review.priority === 'Critical' ? '#ef4444' : review.priority === 'Medium' ? '#eab308' : '#22c55e', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 600 }}>{review.priority} Priority</span>
                                <span style={{ padding: '4px 10px', background: review.status === 'Open' ? 'rgba(37,99,235,0.08)' : 'rgba(16,185,129,0.08)', color: review.status === 'Open' ? 'var(--brand-primary)' : '#10b981', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 600 }}>{review.status}</span>
                            </div>
                            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                                AI Score: <span style={{ fontWeight: 700, color: (review.ai_confidence || 0) >= 80 ? '#10b981' : '#f59e0b' }}>{review.ai_confidence || 0}%</span>
                            </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
                            <div>
                                <h4 style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                    <MessageSquare size={14} /> Customer Submitted
                                </h4>
                                <div style={{ padding: '1rem', background: 'var(--bg-secondary)', borderRadius: '8px', fontSize: '0.9rem', lineHeight: '1.5', color: 'var(--text-primary)', borderLeft: '3px solid var(--border-strong)' }}>
                                    {review.complaint_text || 'No complaint text available'}
                                </div>
                            </div>
                            
                            <div>
                                <h4 style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--brand-primary)', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                    <CheckCircle2 size={14} /> AI Recommended Resolution
                                </h4>
                                <div style={{ padding: '1rem', background: 'rgba(37,99,235,0.04)', border: '1px solid rgba(37,99,235,0.1)', borderRadius: '8px', fontSize: '0.95rem', lineHeight: '1.5', color: 'var(--text-primary)', fontWeight: 500 }}>
                                    {review.recommended_action || "Awaiting AI review"}
                                </div>
                                <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                                    <button style={{ padding: '6px 12px', background: 'white', border: '1px solid #a7f3d0', color: '#16a34a', borderRadius: '6px', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s', flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }} onMouseOver={e => e.currentTarget.style.background = '#f0fdf4'} onMouseOut={e => e.currentTarget.style.background = 'white'}>
                                      <CheckCircle2 size={14} /> Approve
                                    </button>
                                    <button style={{ padding: '6px 12px', background: 'white', border: '1px solid #fecaca', color: '#dc2626', borderRadius: '6px', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s', flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }} onMouseOver={e => e.currentTarget.style.background = '#fef2f2'} onMouseOut={e => e.currentTarget.style.background = 'white'}>
                                      <AlertCircle size={14} /> Flag for Review
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )) : (
                    <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-muted)', background: 'var(--bg-card)', borderRadius: '12px' }}>
                        <AlertCircle size={48} style={{ margin: '0 auto 1rem', opacity: 0.3 }} />
                        <h3 style={{ fontSize: '1.1rem', fontWeight: 500, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>No Resolutions Found</h3>
                        <p style={{ fontSize: '0.9rem' }}>No complaints match the current filters or no data is available.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ResolutionReview;
