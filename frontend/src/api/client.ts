import axios from "axios";

const isBrowser = typeof window !== "undefined";
const defaultBaseUrl = isBrowser ? "/api" : "http://localhost:5000/api";

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || defaultBaseUrl
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
