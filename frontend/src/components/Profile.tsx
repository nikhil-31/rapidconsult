import React, {useContext, useEffect, useState} from 'react';
import axios from 'axios';
import {AuthContext} from '../contexts/AuthContext';
import {Card, Col, Row, Skeleton} from 'antd';
import {Address} from "../models/Address";
import ProfileDetails from './ProfileDetails';
import {ProfileData} from "../models/ProfileData";


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
        }
    };

    useEffect(() => {
        fetchProfile();
    }, []);

    if (!profile) {
        return (
            <div style={{maxWidth: 960, margin: '0 auto', padding: 24}}>
                {/* Header Card Skeleton */}
                <Card style={{marginBottom: 20}}>
                    <Row justify="space-between" align="middle">
                        <Col>
                            <Row gutter={16} align="middle">
                                <Col>
                                    <Skeleton.Avatar active size={96} shape="circle"/>
                                </Col>
                                <Col>
                                    <Skeleton.Input active style={{width: 200, height: 32}}/>
                                </Col>
                            </Row>
                        </Col>
                        <Col>
                            <Skeleton.Button active style={{width: 100, height: 32}}/>
                        </Col>
                    </Row>
                </Card>

                {/* Bio Card Skeleton */}
                <Card style={{marginBottom: 20}}>
                    <Skeleton active paragraph={{rows: 3, width: ['80%', '60%', '90%']}}/>
                </Card>

                {/* Contacts Card Skeleton */}
                <Card>
                    <Skeleton active paragraph={{rows: 4, width: '100%'}}/>
                </Card>
            </div>
        );
    }


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
