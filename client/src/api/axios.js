import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:5001/api",        // Vite proxy → backend
  withCredentials: false // true only if using cookies (you are not)
});

/**
 * Request interceptor
 * Attaches JWT token if present
 */
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

/**
 * Response interceptor
 * Central place for auth / error handling later
 */
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Example future handling:
    // if (error.response?.status === 401) {
    //   localStorage.removeItem("token");
    //   window.location.href = "/login";
    // }

    return Promise.reject(error);
  }
);

export default api;
