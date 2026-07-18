import axios from 'axios';

// Create a single, configured instance of Axios
// In production, VITE_API_URL will be set via environment variables.
// In local dev, it falls back to http://localhost:8000/api
const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000/api',
  headers: {
    'Content-Type': 'application/json'
  }
});

export default apiClient;
