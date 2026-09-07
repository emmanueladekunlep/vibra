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
  const [pendingPhone, setPendingPhone] = useState(null);
  const [pendingUserData, setPendingUserData] = useState(null);
  const [needsPinSetup, setNeedsPinSetup] = useState(false);

  // Load cached user on mount
  useEffect(() => {
    const loadCachedUser = () => {
      try {
        const cached = authService.getCachedUser();
        const loggedIn = authService.isLoggedIn();
        
        if (cached && loggedIn) {
          // Ensure isFounder is properly set from cached data
          if (cached.isFounder === undefined) cached.isFounder = false;
          // Ensure userId is used as the primary identifier
          if (!cached.userId && cached.id) {
            cached.userId = cached.id;
          }
          // Ensure pinEnabled is boolean
          if (cached.pinEnabled === undefined) cached.pinEnabled = false;
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
    setNeedsPinSetup(false);
    setPendingUserData(null);
    
    try {
      const result = await authService.loginWithOpay(phone, pin);
      
      if (result.success) {
        const userData = result.user;
        if (userData) {
          // Ensure isFounder is set from database
          if (userData.isFounder === undefined) userData.isFounder = false;
          // Ensure userId is set
          if (!userData.userId && userData.id) {
            userData.userId = userData.id;
          }
          // Ensure pinEnabled is boolean
          if (userData.pinEnabled === undefined) userData.pinEnabled = false;
          
          // Check if user needs to set up PIN (new user - pinEnabled is false and no pin provided)
          if (!userData.pinEnabled && !pin) {
            setPendingPhone(phone);
            setPendingUserData(userData);
            setNeedsPinSetup(true);
            setIsLoading(false);
            return {
              success: true,
              requiresPin: false,
              needsPinSetup: true,
              user: userData,
            };
          }
          
          // Check if PIN is enabled and user needs to enter PIN
          if (userData.pinEnabled && !pin) {
            setPendingPhone(phone);
            setPendingUserData(userData);
            setRequiresPin(true);
            setIsLoading(false);
            return { 
              success: true, 
              requiresPin: true,
              needsPinSetup: false,
              user: userData,
            };
          }
          
          // Full authentication (PIN was provided and verified)
          if (userData.hasWithdrawn === undefined) userData.hasWithdrawn = false;
          if (userData.isFounder === undefined) userData.isFounder = false;
          setUser(userData);
          setIsAuthenticated(true);
          setPendingPhone(null);
          setPendingUserData(null);
          setRequiresPin(false);
          setNeedsPinSetup(false);
          return { 
            success: true, 
            user: userData,
            requiresPin: false,
            needsPinSetup: false,
          };
        } else {
          return { success: false, error: 'No user data' };
        }
      } else {
        return { success: false, error: result.error || 'Login failed' };
      }
    } catch (err) {
      setError(err.message || 'Login failed');
      return { success: false, error: err.message };
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Set PIN for user
   * @param {string} userId - User ID
   * @param {string} pin - 4-digit PIN
   */
  const setPin = useCallback(async (userId, pin) => {
    try {
      const result = await authService.setPin(userId, pin);
      if (result.success && result.user) {
        // Update pending user data with pinEnabled
        if (pendingUserData) {
          const updated = { ...pendingUserData, pinEnabled: true };
          setPendingUserData(updated);
        }
      }
      return result;
    } catch (err) {
      return { success: false, error: err.message };
    }
  }, [pendingUserData]);

  /**
   * Complete PIN setup and authenticate user
   */
  const completePinSetup = useCallback(async (userData) => {
    if (userData) {
      if (userData.isFounder === undefined) userData.isFounder = false;
      if (!userData.userId && userData.id) {
        userData.userId = userData.id;
      }
      if (userData.pinEnabled === undefined) userData.pinEnabled = true;
      setUser(userData);
      setIsAuthenticated(true);
      setPendingPhone(null);
      setPendingUserData(null);
      setRequiresPin(false);
      setNeedsPinSetup(false);
      return { success: true, user: userData };
    }
    return { success: false, error: 'No user data' };
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
    setNeedsPinSetup(false);
    setPendingPhone(null);
    setPendingUserData(null);
  }, []);

  /**
   * Update current user data
   */
  const updateUser = useCallback((updates) => {
    const updated = authService.updateCachedUser(updates);
    if (updated) {
      if (updated.isFounder === undefined) updated.isFounder = false;
      if (!updated.userId && updated.id) {
        updated.userId = updated.id;
      }
      if (updated.pinEnabled === undefined) updated.pinEnabled = false;
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
   * Mark user as having withdrawn
   */
  const markHasWithdrawn = useCallback(async () => {
    if (!user) return null;
    const updated = authService.updateCachedUser({ hasWithdrawn: true });
    if (updated) {
      if (updated.isFounder === undefined) updated.isFounder = false;
      if (!updated.userId && updated.id) {
        updated.userId = updated.id;
      }
      setUser(updated);
    }
    return updated;
  }, [user]);

  const value = {
    user,
    isAuthenticated,
    isLoading,
    error,
    requiresPin,
    needsPinSetup,
    pendingPhone,
    pendingUserData,
    loginWithOpay,
    setPin,
    completePinSetup,
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

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;