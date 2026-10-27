import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext();
const syncTimezone = () => {
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  if (timezone) return api.put('/settings', { timezone }).catch(() => {});
  return Promise.resolve();
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('meditrack_user');
    return savedUser ? JSON.parse(savedUser) : null;
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const verifyUser = async () => {
      try {
        const res = await api.get('/auth/me');
        setUser(res.data.user);
        localStorage.setItem('meditrack_user', JSON.stringify(res.data.user));
        await syncTimezone();
      } catch {
        setUser(null);
        localStorage.removeItem('meditrack_user');
        localStorage.removeItem('meditrack_token');
      }
      setLoading(false);
    };

    verifyUser();
  }, []);

  const login = async (email, password, rememberMe = true) => {
    const res = await api.post('/auth/login', { email, password, rememberMe });
    const { user: userData, token } = res.data;
    if (token) localStorage.setItem('meditrack_token', token);
    setUser(userData);
    localStorage.setItem('meditrack_user', JSON.stringify(userData));
    await syncTimezone();
    return userData;
  };

  const register = async (userData) => {
    const res = await api.post('/auth/register', userData);
    const { user: newUserData, token } = res.data;
    if (token) localStorage.setItem('meditrack_token', token);
    setUser(newUserData);
    localStorage.setItem('meditrack_user', JSON.stringify(newUserData));
    await syncTimezone();
    return newUserData;
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch (e) {
      // Ignore logout API failure
    } finally {
      setUser(null);
      localStorage.removeItem('meditrack_user');
      localStorage.removeItem('meditrack_token');
    }
  };

  const updateUserProfile = (updatedUser) => {
    setUser(updatedUser);
    localStorage.setItem('meditrack_user', JSON.stringify(updatedUser));
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        register,
        logout,
        updateUserProfile,
        isPatient: user?.role === 'patient',
        isCaregiver: user?.role === 'caregiver',
      }}
    >
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
