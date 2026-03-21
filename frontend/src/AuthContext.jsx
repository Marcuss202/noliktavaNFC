import { createContext, useContext, useState, useEffect, useRef } from 'react';
import { authAPI } from './api';

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const latestUserRef = useRef(null);

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    latestUserRef.current = user;
    if (user) {
      localStorage.setItem('auth_is_staff', user.is_staff ? '1' : '0');
    } else {
      localStorage.removeItem('auth_is_staff');
    }
  }, [user]);

  useEffect(() => {
    const handleUnauthorized = () => {
      const wasAdmin = Boolean(latestUserRef.current?.is_staff) || localStorage.getItem('auth_is_staff') === '1';
      setUser(null);
      if (wasAdmin && window.location.pathname !== '/login') {
        window.location.assign('/login');
      }
    };

    window.addEventListener('auth:unauthorized', handleUnauthorized);
    return () => {
      window.removeEventListener('auth:unauthorized', handleUnauthorized);
    };
  }, []);

  const checkAuth = async () => {
    try {
      const userData = await authAPI.me();
      setUser(userData);
    } catch (error) {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    const userData = await authAPI.login(email, password);
    setUser(userData);
    return userData;
  };

  const logout = async () => {
    await authAPI.logout();
    setUser(null);
  };

  const register = async (email, password, full_name, phone) => {
    return await authAPI.register(email, password, full_name, phone);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, register, checkAuth }}>
      {children}
    </AuthContext.Provider>
  );
};
