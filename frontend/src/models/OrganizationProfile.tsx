import {Role} from "./Role";

export interface OrganizationProfile {
    org_user_id: number
    organization_id: number
    organization_name: string
    role: Role
    job_title: string
    permissions: string[]
}
