import {OrganizationProfile} from "./OrganizationProfile"

export interface UserModel {
    id: string
    username: string
    token: string
    profile_picture: string
    name: string
    email: string
    organizations: OrganizationProfile[]
}
