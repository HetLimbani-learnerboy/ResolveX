import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

const MOCK_USERS = [
  { id: 1, email: 'admin@resolvex.com', password: 'password', role: 'admin', name: 'Super Admin' },
  { id: 2, email: 'customer@resolvex.com', password: 'password', role: 'customer', name: 'Acme Corp' },
  { id: 3, email: 'support@resolvex.com', password: 'password', role: 'support', name: 'Alex Support' },
  { id: 4, email: 'qa@resolvex.com', password: 'password', role: 'qa', name: 'Sam Quality' },
  { id: 5, email: 'manager@resolvex.com', password: 'password', role: 'manager', name: 'Morgan Ops' },
];

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Check localStorage for logged in user session
    const savedUser = localStorage.getItem('resolvex_user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    setLoading(true);
    setError(null);
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const foundUser = MOCK_USERS.find(u => u.email === email && u.password === password);
        if (foundUser) {
          const { password: _, ...userWithoutPassword } = foundUser;
          setUser(userWithoutPassword);
          localStorage.setItem('resolvex_user', JSON.stringify(userWithoutPassword));
          setLoading(false);
          resolve(userWithoutPassword);
        } else {
          setLoading(false);
          setError('Invalid email or password');
          reject(new Error('Invalid credentials'));
        }
      }, 800); // Simulate network latency
    });
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('resolvex_user');
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading, error, setError }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
