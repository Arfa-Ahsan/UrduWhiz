import axios from "axios";

const axiosInstance = axios.create({
  baseURL: "http://localhost:8000", // your FastAPI backend
  withCredentials: true,            // includes cookies like refresh_token
  headers: {
    "Content-Type": "application/json",
  },
});

export default axiosInstance;