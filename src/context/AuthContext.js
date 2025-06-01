import React, { useState, useEffect, createContext, useCallback } from 'react';
import axios from 'axios';
import config from '../config';
export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  // ➊ Seed from localStorage so we can fetch immediately on app load
  const [userKey, setUserKey] = useState(() => localStorage.getItem('currentUser'));
  const [profile, setProfile] = useState(null);
  const [loadingProfile, setLoadingProfile] = useState(false);

  /* ------------------------------------------------------------------ */
  /* ❶ Load / reload profile whenever userKey changes                   */
  /* ------------------------------------------------------------------ */
  useEffect(() => {
    if (!userKey) {
      setProfile(null);          // logged-out state
      return;
    }
    const currentUserEmail = localStorage.getItem('currentUser');
    setLoadingProfile(true);
    axios
      .get(`${config.apiBaseUrl}/api/users/profile/${currentUserEmail}`)
      .then(res => {
        setProfile(res.data);
      })
      .catch(err => {
        console.error('Failed to load profile:', err);
        // Optional: force logout or show toast
      })
      .finally(() => setLoadingProfile(false));
  }, [userKey]);

  /* ------------------------------------------------------------------ */
  /* ❷  Helpers that components can call                                */
  /* ------------------------------------------------------------------ */
  const login = useCallback(async (username, password) => {
    const res = await axios.post('${config.apiBaseUrl}/api/users/login', {
      username,
      password
    });

    // Backend should return { userKey: 'email-or-id' }
    const { userKey: keyReturned } = res.data;
    localStorage.setItem('currentUser', keyReturned);
    setUserKey(keyReturned);       // triggers profile fetch in useEffect above
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('currentUser');
    setUserKey(null);              // clears profile in useEffect
    setProfile(null);
  }, []);

  /* ------------------------------------------------------------------ */
  return (
    
    <AuthContext.Provider
      value={{ userKey, profile, loadingProfile, login, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
};
