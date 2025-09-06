import React, {useContext, useEffect, useState} from 'react';
import {
    Layout,
    Avatar,
    Typography,
    Spin,
    List
} from 'antd';
import {UserOutlined} from '@ant-design/icons';
import axios, {AxiosResponse} from 'axios';
import {useOrgLocation} from "../contexts/LocationContext";
import {AuthContext} from "../contexts/AuthContext";
import {UserModel} from "../models/UserModel";
import {ProfileData} from "../models/ProfileData";
import ProfileDetails from "./ProfileDetails";
import {PaginatedResponse} from "../models/PaginatedResponse";

const {Header, Sider, Content} = Layout;
const {Title, Text} = Typography;

const COLORS = [
    '#FF5733', '#33FF57', '#3357FF', '#FF33A1',
    '#FF8F33', '#8D33FF', '#33FFF5', '#A133FF',
    '#33FF8F', '#FFA133'
];

const getColorForUser = (userId: string) => {
    let hash = 0;
    for (let i = 0; i < userId.length; i++) {
        hash = userId.charCodeAt(i) + ((hash << 5) - hash);
    }
    const index = Math.abs(hash) % COLORS.length;
    return COLORS[index];
};

const Dashboard: React.FC = () => {
    const {user} = useContext(AuthContext);
    const apiUrl = process.env.REACT_APP_API_URL as string;
    const {selectedLocation} = useOrgLocation();

    const [loading, setLoading] = useState(true);
    const [users, setUsers] = useState<UserModel[]>([]);
    const [profile, setProfile] = useState<ProfileData | null>(null);

    const fetchUserData = async () => {
        try {
            const res: AxiosResponse<PaginatedResponse<UserModel>> = await axios.get(`${apiUrl}/api/users/all/`, {
                params: {location_id: selectedLocation?.location.id},
                headers: {Authorization: `Token ${user?.token}`},
            });
            const data = res.data.results
            const filteredUsers = data.filter((u: UserModel) => u.id !== user?.id);
            setUsers(filteredUsers);
        } catch (error) {
            console.error('Error fetching user data:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (!selectedLocation?.location?.id) return;
        fetchUserData();
    }, [selectedLocation]);

    const handleUserClick = async (clickedUser: UserModel) => {
        try {
            const res = await axios.get(`${apiUrl}/api/profile/${clickedUser.id}/`, {
                headers: {Authorization: `Token ${user?.token}`},
            });
            setProfile(res.data);
        } catch (error) {
            console.error("Error fetching profile details:", error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Layout style={{minHeight: '100vh'}}>
            {/* Sidebar with Users */}
            <Sider
                width={350}
                style={{
                    background: '#fff',
                    borderRight: '1px solid #f0f0f0',
                    padding: '24px',
                    overflowY: 'auto'
                }}
            >
                <Title level={4}>
                    Users - {users.length}
                </Title>
                {loading ? (
                    <Spin/>
                ) : (
                    <List
                        itemLayout="horizontal"
                        dataSource={users}
                        renderItem={(item) => (
                            <List.Item
                                style={{
                                    cursor: 'pointer',
                                    transition: 'background-color 0.2s ease, transform 0.1s ease',
                                    borderRadius: 8,
                                    padding: '8px 12px'
                                }}
                                onClick={() => handleUserClick(item)}
                                onMouseDown={(e) => {
                                    e.currentTarget.style.transform = 'scale(0.98)';
                                }}
                                onMouseUp={(e) => {
                                    e.currentTarget.style.transform = 'scale(1)';
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.backgroundColor = '#f5f5f5';
                                    e.currentTarget.style.transform = 'scale(1.02)'
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.backgroundColor = 'transparent';
                                    e.currentTarget.style.transform = 'scale(1)'
                                }}
                            >
                                <List.Item.Meta
                                    avatar={
                                        <Avatar
                                            size={40}
                                            src={item.profile_picture}
                                            icon={!item.profile_picture && <UserOutlined/>}
                                            style={{
                                                backgroundColor: !item.profile_picture
                                                    ? getColorForUser(item.name)
                                                    : undefined,
                                                fontSize: '16px'
                                            }}
                                        >
                                            {!item.profile_picture && item.name?.[0]?.toUpperCase()}
                                        </Avatar>
                                    }
                                    title={
                                        <Text strong style={{fontSize: '14px', display: 'block'}}>
                                            {item.name}
                                        </Text>
                                    }
                                    description={
                                        (() => {
                                            const orgWithLocation = item.organizations?.find(org =>
                                                org.allowed_locations?.some(loc => loc.id === selectedLocation?.location?.id)
                                            );

                                            if (orgWithLocation?.job_title && orgWithLocation?.role) {
                                                return (
                                                    <Text type="secondary" style={{fontSize: '13px'}}>
                                                        {orgWithLocation.job_title} - {orgWithLocation.role.name}
                                                    </Text>
                                                );
                                            }
                                            return null;
                                        })()
                                    }
                                />
                            </List.Item>
                        )}
                    />

                )}
            </Sider>

            {/* Main Layout */}
            <Layout>
                {profile ? (
                    <div style={{padding: 24}}>
                        <ProfileDetails
                            name={profile.name}
                            email={profile.email}
                            profilePicture={profile.profile_picture}
                            contacts={profile.contacts}
                            showEditProfile={false}
                            locations={null}
                            profile={profile}
                        />
                    </div>
                ) : (
                    <div style={{padding: 24}}>
                        <Text type="secondary">Select a user to view their profile</Text>
                    </div>
                )}
            </Layout>
        </Layout>
    );
};

export default Dashboard;
