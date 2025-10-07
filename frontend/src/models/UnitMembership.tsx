import {OrgProfile} from "./OrgProfile";

export interface UnitMembership {
    id: number;
    unit: number;
    user: number;
    is_admin: boolean;
    joined_at: string;
    user_details: OrgProfile
}
