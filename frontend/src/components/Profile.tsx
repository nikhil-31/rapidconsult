import React, {useContext, useEffect, useState} from 'react';
import axios from 'axios';
import {AuthContext} from "../contexts/AuthContext";

interface Address {
    address_1: string;
    address_2?: string;
    city: string;
    state: string;
    zip_code: string;
    lat?: number;
    lon?: number;
    label?: string;
}

interface Contact {
    label: string;
    number: string;
    country_code: string;
    type: string;
    primary: boolean;
}

interface OrganizationProfile {
    id: number;
    organisation: {
        id: number;
        name: string;
        address: Address;
        display_picture: string | null;
    };
    role: {
        id: number;
        name: string;
    };
    job_title: string;
}

interface UserProfile {
    id: number;
    username: string;
    name: string;
    email: string;
    profile_picture: string;
    contacts: Contact[];
    organizations: OrganizationProfile[];
}

const Profile = () => {
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const {user} = useContext(AuthContext);
    const apiUrl = process.env.REACT_APP_API_URL;

    useEffect(() => {
        axios.get(`${apiUrl}/api/profile/`, {
            headers: {
                Authorization: `Token ${user?.token}`,
            },
        }).then(res => {
            const userData = res.data[0]; // assuming the current user is always the first
            setProfile(userData);
        }).catch(err => console.error('Failed to load profile', err));
    }, []);

    if (!profile) return <div>Loading...</div>;

    return (
        <div className="max-w-4xl mx-auto p-6">
            <div className="flex items-center space-x-6 mb-6">
                {profile.profile_picture && (
                    <img
                        src={profile.profile_picture}
                        alt="Profile"
                        className="w-24 h-24 rounded-full object-cover"
                    />
                )}
                <div>
                    <h1 className="text-2xl font-bold">{profile.name || profile.username}</h1>
                    <p className="text-gray-600">{profile.email}</p>
                </div>
            </div>

            <div className="mb-6">
                <h2 className="text-xl font-semibold mb-4">Contact Info</h2>
                <div className="overflow-x-auto">
                    <table className="min-w-full bg-white border border-gray-200 text-sm">
                        <thead>
                        <tr className="bg-gray-100 text-left">
                            <th className="py-2 px-4 border-b">Label</th>
                            <th className="py-2 px-4 border-b">Type</th>
                            <th className="py-2 px-4 border-b">Country Code</th>
                            <th className="py-2 px-4 border-b">Number</th>
                            <th className="py-2 px-4 border-b">Primary</th>
                        </tr>
                        </thead>
                        <tbody>
                        {profile.contacts.map((c, idx) => (
                            <tr key={idx} className="hover:bg-gray-50">
                                <td className="py-2 px-4 border-b">{c.label || '-'}</td>
                                <td className="py-2 px-4 border-b">{c.type}</td>
                                <td className="py-2 px-4 border-b">{c.country_code}</td>
                                <td className="py-2 px-4 border-b">{c.number}</td>
                                <td className="py-2 px-4 border-b">{c.primary ? 'Yes' : 'No'}</td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                </div>
            </div>


            <div>
                <h2 className="text-xl font-semibold mb-2">Organizations</h2>
                <ul className="space-y-4">
                    {profile.organizations.map((org, idx) => (
                        <li key={idx} className="border p-4 rounded-lg bg-gray-50">
                            <div className="text-lg font-semibold">{org.organisation.name}</div>
                            <div className="text-gray-700">{org.job_title} ({org.role.name})</div>
                            <div className="text-sm text-gray-500 mt-1">
                                {org.organisation.address.address_1}, {org.organisation.address.city}, {org.organisation.address.state} - {org.organisation.address.zip_code}
                            </div>
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
};

export default Profile;
