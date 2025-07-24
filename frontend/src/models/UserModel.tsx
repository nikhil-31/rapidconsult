import {OrganizationProfile} from "./OrganizationProfile"

export interface UserModel {
    username: string
    token: string
    profile_picture: string
    organizations: OrganizationProfile[]
}
