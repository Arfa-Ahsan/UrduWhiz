// authAxios.js
import axios from "axios";

const authAxios = axios.create({
  baseURL: "http://localhost:8000",
  headers: { "Content-Type": "application/json" },
  withCredentials: true, 
});

authAxios.interceptors.request.use((config) => {
  const token = localStorage.getItem("accessToken");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Add response interceptor for 401/refresh logic
authAxios.interceptors.response.use(
  response => response,
  async error => {
    const originalRequest = error.config;
    if (error.response && error.response.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        // Call refresh endpoint and get new access token
        const refreshResponse = await axios.post(
          "/auth/refresh-token",
          {},
          { baseURL: "http://localhost:8000", withCredentials: true }
        );
        const newAccessToken = refreshResponse.data.access_token;
        // Store new access token
        localStorage.setItem("accessToken", newAccessToken);
        // Update header for retry
        originalRequest.headers["Authorization"] = "Bearer " + newAccessToken;
        return authAxios(originalRequest);
      } catch (refreshError) {
        localStorage.removeItem("accessToken");
        window.location.reload();
        return Promise.reject(refreshError);
      }
    }
    return Promise.reject(error);
  }
);

export default authAxios;