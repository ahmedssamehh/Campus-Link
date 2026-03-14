import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from '../api/axios';

// Create Auth Context
const AuthContext = createContext(null);

// AuthProvider component
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Check for stored user in localStorage on mount
  useEffect(() => {
    const storedUser = localStorage.getItem('campusLinkUser');
    const storedToken = localStorage.getItem('campusLinkToken');
    
    if (storedUser && storedToken) {
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  // Register function
  const register = async (userData) => {
    try {
      console.log('🔵 Registering user with payload:', userData);
      const response = await axios.post('/auth/register', userData);
      console.log('✅ Registration response:', response.data);
      
      if (response.data.success) {
        return { success: true, message: response.data.message };
      }
      
      return { success: false, message: response.data.message };
    } catch (error) {
      console.error('❌ Registration error:', error.response?.data || error.message);
      return {
        success: false,
        message: error.response?.data?.message || error.message || 'Registration failed'
      };
    }
  };

  // Login function
  const login = async (credentials) => {
    try {
      const response = await axios.post('/auth/login', credentials);
      
      if (response.data.success && response.data.token) {
        const { token, user: userData } = response.data;
        
        // Save token and user to localStorage
        localStorage.setItem('campusLinkToken', token);
        localStorage.setItem('campusLinkUser', JSON.stringify(userData));
        
        // Update state
        setUser(userData);
        
        return { success: true, message: 'Login successful' };
      }
      
      return { success: false, message: response.data.message };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Login failed'
      };
    }
  };

  // Logout function
  const logout = () => {
    setUser(null);
    localStorage.removeItem('campusLinkToken');
    localStorage.removeItem('campusLinkUser');
  };

  const updateUser = (userData) => {
    setUser(userData);
    localStorage.setItem('campusLinkUser', JSON.stringify(userData));
  };

  // Get current user from backend
  const getCurrentUser = async () => {
    try {
      const response = await axios.get('/auth/me');
      if (response.data.success) {
        const userData = response.data.user;
        setUser(userData);
        localStorage.setItem('campusLinkUser', JSON.stringify(userData));
        return userData;
      }
    } catch (error) {
      console.error('Failed to get current user:', error);
      logout();
    }
  };

  const value = {
    user,
    updateUser,
    login,
    register,
    logout,
    getCurrentUser,
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
