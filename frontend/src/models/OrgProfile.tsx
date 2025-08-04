import {Organization} from "./Organization";
import {Role} from "./Role";

export interface OrgProfile {
    id: number;
    organisation: Organization;
    role: Role;
    job_title: string;
}
