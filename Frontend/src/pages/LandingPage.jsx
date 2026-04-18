import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, Zap, BarChart3, ArrowRight } from 'lucide-react';
import '../styles/LandingPage.css';

const LandingPage = () => {
  return (
    <div className="landing-page">
      <header className="landing-nav container">
        <div className="logo cursor-pointer font-bold text-xl flex items-center gap-2">
          <ShieldCheck className="brand-icon" size={28} />
          <span>ResolveX</span>
        </div>
        <nav>
          <Link to="/login" className="btn btn-secondary">Sign In</Link>
        </nav>
      </header>

      <main>
        <section className="hero container text-center">
          <div className="badge animate-fade-in">✨ AI-Powered Resolution Engine</div>
          <h1 className="hero-title animate-fade-in" style={{ animationDelay: '0.1s' }}>
            Resolve Complaints <br/>
            <span className="text-gradient">At the Speed of Light.</span>
          </h1>
          <p className="hero-subtitle animate-fade-in" style={{ animationDelay: '0.2s' }}>
            Enterprise-grade classification, priority detection, and SLA tracking.<br/>
            Automate your customer support pipeline with AI.
          </p>
          <div className="hero-cta animate-fade-in" style={{ animationDelay: '0.3s' }}>
            <Link to="/login" className="btn btn-primary btn-lg flex items-center gap-2 justify-center">
              Enter Dashboard <ArrowRight size={20} />
            </Link>
          </div>
          
          <div className="hero-image-wrapper animate-fade-in" style={{ animationDelay: '0.5s' }}>
            <div className="hero-image glass-panel">
               {/* Abstract visual representing dashboard */}
               <div className="dashboard-mockup">
                 <div className="mockup-header">
                   <div className="mockup-dots">
                     <span className="dot red"></span>
                     <span className="dot yellow"></span>
                     <span className="dot green"></span>
                   </div>
                 </div>
                 <div className="mockup-body">
                   <div className="mockup-sidebar"></div>
                   <div className="mockup-content">
                     <div className="mockup-card"></div>
                     <div className="mockup-card"></div>
                     <div className="mockup-card"></div>
                     <div className="mockup-chart"></div>
                   </div>
                 </div>
               </div>
            </div>
          </div>
        </section>

        <section className="features container">
          <div className="features-grid grid grid-cols-3 gap-6">
            <div className="feature-card glass-panel">
              <div className="feature-icon bg-brand-primary">
                <Zap size={24} color="white" />
              </div>
              <h3>AI Classification</h3>
              <p>Automatically categorize incoming issues with zero human routing needed.</p>
            </div>
            <div className="feature-card glass-panel">
              <div className="feature-icon bg-brand-accent">
                <ShieldCheck size={24} color="white" />
              </div>
              <h3>SLA Tracking</h3>
              <p>Never miss a deadline. Automatic escalations and real-time SLA countdowns.</p>
            </div>
            <div className="feature-card glass-panel">
              <div className="feature-icon" style={{ backgroundColor: '#10b981' }}>
                <BarChart3 size={24} color="white" />
              </div>
              <h3>Advanced Analytics</h3>
              <p>Gain insights into complaint trends, agent performance, and root causes.</p>
            </div>
          </div>
        </section>
      </main>
      
      <footer className="landing-footer container">
        <p>&copy; 2026 ResolveX Enterprise SaaS. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default LandingPage;
