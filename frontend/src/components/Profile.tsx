import React, {useContext, useEffect, useState} from 'react';
import axios from 'axios';
import {AuthContext} from '../contexts/AuthContext';
import {message} from 'antd';
import {Address} from "../models/Address";
import ProfileDetails from './ProfileDetails';
import {ProfileData} from "../models/ProfileData";
import {useOrgLocation} from "../contexts/LocationContext";


interface AllowedLocation {
    name: string;
    organization_name: string;
    address: Address;
}

const Profile = () => {
    const [profile, setProfile] = useState<ProfileData | null>(null);
    const apiUrl = process.env.REACT_APP_API_URL;
    const {user} = useContext(AuthContext);

    const fetchProfile = async () => {
        try {
            const res = await axios.get(`${apiUrl}/api/profile/me/`, {
                headers: {Authorization: `Token ${user?.token}`},
            });
            setProfile(res.data);
        } catch (err) {
            console.error('Failed to load profile', err);
            message.error('Failed to load profile');
        }
    };

    useEffect(() => {
        fetchProfile();
    }, []);

    if (!profile) return <div>Loading...</div>;

    const allowedLocations: AllowedLocation[] = profile.organizations.flatMap(org =>
        org.allowed_locations.map(loc => ({
            name: loc.name,
            organization_name: org.organization.name,
            address: loc.address
        }))
    );



    return (
        <div style={{maxWidth: 960, margin: '0 auto', padding: 24}}>
            <ProfileDetails
                name={profile.name}
                email={profile.email}
                profilePicture={profile.profile_picture}
                contacts={profile.contacts}
                locations={allowedLocations}
                showEditProfile={true}
                profile={profile}
            />
        </div>
    );
};

export default Profile;
