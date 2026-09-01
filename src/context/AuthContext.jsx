/**
 * VIBRA - Auth Context
 * Module: Authentication
 * 
 * Provides global authentication state across the app.
 * Isolated - does not affect other modules.
 */

import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import * as authService from '../services/authService';

// Create context
const AuthContext = createContext(null);

/**
 * Auth Provider component
 * Wraps the app to provide auth state
 */
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [error, setError] = useState(null);
  const [requiresPin, setRequiresPin] = useState(false);

  // Load cached user on mount
  useEffect(() => {
    const loadCachedUser = () => {
      try {
        const cached = authService.getCachedUser();
        const loggedIn = authService.isLoggedIn();
        
        if (cached && loggedIn) {
          setUser(cached);
          setIsAuthenticated(true);
        }
      } catch (err) {
        console.warn('Failed to load cached user:', err);
      } finally {
        setIsLoading(false);
      }
    };

    loadCachedUser();
  }, []);

  /**
   * Login with phone number
   * @param {string} phone - User's phone number
   * @param {string} pin - Optional PIN
   */
  const loginWithOpay = useCallback(async (phone, pin = null) => {
    setError(null);
    setIsLoading(true);
    setRequiresPin(false);
    
    try {
      const result = await authService.loginWithOpay(phone, pin);
      if (result.success) {
        if (result.user) {
          if (result.user.hasWithdrawn === undefined) {
            result.user.hasWithdrawn = false;
          }
          setUser(result.user);
          setIsAuthenticated(true);
        }
        return { 
          success: true, 
          user: result.user,
          requiresPin: result.requiresPin || false,
        };
      }
      
      // Check if PIN is required
      if (result.requiresPin) {
        setRequiresPin(true);
        return { 
          success: false, 
          requiresPin: true, 
          error: 'PIN required' 
        };
      }
      
      return { success: false, error: result.error || 'Login failed' };
    } catch (err) {
      setError(err.message || 'Login failed');
      return { success: false, error: err.message };
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Set PIN for user
   * @param {string} phone - User's phone number
   * @param {string} pin - 4-digit PIN
   */
  const setPin = useCallback(async (phone, pin) => {
    try {
      const result = await authService.setPin(phone, pin);
      return result;
    } catch (err) {
      return { success: false, error: err.message };
    }
  }, []);

  /**
   * Logout user
   */
  const logout = useCallback(() => {
    authService.logout();
    setUser(null);
    setIsAuthenticated(false);
    setError(null);
    setRequiresPin(false);
  }, []);

  /**
   * Update current user data
   */
  const updateUser = useCallback((updates) => {
    const updated = authService.updateCachedUser(updates);
    if (updated) {
      setUser(updated);
    }
    return updated;
  }, []);

  /**
   * Check Opay availability (for withdrawal only)
   */
  const checkOpayStatus = useCallback(async () => {
    return await authService.checkOpayStatus();
  }, []);

  /**
   * Mark user as having withdrawn (call this after successful withdrawal)
   */
  const markHasWithdrawn = useCallback(async () => {
    if (!user) return;
    const updated = authService.updateCachedUser({ hasWithdrawn: true });
    if (updated) {
      setUser(updated);
    }
    return updated;
  }, [user]);

  // Context value
  const value = {
    user,
    isAuthenticated,
    isLoading,
    error,
    requiresPin,
    loginWithOpay,
    setPin,
    logout,
    updateUser,
    checkOpayStatus,
    markHasWithdrawn,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

/**
 * Custom hook to use auth context
 * @returns {Object} Auth context value
 */
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;