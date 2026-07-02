import axios, { AxiosError } from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000/api",
  timeout: 10000,
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error: AxiosError) => Promise.reject(error)
);

const isAuthRequest = (url?: string) => {
  if (!url) return false;

  try {
    const parsedUrl = new URL(url, api.defaults.baseURL);
    return [
      "/api/auth/login",
      "/api/auth/register",
      "/api/auth/me",
      "/auth/login",
      "/auth/register",
      "/auth/me",
    ].includes(parsedUrl.pathname);
  } catch {
    return ["/auth/login", "/auth/register", "/auth/me"].includes(url);
  }
};

api.interceptors.response.use(
  (response) => response,
  (error: AxiosError<{ message?: string }>) => {
    if (error.response?.status === 401 && !isAuthRequest(error.config?.url)) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");

      if (window.location.pathname !== "/login") {
        window.location.href = "/login";
      }
    }

    return Promise.reject(error);
  }
);

export default api;

//adds automatically tokens to reqs...
