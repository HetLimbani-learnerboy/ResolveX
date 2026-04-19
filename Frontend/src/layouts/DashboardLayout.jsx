import React, { useState, useRef, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

import {
  ShieldCheck,
  LayoutDashboard,
  Users,
  LogOut,
  Menu,
  Bell,
  Activity,
  AlertTriangle,
  SearchCheck,
  TrendingUp,
  MessageSquareText,
  MessageSquare,
  FileBarChart2,
  Sparkles,
  Zap,
  X
} from 'lucide-react';

import '../styles/DashboardLayout.css';

const DashboardLayout = ({ children }) => {
  const { logout } = useAuth();
  const location = useLocation();

  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [notifOpen, setNotifOpen] = useState(false);
  const notifRef = useRef(null);

  const user =
    JSON.parse(
      localStorage.getItem('resolvex_user')
    ) || null;

  const role = user?.role;

  // Close notification panel on outside click
  useEffect(() => {
    const handleClick = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setNotifOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const getNavItems = () => {
    let items = [];

    /* =====================================
       CUSTOMER
    ===================================== */
    if (role === 'customer') {
      items = [
        { path: '/dashboard', label: 'Overview', icon: LayoutDashboard },
        { path: '/dashboard#history', label: 'Complaint History', icon: Activity },
        { path: '/dashboard#track', label: 'Track Status', icon: SearchCheck },
        { path: '/dashboard#notifications', label: 'Updates', icon: Bell },
        { path: '/dashboard#feedback', label: 'Feedback', icon: MessageSquare }
      ];
    }

    /* =====================================
       OPERATIONS MANAGER
    ===================================== */
    else if (
      role === 'operations_manager'
    ) {
      items = [
        { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { path: '/audit-complaints', label: 'Audit Complaints', icon: SearchCheck },
        { path: '/misclassifications', label: 'Misclassifications', icon: AlertTriangle },
        { path: '/recurring-issues', label: 'Recurring Issues', icon: MessageSquareText },
        { path: '/resolution-review', label: 'Resolution Review', icon: FileBarChart2 }
      ];
    }
    /* =====================================
       QA TEAM
    ===================================== */
    else if (role === 'qa_team') {
      items = [
        { path: '/qa-dashboard', label: 'QA Dashboard', icon: LayoutDashboard },
        { path: '/misclassifications', label: 'Misclassifications', icon: AlertTriangle },
        { path: '/recurring-issues', label: 'Recurring Issues', icon: MessageSquareText },
        { path: '/qa-feedback', label: 'User Feedback', icon: MessageSquare }
      ];
    }
    /* =====================================
       SUPPORT EXECUTIVE
    ===================================== */
    else if (role === 'executive' || role === 'support') {
      items = [
        { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard }
      ];
    }

    /* =====================================
       ADMIN
    ===================================== */
    else if (role === 'admin') {
      items = [
        { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { path: '/admin/users', label: 'Manage Users', icon: Users }
      ];
    }



    /* =====================================
       DEFAULT
    ===================================== */
    else {
      items = [
        { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard }
      ];
    }

    return items;
  };

  const navItems = getNavItems();

  const getPageTitle = () => {
    const current = navItems.find(
      (item) => item.path === location.pathname + location.hash
    );
    if (current) return current.label;

    const pathOnly = navItems.find(
      (item) => item.path === location.pathname
    );
    return pathOnly?.label || 'Dashboard';
  };

  // System notification events
  const systemNotifs = [
    { id: 1, text: 'AI Classification Engine v3 deployed successfully', time: '2 min ago', type: 'success' },
    { id: 2, text: 'SLA monitoring active — 0 breaches detected', time: '15 min ago', type: 'info' },
    { id: 3, text: 'New complaint batch received from portal', time: '1 hour ago', type: 'alert' },
    { id: 4, text: 'Database backup completed', time: '3 hours ago', type: 'info' },
  ];

  return (
    <div className="dashboard-layout">

      {/* Sidebar */}
      <aside className={`sidebar ${sidebarOpen ? 'open' : 'closed'}`}>
        {/* Header */}
        <div className="sidebar-header">
          <div className="logo">
            <ShieldCheck className="brand-icon" size={24} />
            {sidebarOpen && <span>ResolveX</span>}
          </div>
          <button className="mobile-toggle" onClick={() => setSidebarOpen(!sidebarOpen)}>
            <Menu size={20} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="sidebar-nav">
          <div className="nav-section-title">
            {sidebarOpen ? 'Navigation' : '•••'}
          </div>
          <ul>
            {navItems.map((item) => {
              const isActive = item.path.includes('#')
                ? location.pathname + location.hash === item.path
                : location.pathname === item.path;

              return (
                <li key={item.path}>
                  <Link to={item.path} className={`nav-link ${isActive ? 'active' : ''}`}>
                    <item.icon size={20} />
                    {sidebarOpen && <span>{item.label}</span>}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Footer */}
        <div className="sidebar-footer">
          <div className="user-profile">
            <div className="avatar">
              {user?.full_name?.charAt(0)}
            </div>
            {sidebarOpen && (
              <div className="user-info">
                <div className="user-name">{user?.full_name}</div>
                <div className="user-role">{user?.role}</div>
              </div>
            )}
          </div>
          <button onClick={logout} className="logout-btn">
            <LogOut size={20} />
            {sidebarOpen && <span>Logout</span>}
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="main-content">

        {/* Topbar */}
        <header className="topbar">
          <div className="topbar-left">
            {!sidebarOpen && (
              <button className="desktop-toggle" onClick={() => setSidebarOpen(true)}>
                <Menu size={20} />
              </button>
            )}
            <h1 className="page-title">{getPageTitle()}</h1>
          </div>

          <div className="topbar-right" ref={notifRef} style={{ position: 'relative' }}>
            <button className="icon-btn" onClick={() => setNotifOpen(!notifOpen)} style={{ position: 'relative' }}>
              <Bell size={20} />
              <span className="notification-dot"></span>
            </button>

            {/* Notification Dropdown */}
            {notifOpen && (
              <div style={{
                position: 'absolute', top: '48px', right: '0',
                width: '380px', background: 'var(--bg-card)',
                border: '1px solid var(--border-subtle)',
                borderRadius: '12px', boxShadow: '0 20px 60px rgba(0,0,0,0.35)',
                zIndex: 999, overflow: 'hidden',
              }}>
                <div style={{
                  padding: '1rem 1.25rem', borderBottom: '1px solid var(--border-subtle)',
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                }}>
                  <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)' }}>Notifications</h4>
                  <button onClick={() => setNotifOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: '4px', display: 'flex' }}>
                    <X size={16} />
                  </button>
                </div>
                <div style={{ maxHeight: '340px', overflowY: 'auto' }}>
                  {systemNotifs.map((n) => (
                    <div key={n.id} style={{
                      padding: '0.85rem 1.25rem', borderBottom: '1px solid var(--border-subtle)',
                      display: 'flex', gap: '12px', alignItems: 'flex-start', cursor: 'default',
                      transition: 'background 0.15s'
                    }}
                    onMouseOver={e => e.currentTarget.style.background = 'var(--bg-secondary)'}
                    onMouseOut={e => e.currentTarget.style.background = 'transparent'}
                    >
                      <div style={{
                        width: '8px', height: '8px', borderRadius: '50%', marginTop: '6px', flexShrink: 0,
                        background: n.type === 'success' ? '#10b981' : n.type === 'alert' ? '#f59e0b' : '#3b82f6'
                      }}></div>
                      <div style={{ flex: 1 }}>
                        <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-primary)', lineHeight: 1.45 }}>{n.text}</p>
                        <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '4px', display: 'block' }}>{n.time}</span>
                      </div>
                    </div>
                  ))}
                </div>
                <div style={{ padding: '0.75rem', textAlign: 'center', borderTop: '1px solid var(--border-subtle)' }}>
                  <span style={{ fontSize: '0.8rem', color: 'var(--brand-primary)', fontWeight: 600, cursor: 'pointer' }}>View All Activity</span>
                </div>
              </div>
            )}
          </div>
        </header>

        {/* Content */}
        <div className="content-area animate-fade-in">
          {children}
        </div>

      </main>

    </div>
  );
};

export default DashboardLayout;