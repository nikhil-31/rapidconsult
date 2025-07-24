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
        if (data.organizations && data.organizations.length > 0) {
            const firstOrg = data.organizations[0];
            localStorage.setItem("org_select", JSON.stringify(firstOrg));
        }
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
        localStorage.removeItem("org_select");
    }

    getCurrentUser() {
        const user = localStorage.getItem("user")!;
        return JSON.parse(user);
    }
}

const authService = new AuthService();
export default authService;
