import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, Zap, BarChart3, ArrowRight, Sparkles, Clock, Users } from 'lucide-react';
import '../styles/LandingPage.css';

const LandingPage = () => {
  return (
    <div className="landing-page">
      {/* Fixed Navbar */}
      <header className="landing-nav">
        <div className="nav-inner">
          <div className="logo">
            <ShieldCheck className="brand-icon" size={28} />
            <span>ResolveX</span>
          </div>
          <nav className="nav-links">
            <a href="#features" className="nav-link-item">Features</a>
            <a href="#stats" className="nav-link-item">About</a>
            <Link to="/login" className="btn btn-secondary">Sign In</Link>
            <Link to="/login" className="btn btn-primary">Get Started</Link>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-container">
          <div className="hero-badge animate-fade-in">
            <Sparkles size={14} />
            <span>AI-Powered Resolution Engine</span>
          </div>

          <h1 className="hero-title animate-fade-in" style={{ animationDelay: '0.1s' }}>
            Resolve Complaints<br />
            <span className="text-gradient">At the Speed of Light.</span>
          </h1>

          <p className="hero-subtitle animate-fade-in" style={{ animationDelay: '0.2s' }}>
            Enterprise-grade classification, priority detection, and SLA tracking.
            Automate your entire customer support pipeline with AI.
          </p>

          <div className="hero-actions animate-fade-in" style={{ animationDelay: '0.3s' }}>
            <Link to="/login" className="btn btn-primary btn-lg">
              Enter Dashboard <ArrowRight size={18} />
            </Link>
            <a href="#features" className="btn btn-secondary btn-lg">
              Learn More
            </a>
          </div>
        </div>

        {/* Dashboard Preview */}
        <div className="hero-visual animate-fade-in" style={{ animationDelay: '0.5s' }}>
          <div className="browser-frame">
            <div className="browser-bar">
              <div className="browser-dots">
                <span className="dot dot-red"></span>
                <span className="dot dot-yellow"></span>
                <span className="dot dot-green"></span>
              </div>
              <div className="browser-url">
                <span>app.resolvex.ai/dashboard</span>
              </div>
            </div>
            <div className="browser-content">
              <div className="mock-sidebar">
                <div className="mock-sidebar-item active"></div>
                <div className="mock-sidebar-item"></div>
                <div className="mock-sidebar-item"></div>
                <div className="mock-sidebar-item"></div>
              </div>
              <div className="mock-main">
                <div className="mock-stats">
                  <div className="mock-stat-card">
                    <div className="mock-stat-number">2,847</div>
                    <div className="mock-stat-label">Total Tickets</div>
                  </div>
                  <div className="mock-stat-card">
                    <div className="mock-stat-number" style={{ color: 'var(--status-low-text)' }}>94.2%</div>
                    <div className="mock-stat-label">Resolution Rate</div>
                  </div>
                  <div className="mock-stat-card">
                    <div className="mock-stat-number" style={{ color: 'var(--brand-primary)' }}>1.2h</div>
                    <div className="mock-stat-label">Avg Response</div>
                  </div>
                </div>
                <div className="mock-chart">
                  <div className="mock-chart-bar" style={{ height: '40%' }}></div>
                  <div className="mock-chart-bar" style={{ height: '65%' }}></div>
                  <div className="mock-chart-bar" style={{ height: '50%' }}></div>
                  <div className="mock-chart-bar" style={{ height: '80%' }}></div>
                  <div className="mock-chart-bar" style={{ height: '70%' }}></div>
                  <div className="mock-chart-bar" style={{ height: '90%' }}></div>
                  <div className="mock-chart-bar" style={{ height: '75%' }}></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Strip */}
      <section className="stats-strip" id="stats">
        <div className="stats-inner">
          <div className="stat-item">
            <div className="stat-number">10x</div>
            <div className="stat-text">Faster Resolution</div>
          </div>
          <div className="stat-divider"></div>
          <div className="stat-item">
            <div className="stat-number">94%</div>
            <div className="stat-text">Accuracy Rate</div>
          </div>
          <div className="stat-divider"></div>
          <div className="stat-item">
            <div className="stat-number">50K+</div>
            <div className="stat-text">Tickets Processed</div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="features-section" id="features">
        <div className="features-inner">
          <div className="features-header">
            <h2>Everything you need to<br /><span className="text-gradient">resolve at scale.</span></h2>
            <p>Powerful AI tools designed for modern support teams.</p>
          </div>
          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon" style={{ background: 'linear-gradient(135deg, #2563eb, #3b82f6)' }}>
                <Zap size={22} color="white" />
              </div>
              <h3>AI Classification</h3>
              <p>Automatically categorize and route incoming issues with zero manual effort.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon" style={{ background: 'linear-gradient(135deg, #6366f1, #818cf8)' }}>
                <Clock size={22} color="white" />
              </div>
              <h3>SLA Tracking</h3>
              <p>Never miss a deadline with automatic escalations and real-time countdowns.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon" style={{ background: 'linear-gradient(135deg, #059669, #34d399)' }}>
                <BarChart3 size={22} color="white" />
              </div>
              <h3>Advanced Analytics</h3>
              <p>Deep insights into complaint trends, agent performance, and root causes.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon" style={{ background: 'linear-gradient(135deg, #d97706, #fbbf24)' }}>
                <Users size={22} color="white" />
              </div>
              <h3>Role-Based Access</h3>
              <p>Tailored dashboards for customers, support, QA, ops managers, and admins.</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta-section">
        <div className="cta-inner">
          <h2>Ready to transform your support?</h2>
          <p>Start resolving complaints faster with AI-powered intelligence.</p>
          <Link to="/login" className="btn btn-primary btn-lg">
            Get Started Free <ArrowRight size={18} />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="landing-footer">
        <p>&copy; 2026 ResolveX. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default LandingPage;
