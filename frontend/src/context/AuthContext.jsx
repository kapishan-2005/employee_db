import { createContext, useContext, useState, useEffect } from 'react';
import { api, endpoints } from '../services/api';

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(() => localStorage.getItem('token'));

  // Check if user is authenticated
  const isAuthenticated = !!token && !!currentUser;

  // Load user from localStorage on mount
  useEffect(() => {
    const loadUser = async () => {
      const storedToken = localStorage.getItem('token');
      const storedUser = localStorage.getItem('user');

      if (storedToken && storedUser) {
        try {
          setToken(storedToken);
          setCurrentUser(JSON.parse(storedUser));
        } catch (error) {
          console.error('Failed to load user from localStorage:', error);
          localStorage.removeItem('token');
          localStorage.removeItem('user');
        }
      }
      setLoading(false);
    };

    loadUser();
  }, []);

  /**
   * Login user
   */
  const login = async (username, password) => {
    try {
      console.log('[AuthContext] Login attempt:', { username });
      
      const response = await api.post(endpoints.auth.login, {
        username,
        password,
      });

      console.log('[AuthContext] Login response:', response);

      // Backend returns: { message, user, token }
      if (response.token && response.user) {
        // Save token and user to localStorage
        localStorage.setItem('token', response.token);
        localStorage.setItem('user', JSON.stringify(response.user));

        console.log('[AuthContext] Token saved:', response.token);
        console.log('[AuthContext] User saved:', response.user);

        // Update state
        setToken(response.token);
        setCurrentUser(response.user);

        return { success: true, user: response.user };
      } else {
        throw new Error(response.error || 'Login failed');
      }
    } catch (error) {
      console.error('[AuthContext] Login error:', error);
      throw error;
    }
  };

  /**
   * Sign up a new company — always creates a new organization + CEO account,
   * regardless of how many other companies already exist in the system.
   */
  const signup = async ({ username, email, password }) => {
    try {
      const response = await api.post(endpoints.auth.signupCompany, {
        username,
        email,
        password,
      });

      if (response.token && response.user) {
        localStorage.setItem('token', response.token);
        localStorage.setItem('user', JSON.stringify(response.user));
        setToken(response.token);
        setCurrentUser(response.user);
        return { success: true, user: response.user };
      } else {
        throw new Error(response.error || 'Sign up failed');
      }
    } catch (error) {
      console.error('[AuthContext] Signup error:', error);
      throw error;
    }
  };

  /**
   * Logout user
   */
  const logout = () => {
    // Clear localStorage
    localStorage.removeItem('token');
    localStorage.removeItem('user');

    // Clear state
    setToken(null);
    setCurrentUser(null);
  };

  /**
   * Update current user
   */
  const updateUser = (userData) => {
    setCurrentUser(userData);
    localStorage.setItem('user', JSON.stringify(userData));
  };

  const value = {
    currentUser,
    token,
    isAuthenticated,
    loading,
    login,
    signup,
    logout,
    updateUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthContext;
