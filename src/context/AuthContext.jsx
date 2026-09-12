/**
 * VIBRA - Auth Context
 * Module: Authentication
 * 
 * Provides global authentication state across the app.
 * Auto-refreshes user data from server every 30s so points stay live.
 */

import React, { createContext, useState, useContext, useEffect, useCallback, useRef } from 'react';
import * as authService from '../services/authService';

const API_URL = import.meta.env.VITE_API_URL || 'https://api.vibra.ng/api';

// Create context
const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [error, setError] = useState(null);
  const [requiresPin, setRequiresPin] = useState(false);
  const [pendingPhone, setPendingPhone] = useState(null);
  const [pendingUserData, setPendingUserData] = useState(null);
  const [needsPinSetup, setNeedsPinSetup] = useState(false);
  const refreshIntervalRef = useRef(null);

  // Load cached user on mount
  useEffect(() => {
    const loadCachedUser = () => {
      try {
        const cached = authService.getCachedUser();
        const loggedIn = authService.isLoggedIn();
        
        if (cached && loggedIn) {
          if (cached.isFounder === undefined) cached.isFounder = false;
          if (!cached.userId && cached.id) {
            cached.userId = cached.id;
          }
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
   * Refresh user data from server (silent - no flicker)
   */
  const refreshUser = useCallback(async () => {
    if (!user?.userId) return null;
    
    try {
      const response = await fetch(`${API_URL}/get_user.php?user_id=${encodeURIComponent(user.userId)}`);
      const data = await response.json();
      
      if (data.success && data.user) {
        const freshData = {
          ...user,
          ...data.user,
          isFounder: data.user.isFounder === 1 || data.user.isFounder === true,
          isVerified: data.user.isVerified === 1 || data.user.isVerified === true,
          pinEnabled: data.user.pinEnabled === 1 || data.user.pinEnabled === true,
          hasWithdrawn: data.user.hasWithdrawn === 1 || data.user.hasWithdrawn === true,
        };
        
        // Only update if something actually changed (prevents re-renders)
        const pointsChanged = user.points !== freshData.points;
        const levelChanged = user.level !== freshData.level;
        const verifiedChanged = user.isVerified !== freshData.isVerified;
        
        if (pointsChanged || levelChanged || verifiedChanged) {
          authService.updateCachedUser(freshData);
          setUser(freshData);
        }
        
        return freshData;
      }
    } catch (err) {
      console.warn('Refresh user failed:', err);
    }
    return null;
  }, [user]);

  // Auto-refresh every 30 seconds when authenticated
  useEffect(() => {
    if (!isAuthenticated || !user) {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
        refreshIntervalRef.current = null;
      }
      return;
    }

    // Initial refresh after 2 seconds
    const initialTimeout = setTimeout(() => {
      refreshUser();
    }, 2000);

    // Then every 30 seconds
    refreshIntervalRef.current = setInterval(() => {
      refreshUser();
    }, 30000);

    return () => {
      clearTimeout(initialTimeout);
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
        refreshIntervalRef.current = null;
      }
    };
  }, [isAuthenticated, user?.userId, refreshUser]);

  // Refresh on window focus (user returns to tab)
  useEffect(() => {
    if (!isAuthenticated) return;
    
    const handleFocus = () => {
      refreshUser();
    };
    
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [isAuthenticated, refreshUser]);

  /**
   * Login with phone number
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
          if (userData.isFounder === undefined) userData.isFounder = false;
          if (!userData.userId && userData.id) {
            userData.userId = userData.id;
          }
          if (userData.pinEnabled === undefined) userData.pinEnabled = false;
          
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
   */
  const setPin = useCallback(async (userId, pin) => {
    try {
      const result = await authService.setPin(userId, pin);
      if (result.success && result.user) {
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
    if (refreshIntervalRef.current) {
      clearInterval(refreshIntervalRef.current);
      refreshIntervalRef.current = null;
    }
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
   * Update current user data (local cache only)
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
   * Check Opay availability
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
    refreshUser,
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