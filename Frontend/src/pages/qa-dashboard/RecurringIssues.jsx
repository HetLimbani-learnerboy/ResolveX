import React, { useEffect, useState } from "react";
import { Loader2, AlertCircle, Users, Copy, Filter, ChevronRight } from 'lucide-react';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://127.0.0.1:5000';

const RecurringIssues = () => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetch(`${BACKEND_URL}/api/admin/recurring-issues`)
            .then(res => {
                if (!res.ok) throw new Error("Failed to fetch recurring issues");
                return res.json();
            })
            .then(json => {
                setData(json);
                setLoading(false);
            })
            .catch(err => {
                console.error("Fetch error:", err);
                setError(err.message);
                setLoading(false);
            });
    }, []);

    if (loading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
                <Loader2 size={40} className="animate-spin" color="var(--brand-primary)" />
            </div>
        );
    }

    if (error) {
        return (
            <div style={{ padding: '2rem', textAlign: 'center' }}>
                <AlertCircle size={48} color="#ef4444" style={{ marginBottom: '1rem', opacity: 0.5 }} />
                <h3>Error Loading Data</h3>
                <p>{error}</p>
            </div>
        );
    }

    const { score, total_complaints, similar_complaints, clusters } = data;

    return (
        <div className="p-2 animate-fade-in" style={{ padding: '1.5rem' }}>
            <div style={{ marginBottom: '2rem' }}>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 600 }}>Recurring Problem Analysis</h2>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                    Systems-level view of repetitive complaints grouped by semantic similarity.
                </p>
            </div>

            {/* Top Score Card */}
            <div className="card" style={{ 
                padding: '2rem', 
                background: 'linear-gradient(135deg, var(--bg-card) 0%, rgba(245,158,11,0.05) 100%)',
                borderLeft: '5px solid #f59e0b',
                marginBottom: '2rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
            }}>
                <div>
                    <div style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        System Recurrence Score
                    </div>
                    <div style={{ fontSize: '3rem', fontWeight: 800, color: '#f59e0b' }}>
                        {score}%
                    </div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
                        {similar_complaints} out of {total_complaints} total tickets are identified as recurring issues.
                    </div>
                </div>
                <div style={{ textAlign: 'right', display: 'none' }}>
                   {/* Placeholder for a small chart or icon if needed */}
                </div>
            </div>

            <div className="card">
                <div className="card-header" style={{ padding: '1.25rem', borderBottom: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h3 className="card-title">Top Recurring Clusters</h3>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{clusters.length} distinct groups found</div>
                </div>
                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ textAlign: 'left', borderBottom: '1px solid var(--border-subtle)' }}>
                                <th style={{ padding: '1rem', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)' }}>TOPIC / SUBJECT</th>
                                <th style={{ padding: '1rem', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)' }}>CATEGORY</th>
                                <th style={{ padding: '1rem', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)' }}>RECURRENCE</th>
                                <th style={{ padding: '1rem', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)' }}>IMPACT</th>
                                <th style={{ padding: '1rem', textAlign: 'right' }}></th>
                            </tr>
                        </thead>
                        <tbody>
                            {clusters.length > 0 ? clusters.map((cluster, i) => (
                                <tr key={i} style={{ borderBottom: '1px solid var(--border-subtle)', transition: 'background 0.2s' }} className="hover-row">
                                    <td style={{ padding: '1.25rem 1rem' }}>
                                        <div style={{ fontWeight: 600, fontSize: '0.9rem', marginBottom: '0.25rem' }}>{cluster.topic}</div>
                                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Pattern Match: TF-IDF Semantics</div>
                                    </td>
                                    <td style={{ padding: '1rem' }}>
                                        <span style={{ fontSize: '0.75rem', padding: '4px 10px', borderRadius: '20px', background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)', fontWeight: 500 }}>
                                            {cluster.category}
                                        </span>
                                    </td>
                                    <td style={{ padding: '1rem' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                            <Copy size={14} color="var(--text-muted)" />
                                            <span style={{ fontWeight: 600 }}>{cluster.count} tickets</span>
                                        </div>
                                    </td>
                                    <td style={{ padding: '1rem' }}>
                                        <div style={{ width: '100px', height: '6px', background: 'var(--bg-secondary)', borderRadius: '3px', overflow: 'hidden' }}>
                                            <div style={{ 
                                                height: '100%', 
                                                width: `${Math.min((cluster.count / total_complaints) * 500, 100)}%`, 
                                                background: cluster.count > 5 ? '#ef4444' : '#f59e0b' 
                                            }}></div>
                                        </div>
                                    </td>
                                    <td style={{ padding: '1rem', textAlign: 'right' }}>
                                        <button style={{ background: 'none', border: 'none', color: 'var(--brand-primary)', cursor: 'pointer' }}>
                                            <ChevronRight size={18} />
                                        </button>
                                    </td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan="5" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                                        No recurring issue clusters detected yet.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <style>{`
                .hover-row:hover {
                    background-color: var(--bg-secondary);
                }
            `}</style>
        </div>
    );
};

export default RecurringIssues;