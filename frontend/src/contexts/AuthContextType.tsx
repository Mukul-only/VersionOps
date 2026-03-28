import { createContext } from 'react';
import { AuthResponse, LoginPayload } from '@/api/types';

export interface AuthContextType {
  user: AuthResponse | null;
  isLoading: boolean;
  login: (credentials: LoginPayload) => Promise<void>;
  register: (data: { name: string; email: string; password: string }) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);
