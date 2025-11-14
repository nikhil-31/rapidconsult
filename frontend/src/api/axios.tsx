import axios from "axios";
import AuthService from "../services/AuthService";

const apiUrl = process.env.REACT_APP_API_URL;
const api = axios.create({
    baseURL: `${apiUrl}/api/`
});

// Request interceptor (e.g., adds auth token)
api.interceptors.request.use(
    (config) => {
        const token = AuthService.getToken();

        if (token) {
            config.headers.Authorization = `Token ${token}`;
        } else {
            delete config.headers.Authorization;
        }
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
            AuthService.logout();
            window.location.href = "/login";
        }
        return Promise.reject(error);
    }
);

export default api;
