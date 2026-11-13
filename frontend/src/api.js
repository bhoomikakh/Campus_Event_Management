import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000/api",
});

// Attach the saved login token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// If the server says the token is invalid/expired, log the user out
api.interceptors.response.use(
  (res) => res,
  (err) => {
    const isLoginCall = err.config?.url?.startsWith("/auth/login");
    if (err.response?.status === 401 && !isLoginCall) {
      localStorage.removeItem("token");
      window.dispatchEvent(new Event("auth-expired"));
    }
    return Promise.reject(err);
  }
);

export const errorText = (err, fallback = "Something went wrong.") =>
  err.response?.data?.message || (err.request ? "Unable to connect to backend." : fallback);

export default api;
