import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  ShieldCheck, 
  LayoutDashboard, 
  Users, 
  LogOut,
  Menu,
  Bell,
  PlusCircle,
  Activity,
  MessageSquare
} from 'lucide-react';
import '../styles/DashboardLayout.css';

const DashboardLayout = ({ children }) => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Navigation logic based on roles
  const getNavItems = () => {
    let items = [];
    
    if (user?.role === 'customer') {
      items = [
        { path: '/dashboard', label: 'Overview', icon: LayoutDashboard },
        { path: '/dashboard#history', label: 'Complaint History', icon: LayoutDashboard }, // using an appropriate icon
        { path: '/dashboard#track', label: 'Track Status', icon: Activity },
        { path: '/dashboard#notifications', label: 'Updates', icon: Bell },
        { path: '/dashboard#feedback', label: 'Feedback', icon: MessageSquare }
      ];
    } else if (user?.role === 'admin') {
      items = [
        { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { path: '/admin/users', label: 'Manage Users', icon: Users }
      ];
    } else {
      items = [
        { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard }
      ];
    }

    return items;
  };

  const navItems = getNavItems();

  return (
    <div className="dashboard-layout">
      {/* Sidebar */}
      <aside className={`sidebar ${sidebarOpen ? 'open' : 'closed'}`}>
        <div className="sidebar-header">
          <div className="logo flex items-center gap-2 font-bold text-xl">
            <ShieldCheck className="brand-icon" size={24} />
            {sidebarOpen && <span>ResolveX</span>}
          </div>
          <button className="mobile-toggle" onClick={() => setSidebarOpen(!sidebarOpen)}>
            <Menu size={20} />
          </button>
        </div>

        <nav className="sidebar-nav">
          <ul>
             <div className="nav-section-title">{sidebarOpen ? 'Overview' : '•••'}</div>
            {navItems.map((item) => {
              const isActive = item.path.includes('#') 
                ? location.pathname + location.hash === item.path
                : location.pathname === item.path && location.hash === '';

              return (
                <li key={item.path}>
                  <Link 
                    to={item.path} 
                    className={`nav-link ${isActive ? 'active' : ''}`}
                  >
                    <item.icon size={20} />
                    {sidebarOpen && <span>{item.label}</span>}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="sidebar-footer">
          <div className="user-profile">
            <div className="avatar">{user?.name?.charAt(0)}</div>
            {sidebarOpen && (
              <div className="user-info">
                <div className="user-name">{user?.name}</div>
                <div className="user-role">{user?.role}</div>
              </div>
            )}
          </div>
          <button onClick={logout} className="logout-btn" title="Logout">
            <LogOut size={20} />
            {sidebarOpen && <span>Logout</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="main-content">
        {/* Topbar */}
        <header className="topbar">
          <div className="topbar-left">
            {!sidebarOpen && (
              <button className="desktop-toggle" onClick={() => setSidebarOpen(true)}>
                <Menu size={20} />
              </button>
            )}
            <h1 className="page-title">
               {navItems.find(i => i.path === location.pathname)?.label || 'Dashboard'}
            </h1>
          </div>
          <div className="topbar-right">
            <button className="icon-btn">
              <Bell size={20} />
              <span className="notification-dot"></span>
            </button>
          </div>
        </header>

        {/* Dynamic Content */}
        <div className="content-area animate-fade-in">
          {children}
        </div>
      </main>
    </div>
  );
};

export default DashboardLayout;
