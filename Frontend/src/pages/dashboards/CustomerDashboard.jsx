import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { 
  Send, Clock, AlertCircle, CheckCircle2, 
  UploadCloud, Loader2, Sparkles, MessageSquare, 
  History, X, Star, Filter 
} from 'lucide-react';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

const CustomerDashboard = () => {
  const { user, token } = useAuth();
  
  // Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [channel, setChannel] = useState('Product'); // Default channel
  const [files, setFiles] = useState([]);
  
  // UI State
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [tickets, setTickets] = useState([]);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [reply, setReply] = useState('');
  const [isFetching, setIsFetching] = useState(true);

  const channels = ['Trade', 'Packaging', 'Product'];

  // Fetch tickets on load
  useEffect(() => {
    fetchTickets();
  }, []);

  const fetchTickets = async () => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/tickets/my-tickets`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) setTickets(data);
    } catch (err) {
      console.error("Failed to fetch tickets");
    } finally {
      setIsFetching(false);
    }
  };

  const handleFileUpload = (e) => {
    const uploadedFiles = Array.from(e.target.files);
    setFiles([...files, ...uploadedFiles]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsAnalyzing(true);

    // Simulate AI routing delay
    setTimeout(async () => {
      const formData = new FormData();
      formData.append('title', title);
      formData.append('description', description);
      formData.append('channel', channel);
      files.forEach(file => formData.append('attachments', file));

      try {
        const response = await fetch(`${BACKEND_URL}/api/tickets/create`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}` },
          body: formData
        });

        if (response.ok) {
          setIsSubmitted(true);
          setTitle('');
          setDescription('');
          setFiles([]);
          fetchTickets();
          setTimeout(() => setIsSubmitted(false), 3000);
        }
      } catch (err) {
        alert("Submission failed");
      } finally {
        setIsAnalyzing(false);
      }
    }, 1500);
  };

  const handleRate = async (ticketId, rating) => {
    await fetch(`${BACKEND_URL}/api/tickets/${ticketId}/rate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ rating })
    });
    fetchTickets();
  };

  return (
    <div className="dashboard-grid">
      {/* LEFT: Submission Form */}
      <div className="col-span-7">
        <div className="card">
          <div className="card-header">
            <h3 className="card-title"><Sparkles size={18} className="text-brand" /> Submit New Complaint</h3>
          </div>
          
          {isSubmitted ? (
            <div className="animate-fade-in text-center p-12">
              <CheckCircle2 size={50} className="text-success mx-auto mb-4" />
              <h3>Complaint Registered</h3>
              <p className="text-secondary">AI has tagged this as <b>{channel}</b> and assigned a priority.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col gap-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="form-group">
                  <label className="label-sm">Subject</label>
                  <input 
                    type="text" 
                    className="input-primary"
                    placeholder="E.g. Damaged packaging on arrival"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required 
                  />
                </div>
                <div className="form-group">
                  <label className="label-sm">Channel</label>
                  <select 
                    className="input-primary"
                    value={channel}
                    onChange={(e) => setChannel(e.target.value)}
                  >
                    {channels.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label className="label-sm">Detailed Description</label>
                <textarea 
                  className="input-primary"
                  rows="4"
                  placeholder="Describe the issue, batch numbers, or specific problems..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  required
                ></textarea>
              </div>
              
              <div className="upload-container">
                <input type="file" id="file-up" multiple onChange={handleFileUpload} hidden />
                <label htmlFor="file-up" className="upload-zone">
                  <UploadCloud size={24} className="text-brand mb-2" />
                  <p className="text-sm font-medium">Click to upload invoice or proof</p>
                  <span className="text-xs text-muted">PDF, JPG, PNG supported</span>
                </label>
                {files.length > 0 && (
                  <div className="file-list mt-2">
                    {files.map((f, i) => <div key={i} className="text-xs text-brand">📎 {f.name}</div>)}
                  </div>
                )}
              </div>

              <button type="submit" className="btn btn-primary glow-btn" disabled={isAnalyzing}>
                {isAnalyzing ? <><Loader2 className="animate-spin" /> AI Routing...</> : <><Send /> Register Complaint</>}
              </button>
            </form>
          )}
        </div>

        {/* CHAT/DETAIL SECTION (Conditional) */}
        {selectedTicket && (
          <div className="card mt-6 animate-slide-up">
            <div className="card-header flex justify-between">
              <h3 className="card-title">Conversation: {selectedTicket.id}</h3>
              <button onClick={() => setSelectedTicket(null)}><X size={18} /></button>
            </div>
            <div className="chat-box p-4 h-48 overflow-y-auto bg-secondary rounded-md">
               <div className="message system text-xs text-center mb-4">Support agent joined the chat</div>
               {/* Mock Messages */}
               <div className="message-bubble received">Hello {user.full_name}, we are looking into the {selectedTicket.channel} issue.</div>
            </div>
            <div className="flex gap-2 mt-4">
              <input 
                className="input-primary flex-1" 
                placeholder="Type your reply..." 
                value={reply} 
                onChange={(e) => setReply(e.target.value)}
              />
              <button className="btn btn-primary"><Send size={16} /></button>
            </div>
          </div>
        )}
      </div>

      {/* RIGHT: History & Tracking */}
      <div className="col-span-5">
        <div className="card">
          <div className="card-header flex justify-between items-center">
            <h3 className="card-title"><History size={18} /> Complaint History</h3>
            <Filter size={16} className="text-muted" />
          </div>
          
          <div className="flex flex-col gap-4">
            {isFetching ? <Loader2 className="animate-spin mx-auto" /> : (
              tickets.length === 0 ? <p className="text-center text-muted">No records found</p> :
              tickets.map(t => (
                <div 
                  key={t.id} 
                  className={`ticket-item ${selectedTicket?.id === t.id ? 'active' : ''}`}
                  onClick={() => setSelectedTicket(t)}
                >
                  <div className="flex justify-between items-start">
                    <span className="text-xs font-mono text-brand">{t.id}</span>
                    <span className={`badge ${t.priority?.toLowerCase()}`}>{t.priority}</span>
                  </div>
                  <h4 className="text-sm font-semibold my-1">{t.title}</h4>
                  <div className="flex justify-between items-center mt-2">
                    <span className="status-pill text-xs">
                      {t.status === 'Resolved' ? <CheckCircle2 size={12} className="text-success" /> : <Clock size={12} />}
                      {t.status}
                    </span>
                    <span className="text-xs text-muted">Est: {t.expected_resolution || '24h'}</span>
                  </div>

                  {/* Rating Section if Resolved */}
                  {t.status === 'Resolved' && !t.rating && (
                    <div className="mt-3 pt-3 border-t border-subtle flex items-center justify-between">
                      <span className="text-xs italic">Rate our service:</span>
                      <div className="flex gap-1">
                        {[1, 2, 3, 4, 5].map(star => (
                          <Star 
                            key={star} 
                            size={14} 
                            className="cursor-pointer hover:text-yellow-400" 
                            onClick={(e) => { e.stopPropagation(); handleRate(t.id, star); }}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomerDashboard;