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
  Activity,
  AlertTriangle,
  SearchCheck,
  TrendingUp,
  MessageSquareText,
  MessageSquare,
  FileBarChart2
} from 'lucide-react';

import '../styles/DashboardLayout.css';

const DashboardLayout = ({ children }) => {
  const { logout } = useAuth();
  const location = useLocation();

  const [sidebarOpen, setSidebarOpen] = useState(true);

  const user =
    JSON.parse(
      localStorage.getItem('resolvex_user')
    ) || null;

  const role = user?.role;

  const getNavItems = () => {
    let items = [];

    /* =====================================
       CUSTOMER
    ===================================== */
    if (role === 'customer') {
      items = [
        {
          path: '/dashboard',
          label: 'Overview',
          icon: LayoutDashboard
        },
        {
          path: '/dashboard#history',
          label: 'Complaint History',
          icon: Activity
        },
        {
          path: '/dashboard#track',
          label: 'Track Status',
          icon: SearchCheck
        },
        {
          path: '/dashboard#notifications',
          label: 'Updates',
          icon: Bell
        },
        {
          path: '/dashboard#feedback',
          label: 'Feedback',
          icon: MessageSquare
        }
      ];
    }

    /* =====================================
       OPERATIONS MANAGER
    ===================================== */
    else if (
      role === 'operations_manager'
    ) {
      items = [
        {
          path: '/dashboard',
          label: 'Dashboard',
          icon: LayoutDashboard
        },
        {
          path: '/audit-complaints',
          label: 'Audit Complaints',
          icon: SearchCheck
        },
        {
          path: '/misclassifications',
          label: 'Misclassifications',
          icon: AlertTriangle
        },
        {
          path: '/recurring-issues',
          label: 'Recurring Issues',
          icon: MessageSquareText
        },
        {
          path: '/resolution-review',
          label: 'Resolution Review',
          icon: FileBarChart2
        }
      ];
    }

    /* =====================================
       ADMIN
    ===================================== */
    else if (role === 'admin') {
      items = [
        {
          path: '/dashboard',
          label: 'Dashboard',
          icon: LayoutDashboard
        },
        {
          path: '/admin/users',
          label: 'Manage Users',
          icon: Users
        }
      ];
    }

    /* =====================================
       DEFAULT
    ===================================== */
    else {
      items = [
        {
          path: '/dashboard',
          label: 'Dashboard',
          icon: LayoutDashboard
        }
      ];
    }

    return items;
  };

  const navItems = getNavItems();

  const getPageTitle = () => {
    const current = navItems.find(
      (item) =>
        item.path ===
        location.pathname +
          location.hash
    );

    if (current) return current.label;

    const pathOnly =
      navItems.find(
        (item) =>
          item.path ===
          location.pathname
      );

    return (
      pathOnly?.label ||
      'Dashboard'
    );
  };

  return (
    <div className="dashboard-layout">

      {/* Sidebar */}
      <aside
        className={`sidebar ${
          sidebarOpen
            ? 'open'
            : 'closed'
        }`}
      >
        {/* Header */}
        <div className="sidebar-header">

          <div className="logo">
            <ShieldCheck
              className="brand-icon"
              size={24}
            />

            {sidebarOpen && (
              <span>
                ResolveX
              </span>
            )}
          </div>

          <button
            className="mobile-toggle"
            onClick={() =>
              setSidebarOpen(
                !sidebarOpen
              )
            }
          >
            <Menu size={20} />
          </button>

        </div>

        {/* Navigation */}
        <nav className="sidebar-nav">

          <div className="nav-section-title">
            {sidebarOpen
              ? 'Navigation'
              : '•••'}
          </div>

          <ul>
            {navItems.map(
              (item) => {
                const isActive =
                  item.path.includes(
                    '#'
                  )
                    ? location.pathname +
                        location.hash ===
                      item.path
                    : location.pathname ===
                      item.path;

                return (
                  <li
                    key={
                      item.path
                    }
                  >
                    <Link
                      to={
                        item.path
                      }
                      className={`nav-link ${
                        isActive
                          ? 'active'
                          : ''
                      }`}
                    >
                      <item.icon
                        size={
                          20
                        }
                      />

                      {sidebarOpen && (
                        <span>
                          {
                            item.label
                          }
                        </span>
                      )}
                    </Link>
                  </li>
                );
              }
            )}
          </ul>

        </nav>

        {/* Footer */}
        <div className="sidebar-footer">

          <div className="user-profile">

            <div className="avatar">
              {user?.full_name?.charAt(
                0
              )}
            </div>

            {sidebarOpen && (
              <div className="user-info">
                <div className="user-name">
                  {
                    user?.full_name
                  }
                </div>

                <div className="user-role">
                  {user?.role}
                </div>
              </div>
            )}

          </div>

          <button
            onClick={logout}
            className="logout-btn"
          >
            <LogOut size={20} />

            {sidebarOpen && (
              <span>
                Logout
              </span>
            )}
          </button>

        </div>
      </aside>

      {/* Main */}
      <main className="main-content">

        {/* Topbar */}
        <header className="topbar">

          <div className="topbar-left">

            {!sidebarOpen && (
              <button
                className="desktop-toggle"
                onClick={() =>
                  setSidebarOpen(
                    true
                  )
                }
              >
                <Menu size={20} />
              </button>
            )}

            <h1 className="page-title">
              {getPageTitle()}
            </h1>

          </div>

          <div className="topbar-right">

            <button className="icon-btn">
              <Bell size={20} />
              <span className="notification-dot"></span>
            </button>

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