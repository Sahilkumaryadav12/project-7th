import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('meditrack_user');
    return savedUser ? JSON.parse(savedUser) : null;
  });
  const [token, setToken] = useState(() => localStorage.getItem('meditrack_token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const verifyUser = async () => {
      if (token) {
        try {
          const res = await api.get('/auth/me');
          setUser(res.data.user);
          localStorage.setItem('meditrack_user', JSON.stringify(res.data.user));
        } catch (err) {
          console.error('[AuthContext] Auth check failed:', err);
          logout();
        }
      }
      setLoading(false);
    };

    verifyUser();
  }, [token]);

  const login = async (email, password, rememberMe = true) => {
    const res = await api.post('/auth/login', { email, password, rememberMe });
    const { user: userData, token: userToken } = res.data;
    
    setToken(userToken);
    setUser(userData);
    localStorage.setItem('meditrack_token', userToken);
    localStorage.setItem('meditrack_user', JSON.stringify(userData));
    return userData;
  };

  const register = async (userData) => {
    const res = await api.post('/auth/register', userData);
    const { user: newUserData, token: userToken } = res.data;

    setToken(userToken);
    setUser(newUserData);
    localStorage.setItem('meditrack_token', userToken);
    localStorage.setItem('meditrack_user', JSON.stringify(newUserData));
    return newUserData;
  };

  const logout = async () => {
    try {
      if (token) {
        await api.post('/auth/logout');
      }
    } catch (e) {
      // Ignore logout API failure
    } finally {
      setToken(null);
      setUser(null);
      localStorage.removeItem('meditrack_token');
      localStorage.removeItem('meditrack_user');
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
        token,
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
