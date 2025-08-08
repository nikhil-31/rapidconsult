import React, {useContext, useEffect, useState} from 'react';
import axios from 'axios';
import {AuthContext} from '../contexts/AuthContext';
import {useNavigate} from 'react-router-dom';
import {
    Avatar,
    Button,
    Card,
    Col,
    Divider,
    List,
    Row,
    Table,
    Typography,
    message
} from 'antd';
import {Address} from "../models/Address";
import {Contact} from "../models/Contact";
import {Organization} from "../models/Organization";
import {Role} from "../models/Role";
import {Location} from "../models/Location";
import {User} from "../models/User";

const {Title, Text} = Typography;

interface AllowedLocation {
    name: string;
    organization_name: string;
    address: Address;
}

export interface ProfileData {
    id?: number;
    name: string;
    username: string;
    email: string;
    profile_picture?: string;
    contacts: Contact[];
    organizations: OrgProfile[];
}

export interface OrgProfile {
    id: number;
    organisation: Organization;
    role: Role;
    job_title: string;
    permissions: string[];
    allowed_locations: Location[];
    user: User;
}


const Profile = () => {
    const [profile, setProfile] = useState<ProfileData | null>(null);
    const apiUrl = process.env.REACT_APP_API_URL;
    const {user} = useContext(AuthContext);
    const navigate = useNavigate();

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

    const contactColumns = [
        {
            title: 'Label',
            dataIndex: 'label',
            key: 'label',
        },
        {
            title: 'Type',
            dataIndex: 'type',
            key: 'type',
        },
        {
            title: 'Number/Contact',
            dataIndex: 'number',
            key: 'number',
        },
        {
            title: 'Primary',
            dataIndex: 'primary',
            key: 'primary',
            render: (val: boolean) => (val ? 'Yes' : 'No'),
        },
    ];

    const allowedLocations: AllowedLocation[] = profile.organizations.flatMap(org =>
        org.allowed_locations.map(loc => ({
            name: loc.name,
            organization_name: org.organisation.name,
            address: loc.address
        }))
    );

    return (
        <div style={{maxWidth: 960, margin: '0 auto', padding: 24}}>
            <Card>
                <Row justify="space-between" align="middle">
                    <Col>
                        <Row gutter={16} align="middle">
                            <Col>
                                <Avatar
                                    size={96}
                                    src={profile.profile_picture || '/doctor-default.png'}
                                />
                            </Col>
                            <Col>
                                <Title level={3} style={{marginBottom: 0}}>
                                    {profile.name}
                                </Title>
                                <Text type="secondary">{profile.email}</Text>
                            </Col>
                        </Row>
                    </Col>
                    <Col>
                        <Button type="primary" danger onClick={() => navigate('/profile/edit')}>
                            Edit Profile
                        </Button>
                    </Col>
                </Row>
            </Card>

            <Divider/>

            {/* Contacts */}
            <Card
                title="Contact Info"
            >
                <Table
                    rowKey="id"
                    dataSource={profile.contacts}
                    columns={contactColumns}
                    pagination={false}
                />
            </Card>

            <Divider/>

            {/*<Card title="Allowed Locations" style={{marginTop: 20}}>*/}
            {/*    <List*/}
            {/*        itemLayout="vertical"*/}
            {/*        dataSource={allowedLocations}*/}
            {/*        renderItem={item => (*/}
            {/*            <List.Item>*/}
            {/*                <List.Item.Meta*/}
            {/*                    title={<Title level={5}>{item.name}</Title>}*/}
            {/*                    description={<Text type="secondary">{item.organization_name}</Text>}*/}
            {/*                />*/}
            {/*                <div>*/}
            {/*                    <Text>{item.address.address_1}, {item.address.address_2}</Text><br/>*/}
            {/*                    <Text>{item.address.city}, {item.address.state} {item.address.zip_code}</Text><br/>*/}
            {/*                    <Text type="secondary">Label: {item.address.label}</Text>*/}
            {/*                </div>*/}
            {/*            </List.Item>*/}
            {/*        )}*/}
            {/*    />*/}
            {/*</Card>*/}
            <Card title="Locations" style={{marginTop: 20}}>
                <List
                    itemLayout="vertical"
                    dataSource={allowedLocations}
                    renderItem={item => (
                        <List.Item
                            style={{
                                borderRadius: 8,
                                padding: 5,
                                marginBottom: 12,
                            }}
                        >
                            <List.Item.Meta
                                title={
                                    <>
                                        <Title level={5} style={{marginBottom: 0}}>
                                            {item.name}
                                        </Title>
                                        <Text type="secondary" style={{fontSize: 14}}>
                                            {item.organization_name}
                                        </Text>
                                    </>
                                }
                                description={
                                    <div style={{marginTop: 8}}>
                                        <Text>
                                            {item.address.address_1}
                                            {item.address.address_2 && `, ${item.address.address_2}`}
                                        </Text>
                                        <br/>
                                        <Text type="secondary">
                                            {item.address.city}, {item.address.state} {item.address.zip_code}
                                        </Text>
                                        <br/>
                                        <Text type="secondary">Label: {item.address.label}</Text>
                                    </div>
                                }
                            />
                        </List.Item>
                    )}
                />
            </Card>


        </div>
    );
};

export default Profile;
