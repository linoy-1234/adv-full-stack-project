import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

import {
  getCurrentUser,
  getMe,
  login as loginRequest,
  loginWithGoogle as loginWithGoogleRequest,
  logout as logoutRequest,
  register as registerRequest,
} from "../services/authService";

import type { AuthResponse, User } from "../types/api";

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<AuthResponse>;
  loginWithGoogle: (credential: string) => Promise<AuthResponse>;
  register: (
    fullName: string,
    email: string,
    password: string,
    confirmPassword: string
  ) => Promise<AuthResponse>;
  logout: () => void;
}

interface AuthProviderProps {
  children: ReactNode;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(getCurrentUser());
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const restoreSession = async () => {
      const token = localStorage.getItem("token");

      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const data = await getMe();

        if (data.user) {
          setUser(data.user);
          localStorage.setItem("user", JSON.stringify(data.user));
        }
      } catch {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    restoreSession();
  }, []);

  const login = async (
    email: string,
    password: string
  ): Promise<AuthResponse> => {
    const data = await loginRequest(email, password);
    setUser(data.user);
    return data;
  };

  const loginWithGoogle = async (credential: string): Promise<AuthResponse> => {
    const data = await loginWithGoogleRequest(credential);
    setUser(data.user);
    return data;
  };

  const register = async (
    fullName: string,
    email: string,
    password: string,
    confirmPassword: string
  ): Promise<AuthResponse> => {
    const data = await registerRequest(
      fullName,
      email,
      password,
      confirmPassword
    );

    setUser(data.user);
    return data;
  };

  const logout = () => {
    logoutRequest();
    setUser(null);
  };

  const value: AuthContextValue = {
    user,
    loading,
    isAuthenticated: Boolean(user),
    login,
    loginWithGoogle,
    register,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextValue => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }

  return context;
};

//saves the user in the whole website, checks the token, calls auth/me to re-login, gives login, register, logout...
