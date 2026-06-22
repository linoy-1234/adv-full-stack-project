import api from "./api";
import type { AuthResponse, User } from "../types/api";

export const login = async (
  email: string,
  password: string
): Promise<AuthResponse> => {
  const { data } = await api.post<AuthResponse>("/auth/login", {
    email,
    password,
  });

  localStorage.setItem("token", data.token);
  localStorage.setItem("user", JSON.stringify(data.user));

  return data;
};

export const register = async (
  fullName: string,
  email: string,
  password: string,
  confirmPassword: string
): Promise<AuthResponse> => {
  const { data } = await api.post<AuthResponse>("/auth/register", {
    fullName,
    email,
    password,
    confirmPassword,
  });

  localStorage.setItem("token", data.token);
  localStorage.setItem("user", JSON.stringify(data.user));

  return data;
};

export const getMe = async (): Promise<{ success: boolean; user: User }> => {
  const { data } = await api.get<{ success: boolean; user: User }>("/auth/me");
  return data;
};

export const logout = (): void => {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
};

export const getCurrentUser = (): User | null => {
  const user = localStorage.getItem("user");

  if (!user) {
    return null;
  }

  try {
    return JSON.parse(user) as User;
  } catch {
    localStorage.removeItem("user");
    return null;
  }
};

//sends to the server the email+password
//sends the register
//checks the user that is connected by the token
//delete the user and token
//sees the current user from localstorage