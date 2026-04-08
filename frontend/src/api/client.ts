import axios from "axios";

function resolveDefaultBaseUrl() {
  if (typeof window === "undefined") {
    return "http://localhost:5000/api";
  }

  const hostname = window.location.hostname;
  if (hostname === "localhost" || hostname === "127.0.0.1") {
    return "http://localhost:5000/api";
  }

  return "/api";
}

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || resolveDefaultBaseUrl()
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (!error.response) {
      error.message =
        "Unable to reach the DisciplineX backend. Check VITE_API_URL and make sure the backend is running.";
    }

    return Promise.reject(error);
  }
);

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("studyflow_token");

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});
