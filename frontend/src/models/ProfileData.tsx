import {Contact} from "./Contact";
import {OrgProfile} from "./OrgProfile";

export interface ProfileData {
    id?: number;
    name: string;
    username: string;
    email: string;
    profile_picture?: string;
    contacts: Contact[];
    organizations: OrgProfile[];
}
