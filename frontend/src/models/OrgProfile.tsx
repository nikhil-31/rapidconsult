import {Organization} from "./Organization";
import {Role} from "./Role";
import {Location} from "./Location"
import {User} from "./User";

export interface OrgProfile {
    id: number;
    organization: Organization;
    role: Role;
    job_title: string;
    permissions: string[];
    allowed_locations: Location[];
    user: User;
}
