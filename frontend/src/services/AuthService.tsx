import axios from "axios";

import {UserModel} from "../models/UserModel";
import {OrgLocation} from "../models/OrgLocation";

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
            let firstAllowedLocation = null;
            let firstOrgProfile = null;
            for (const org of data.organizations) {
                if (org.allowed_locations && org.allowed_locations.length > 0) {
                    firstAllowedLocation = org.allowed_locations[0];
                    firstOrgProfile = org
                    break;
                }
            }
            if (firstAllowedLocation && firstOrgProfile) {
                const orgLocation: OrgLocation = {
                    organization: firstOrgProfile.organization,
                    location: firstAllowedLocation,
                };
                localStorage.setItem("selected_location", JSON.stringify(orgLocation));
            }
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
        localStorage.removeItem("selected_location")
    }

    getCurrentUser() {
        const user = localStorage.getItem("user")!;
        return JSON.parse(user);
    }
}

const authService = new AuthService();
export default authService;
