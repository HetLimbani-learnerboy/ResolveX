import React, { useEffect, useState } from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  LineChart,
  Line
} from "recharts";
import { useAuth } from "../../context/AuthContext";
import { AlertCircle, CheckCircle2, BarChart3, Clock } from 'lucide-react';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

const AuditComplaints = () => {
  const { token } = useAuth();
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchComplaints();
  }, []);

  const fetchComplaints = async () => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/complaints/all`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!res.ok) throw new Error("Failed to fetch audit data");
      
      const data = await res.json();
      // Ensure we always have an array even if the backend fails
      setComplaints(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Audit Fetch Error:", error);
      setError("Could not load audit data. Please ensure the backend route exists.");
    } finally {
      setLoading(false);
    }
  };

  /* ======================================
     METRICS (With Null Guards)
  ====================================== */
  const totalReviewed = complaints.length;
  
  const correctCount = complaints.filter(
    (item) => (item?.ai_confidence || 0) >= 80
  ).length;

  const accuracy = totalReviewed > 0 
    ? ((correctCount / totalReviewed) * 100).toFixed(1) 
    : 0;

  const incorrectCount = totalReviewed - correctCount;

  /* ======================================
     CATEGORY GRAPH DATA
  ====================================== */
  const categories = ["Product", "Packaging", "Trade"];
  const categoryData = categories.map((cat) => ({
    name: cat,
    total: complaints.filter(item => item?.category === cat).length,
    correct: complaints.filter(item => item?.category === cat && (item?.ai_confidence || 0) >= 80).length
  }));

  /* ======================================
     DAILY GRAPH DATA
  ====================================== */
  const dailyMap = {};
  complaints.forEach((item) => {
    if (!item?.created_at) return;
    try {
      const dateObj = new Date(item.created_at);
      if (isNaN(dateObj)) return; // Check for "Invalid Date"
      
      const day = dateObj.toLocaleDateString("en-US", { weekday: "short" });
      dailyMap[day] = (dailyMap[day] || 0) + 1;
    } catch (e) {
      console.error("Date error:", e);
    }
  });

  const timeData = Object.keys(dailyMap).map((day) => ({
    day,
    reviewed: dailyMap[day]
  }));

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg font-medium animate-pulse">Loading Audit Analytics...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 text-center text-red-500 card">
        <AlertCircle className="mx-auto mb-2" />
        {error}
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-2xl font-bold">Audit Complaints</h2>
        <div className="text-sm text-muted">Real-time AI Accuracy Tracking</div>
      </div>

      <div className="dashboard-grid">
        {/* Metric Cards */}
        <div className="col-span-4">
          <div className="card">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-slate-100"><BarChart3 size={24} className="text-slate-600" /></div>
              <div>
                <div className="stat-value">{totalReviewed}</div>
                <div className="stat-label">Total Reviewed</div>
              </div>
            </div>
          </div>
        </div>

        <div className="col-span-4">
          <div className="card">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-indigo-50"><CheckCircle2 size={24} className="text-indigo-600" /></div>
              <div>
                <div className="stat-value text-indigo-600">{accuracy}%</div>
                <div className="stat-label">AI Accuracy Score</div>
              </div>
            </div>
          </div>
        </div>

        <div className="col-span-4">
          <div className="card">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-rose-50"><AlertCircle size={24} className="text-rose-600" /></div>
              <div>
                <div className="stat-value text-rose-600">{incorrectCount}</div>
                <div className="stat-label">Misclassifications</div>
              </div>
            </div>
          </div>
        </div>

        {/* Charts Section */}
        <div className="col-span-6">
          <div className="card h-[400px]">
            <div className="card-header"><h3 className="card-title">Accuracy by Category</h3></div>
            <ResponsiveContainer width="100%" height="85%">
              <BarChart data={categoryData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip cursor={{fill: 'rgba(0,0,0,0.05)'}} />
                <Bar dataKey="total" name="Total Volume" fill="#94a3b8" radius={[4, 4, 0, 0]} />
                <Bar dataKey="correct" name="AI Correct" fill="#6366f1" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="col-span-6">
          <div className="card h-[400px]">
            <div className="card-header"><h3 className="card-title">Daily Review Velocity</h3></div>
            <ResponsiveContainer width="100%" height="85%">
              <LineChart data={timeData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="day" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="reviewed" stroke="#10b981" strokeWidth={3} dot={{ r: 6 }} activeDot={{ r: 8 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Audit Table */}
        <div className="col-span-12">
          <div className="card">
            <div className="card-header flex justify-between items-center">
              <h3 className="card-title">Recent Audit Logs</h3>
              <span className="text-xs font-medium text-slate-400">Displaying last 10 records</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Ticket ID</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Category</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Priority</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">AI Confidence</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {complaints.length > 0 ? (
                    complaints.slice(0, 10).map((item, index) => (
                      <tr key={item?.id || index} className="hover:bg-slate-50 transition-colors">
                        <td className="px-4 py-3 text-sm font-mono text-indigo-600">
                          {item?.id ? String(item.id).slice(0, 8).toUpperCase() : 'N/A'}
                        </td>
                        <td className="px-4 py-3 text-sm">{item?.category || 'General'}</td>
                        <td className="px-4 py-3 text-sm">
                          <span className={`badge ${(item?.priority || 'low').toLowerCase()}`}>{item?.priority || 'Low'}</span>
                        </td>
                        <td className="px-4 py-3 text-sm text-slate-600">{item?.status || 'Pending'}</td>
                        <td className="px-4 py-3 text-sm font-bold">
                          <div className="flex items-center gap-2">
                            <div className="w-16 bg-slate-200 h-1.5 rounded-full overflow-hidden">
                              <div 
                                className={`h-full ${item?.ai_confidence >= 80 ? 'bg-emerald-500' : 'bg-amber-500'}`} 
                                style={{ width: `${item?.ai_confidence || 0}%` }}
                              ></div>
                            </div>
                            {item?.ai_confidence ?? 0}%
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="5" className="px-4 py-10 text-center text-slate-400">
                        No audit records found in the database.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuditComplaints;