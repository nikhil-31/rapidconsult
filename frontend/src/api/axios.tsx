import axios from "axios";

const apiUrl = process.env.REACT_APP_API_URL;
const api = axios.create({
    baseURL: apiUrl
});

const storedUser = localStorage.getItem("user");
const user = storedUser ? JSON.parse(storedUser) : null;

// Request interceptor (e.g., adds auth token)
api.interceptors.request.use(
    (config) => {
        config.headers.Authorization = `Token ${user?.token}`;
        return config;
    },
    (error) => {
        Promise.reject(error)
    }
);

// Response interceptor (e.g., handle errors, refresh tokens, logging)
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            // Handle unauthorized, maybe redirect to log in
            console.error("Unauthorized, logging out...");
            localStorage.removeItem("token");
            window.location.href = "/login";
        }
        return Promise.reject(error);
    }
);

export default api;
