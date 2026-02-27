import React, { createContext, useContext, useState, useEffect } from 'react';

// Create Auth Context
const AuthContext = createContext(null);

// AuthProvider component
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Check for stored user in localStorage on mount
  useEffect(() => {
    const storedUser = localStorage.getItem('campusLinkUser');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  // Login function
  const login = (userData) => {
    const userObj = {
      id: Date.now(),
      name: userData.name || 'User',
      email: userData.email,
      loginTime: new Date().toISOString()
    };
    setUser(userObj);
    localStorage.setItem('campusLinkUser', JSON.stringify(userObj));
  };

  // Logout function
  const logout = () => {
    setUser(null);
    localStorage.removeItem('campusLinkUser');
  };

  const value = {
    user,
    login,
    logout,
    isAuthenticated: !!user,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to use Auth Context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
