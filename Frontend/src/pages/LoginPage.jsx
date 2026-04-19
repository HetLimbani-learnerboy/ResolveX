import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ShieldCheck, Loader2, Eye, EyeOff } from 'lucide-react';
import '../styles/LoginPage.css';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

const LoginPage = () => {
  const navigate = useNavigate();
  const { login, error, setError, user } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // If user is already logged in, move them to their dashboard immediately
  useEffect(() => {
    if (user) {
      redirectByRole(user.role);
    }
  }, [user]);

  const togglePassword = () => setShowPassword(!showPassword);

  const redirectByRole = (role) => {
    // These keys must match the "role" string from your Postman output
    const routes = {
      admin: '/admin-dashboard',
      customer: '/customer-dashboard',
      executive: '/executive-dashboard', // Matches your Postman value
      qa_team: '/qa-dashboard',
      operations_manager: '/manager-dashboard',
    };
    navigate(routes[role] || '/dashboard');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      const response = await fetch(`${BACKEND_URL.replace(/\/$/, '')}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Login failed');
      }

      // Based on your Postman: data.token and data.user are the correct keys
      login(data.token, data.user);

      // Navigate based on the role in the response
      redirectByRole(data.user.role);

    } catch (err) {
      setError(err.message === 'Failed to fetch'
        ? 'Backend server is offline'
        : err.message
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-container glass-panel animate-fade-in">
        <div className="login-header">
          <ShieldCheck className="brand-icon" size={40} />
          <h2>Welcome Back</h2>
          <p>Access the ResolveX Portal</p>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          {error && <div className="error-message">{error}</div>}

          <div className="form-group">
            <label>Email Address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="name@company.com"
            />
          </div>

          <div className="form-group">
            <label>Password</label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="••••••••"
                style={{ width: '100%', paddingRight: '45px' }}
              />
              <button
                type="button"
                onClick={togglePassword}
                style={{
                  position: 'absolute', right: '14px', top: '50%',
                  transform: 'translateY(-50%)', background: 'none',
                  border: 'none', cursor: 'pointer', color: '#888'
                }}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <button type="submit" className="btn btn-primary btn-full" disabled={isSubmitting}>
            {isSubmitting ? <Loader2 className="animate-spin" size={20} /> : 'Sign In'}
          </button>
        </form>

        <button
          className="btn btn-secondary btn-full"
          style={{ marginTop: '1rem' }}
          onClick={() => navigate('/')}
        >
          Back to Home
        </button>
      </div>
    </div>
  );
};

export default LoginPage;