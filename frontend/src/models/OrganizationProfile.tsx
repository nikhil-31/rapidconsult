import {Role} from "./Role";

export interface OrganizationProfile {
    organization_id: number
    organization_name: string
    role: Role
    job_title: string
    permissions: string[]
}
