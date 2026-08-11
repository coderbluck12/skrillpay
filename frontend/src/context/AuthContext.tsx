'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { ApiClient } from '@/lib/api';

interface MerchantProfile {
  id: string;
  email: string;
  business_name: string;
  kyc_status: 'pending_kyc' | 'kyc_submitted' | 'kyc_approved' | 'active' | 'suspended';
  is_admin: boolean;
  has_api_key?: boolean;
  api_key?: string;
  subaccount_code?: string;
  bank_account_number?: string;
  webhook_url?: string;
  callback_url?: string;
  kyc_data?: any;
}

interface AuthContextType {
  token: string | null;
  merchant: MerchantProfile | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (email: string, password: string, businessName: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [merchant, setMerchant] = useState<MerchantProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const storedToken = localStorage.getItem('auth_token');
    if (storedToken) {
      setToken(storedToken);
      // Fetch latest profile from backend
      fetchProfile(storedToken).finally(() => setIsLoading(false));
    } else {
      setIsLoading(false);
    }
  }, []);

  const fetchProfile = async (jwt: string) => {
    try {
      const data = await ApiClient.getMe(jwt);
      if (data.status && data.data) {
        setMerchant(data.data);
      } else {
        // Token is invalid — clear session
        clearSession();
      }
    } catch {
      clearSession();
    }
  };

  const clearSession = () => {
    localStorage.removeItem('auth_token');
    setToken(null);
    setMerchant(null);
  };

  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const data = await ApiClient.login({ email, password });
      if (!data.status) return { success: false, error: data.message || 'Login failed' };

      const jwt = data.data.token;
      localStorage.setItem('auth_token', jwt);
      setToken(jwt);
      await fetchProfile(jwt);
      return { success: true };
    } catch {
      return { success: false, error: 'Could not connect to server. Make sure the backend is running.' };
    }
  };

  const register = async (email: string, password: string, businessName: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const data = await ApiClient.register({ email, password, business_name: businessName });
      if (!data.status) return { success: false, error: data.message || 'Registration failed' };

      const jwt = data.data.token;
      localStorage.setItem('auth_token', jwt);
      setToken(jwt);
      await fetchProfile(jwt);
      return { success: true };
    } catch {
      return { success: false, error: 'Could not connect to server. Make sure the backend is running.' };
    }
  };

  const logout = () => {
    clearSession();
  };

  const refreshProfile = async () => {
    if (token) await fetchProfile(token);
  };

  return (
    <AuthContext.Provider value={{
      token,
      merchant,
      isLoading,
      isAuthenticated: !!token && !!merchant,
      login,
      register,
      logout,
      refreshProfile,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
