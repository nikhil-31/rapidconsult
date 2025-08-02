import {UserOrgProfile} from "./UserOrgProfile";

export interface Member {
    id: number;
    user: number;
    is_admin: boolean;
    joined_at: string;
    user_details: UserOrgProfile;
}
