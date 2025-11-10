import {UserModel} from "../models/UserModel";
import {OrgLocation} from "../models/OrgLocation";
import {loginRequest} from "../api/services";

class AuthService {

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
        const data = await loginRequest(username, password);

        if (!data.token) {
            return data;
        }

        this.setUserInLocalStorage(data);
        return data;
    }

    logout() {
        localStorage.removeItem("user");
        localStorage.removeItem("org_select");
        localStorage.removeItem("selected_location")
        localStorage.clear();
        sessionStorage.clear();
    }

    getCurrentUser() {
        const user = localStorage.getItem("user")!;
        return JSON.parse(user);
    }
}

const authService = new AuthService();
export default authService;
