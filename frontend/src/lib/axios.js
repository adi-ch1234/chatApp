import axios from "axios";

export const axiosInstance = axios.create({
  baseURL: import.meta.env.MODE === "development" ? "http://localhost:3000/api" : "/api",
  withCredentials: true,
  timeout: 30000,
});

// Global response interceptor for auth errors
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // If we get a 401 on any request (except /auth/check), the session is invalid
      const isAuthCheck = error.config?.url?.includes("/auth/check");
      if (!isAuthCheck) {
        // Let individual handlers deal with the error, but log it
        console.warn("Unauthorized request — session may have expired");
      }
    }
    return Promise.reject(error);
  }
);
