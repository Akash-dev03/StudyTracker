import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useToast } from '@/hooks/use-toast';
import api from '@/services/api';

interface User {
  id: number;
  username: string;
  email: string;
  first_name?: string;
  last_name?: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<void>;
  signup: (username: string, email: string, password: string, firstName?: string, lastName?: string) => Promise<void>;
  logout: () => void;
  refreshToken: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  // Load token and user from localStorage on mount
  useEffect(() => {
    const initAuth = async () => {
      const storedToken = localStorage.getItem('auth_token');
      const storedUser = localStorage.getItem('user_data');

      if (storedToken && storedUser) {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
        
        // Verify token is still valid by fetching current user
        try {
          const response = await api.get('/auth/user/');
          const userData = response.data;
          localStorage.setItem('user_data', JSON.stringify(userData));
          setUser(userData);
        } catch (error) {
          // Token is invalid, clear everything
          localStorage.removeItem('auth_token');
          localStorage.removeItem('refresh_token');
          localStorage.removeItem('user_data');
          setToken(null);
          setUser(null);
        }
      }
      
      setIsLoading(false);
    };

    initAuth();
  }, []);

  const login = async (username: string, password: string) => {
    try {
      const response = await api.post('/auth/login/', { username, password });
      const { user: userData, tokens } = response.data;

      // Store tokens
      localStorage.setItem('auth_token', tokens.access);
      localStorage.setItem('refresh_token', tokens.refresh);
      setToken(tokens.access);

      // Store user data
      localStorage.setItem('user_data', JSON.stringify(userData));
      setUser(userData);

      toast({
        title: "Welcome back!",
        description: `Hello ${userData.username}!`,
      });
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || 'Invalid username or password';
      toast({
        title: "Login Failed",
        description: errorMessage,
        variant: "destructive",
      });
      throw error;
    }
  };

  const signup = async (
    username: string, 
    email: string, 
    password: string,
    firstName?: string,
    lastName?: string
  ) => {
    try {
      const response = await api.post('/auth/register/', {
        username,
        email,
        password,
        first_name: firstName || '',
        last_name: lastName || '',
      });
      
      const { user: userData, tokens } = response.data;

      // Store tokens
      localStorage.setItem('auth_token', tokens.access);
      localStorage.setItem('refresh_token', tokens.refresh);
      setToken(tokens.access);

      // Store user data
      localStorage.setItem('user_data', JSON.stringify(userData));
      setUser(userData);

      toast({
        title: "Account Created!",
        description: `Welcome ${userData.username}!`,
      });
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || 'Failed to create account';
      toast({
        title: "Signup Failed",
        description: errorMessage,
        variant: "destructive",
      });
      throw error;
    }
  };

  const logout = async () => {
    try {
      // Call logout endpoint (optional, for server-side cleanup)
      await api.post('/auth/logout/');
    } catch (error) {
      // Ignore errors on logout
    } finally {
      // Clear local storage and state
      localStorage.removeItem('auth_token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('user_data');
      setToken(null);
      setUser(null);
      
      toast({
        title: "Logged out",
        description: "You've been successfully logged out.",
      });
    }
  };

  const refreshToken = async () => {
    try {
      const refresh = localStorage.getItem('refresh_token');
      if (!refresh) throw new Error('No refresh token');

      const response = await api.post('/token/refresh/', { refresh });
      const { access } = response.data;

      localStorage.setItem('auth_token', access);
      setToken(access);
    } catch (error) {
      logout();
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!token,
        isLoading,
        login,
        signup,
        logout,
        refreshToken,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
