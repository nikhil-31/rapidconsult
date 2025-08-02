import {Organization} from "./Organization";
import {Role} from "./Role";


export interface UserOrgProfile {
    id: number;
    organization: Organization;
    name: string;
    role: Role;
    job_title: string;
}
