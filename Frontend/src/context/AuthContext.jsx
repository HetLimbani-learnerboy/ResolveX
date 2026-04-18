import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // 1. IMPROVEMENT: Wrap logout in useCallback to prevent unnecessary re-renders
  // and allow it to be used as a dependency in other hooks.
  const logout = useCallback(() => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('resolvex_user');
    localStorage.removeItem('resolvex_token');
  }, []);

  // 2. IMPROVEMENT: Initialization logic
  useEffect(() => {
    const initAuth = () => {
      try {
        const savedUser = localStorage.getItem('resolvex_user');
        const savedToken = localStorage.getItem('resolvex_token');

        if (savedUser && savedToken) {
          // Optional: Add a JWT expiration check here if you want to be strict
          setUser(JSON.parse(savedUser));
          setToken(savedToken);
        }
      } catch (err) {
        console.error("Auth initialization failed:", err);
        logout(); // Clear potentially corrupted data
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, [logout]);

  // 3. IMPROVEMENT: Cross-tab logout synchronization
  // If a user logs out in one tab, they should be logged out in all tabs.
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === 'resolvex_token' && !e.newValue) {
        logout();
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [logout]);

  const login = (jwtToken, userData) => {
    if (!jwtToken || !userData) {
      setError("Invalid login data received");
      return;
    }

    setUser(userData);
    setToken(jwtToken);
    
    try {
      localStorage.setItem('resolvex_user', JSON.stringify(userData));
      localStorage.setItem('resolvex_token', jwtToken);
      setError('');
    } catch (err) {
      console.error("Failed to save auth data:", err);
      setError("Failed to persist login session");
    }
  };

  return (
    <AuthContext.Provider 
      value={{ 
        user, 
        token, 
        login, 
        logout, 
        loading, 
        error, 
        setError 
      }}
    >
      {/* Only render children if not loading. 
        This prevents protected routes from flashing 
        before we know if the user is logged in.
      */}
      {!loading ? children : (
        <div className="loading-screen">
          {/* You can replace this with a real spinner component */}
          <p>Loading ResolveX...</p>
        </div>
      )}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};