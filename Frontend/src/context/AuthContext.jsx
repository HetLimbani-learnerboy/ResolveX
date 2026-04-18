import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  /**
   * Logout Function
   * Clears state and local storage. Wrapped in useCallback to ensure 
   * stability for our useEffect dependencies.
   */
  const logout = useCallback(() => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('resolvex_user');
    localStorage.removeItem('resolvex_token');
  }, []);

  /**
   * Initialization
   * Runs once on mount to check if the user is already logged in.
   */
  useEffect(() => {
    const initAuth = () => {
      try {
        const savedUser = localStorage.getItem('resolvex_user');
        const savedToken = localStorage.getItem('resolvex_token');

        if (savedUser && savedToken) {
          // Parse user data and set state
          const parsedUser = JSON.parse(savedUser);
          
          // Double check the role exists in the parsed object
          if (parsedUser && parsedUser.role) {
            setUser(parsedUser);
            setToken(savedToken);
          } else {
            // If data is malformed, clear it
            logout();
          }
        }
      } catch (err) {
        console.error("Auth initialization failed:", err);
        logout();
      } finally {
        // Essential: Stop the loading spinner
        setLoading(false);
      }
    };

    initAuth();
  }, [logout]);

  /**
   * Cross-Tab Synchronization
   * If the user logs out in another browser tab, log them out here too.
   */
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === 'resolvex_token' && !e.newValue) {
        logout();
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [logout]);

  /**
   * Login Function
   * @param {string} jwtToken - The token from the Python backend
   * @param {object} userData - The user object from the Python backend
   */
  const login = (jwtToken, userData) => {
    if (!jwtToken || !userData) {
      setError("Invalid login credentials received.");
      return;
    }

    setUser(userData);
    setToken(jwtToken);
    
    try {
      localStorage.setItem('resolvex_user', JSON.stringify(userData));
      localStorage.setItem('resolvex_token', jwtToken);
      setError('');
    } catch (err) {
      console.error("Failed to save auth session:", err);
      setError("Session persistence failed.");
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
      {/* CRITICAL: We don't render children while checking localStorage.
        This prevents unauthorized "flashes" of dashboard content.
      */}
      {!loading ? children : (
        <div className="flex items-center justify-center h-screen bg-slate-900 text-white">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
            <p className="text-lg font-medium">Initializing ResolveX...</p>
          </div>
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