import React, {useContext, useEffect, useState} from 'react';
import {Layout, Avatar, Typography, List, Skeleton} from 'antd';
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
    const [totalUsers, setTotalUsers] = useState<string>("0");
    const [profile, setProfile] = useState<ProfileData | null>(null);

    // Pagination
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);


    const fetchUserData = async (pageNum = 1) => {
        if (!selectedLocation?.location?.id) return;

        try {
            if (pageNum === 1) setLoading(true);
            else setLoadingMore(true);

            const res: AxiosResponse<PaginatedResponse<UserModel>> = await axios.get(
                `${apiUrl}/api/users/all/`,
                {
                    params: {
                        location_id: selectedLocation?.location.id,
                        page: pageNum,
                    },
                    headers: {Authorization: `Token ${user?.token}`},
                }
            );

            const data = res.data.results.filter((u: UserModel) => u.id !== user?.id);
            const totalUsers = res.data.count.toString()
            setTotalUsers(totalUsers)
            if (pageNum === 1) {
                setUsers(data);
            } else {
                setUsers(prev => [...prev, ...data]);
            }

            setHasMore(!!res.data.next); // assumes API returns `next` if more pages exist
            setPage(pageNum);
        } catch (error) {
            console.error('Error fetching user data:', error);
        } finally {
            setLoading(false);
            setLoadingMore(false);
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

    const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
        const {scrollTop, scrollHeight, clientHeight} = e.currentTarget;
        if (scrollHeight - scrollTop <= clientHeight + 100 && hasMore && !loadingMore) {
            fetchUserData(page + 1);
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
                    overflowY: 'auto',
                    height: '100vh',
                    marginBottom: '24px'
                }}
                onScroll={handleScroll}
            >
                <div>
                    <Title level={5} style={{marginBottom: 10}}>
                        Users - {totalUsers}
                    </Title>
                </div>

                {loading ? (
                    <List
                        itemLayout="horizontal"
                        dataSource={Array.from(Array(2).keys())}
                        renderItem={() => (
                            <List.Item style={{padding: '8px 16px'}}>
                                <List.Item.Meta
                                    avatar={<Skeleton.Avatar active size="large" shape="circle"/>}
                                    title={<Skeleton.Input active size="small" style={{width: 150}}/>}
                                    description={<Skeleton.Input active size="small" style={{width: 220}}/>}
                                />
                            </List.Item>
                        )}
                    />
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
                    >
                        {loadingMore && (
                            <div style={{textAlign: 'center', padding: 12}}>
                                <Skeleton avatar paragraph={{rows: 1}} active/>
                            </div>
                        )}
                    </List>
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
