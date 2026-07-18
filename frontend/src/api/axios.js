import axios from 'axios';

// Create a single, configured instance of Axios
const apiClient = axios.create({
  baseURL: 'http://localhost:8000/api', // Point to our Express backend
  headers: {
    'Content-Type': 'application/json'
  }
});

export default apiClient;
