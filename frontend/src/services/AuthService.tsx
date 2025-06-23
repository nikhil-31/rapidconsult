import axios from "axios";

import {UserModel} from "../models/UserModel";

class AuthService {

    private readonly apiUrl: string | undefined;
    private readonly wsUrl: string | undefined;

    constructor() {
        this.apiUrl = process.env.REACT_APP_API_URL;
        this.wsUrl = process.env.REACT_APP_WS_URL;
    }

    setUserInLocalStorage(data: UserModel) {
        localStorage.setItem("user", JSON.stringify(data));
    }

    async login(username: string, password: string): Promise<UserModel> {
        const response = await axios.post(`${this.apiUrl}/api/auth-token/`, {username, password});
        if (!response.data.token) {
            return response.data;
        }
        this.setUserInLocalStorage(response.data);
        return response.data;
    }

    logout() {
        localStorage.removeItem("user");
    }

    getCurrentUser() {
        const user = localStorage.getItem("user")!;
        return JSON.parse(user);
    }
}

export default new AuthService();
