import React, {useContext, useEffect, useState} from 'react';
import {
    Layout,
    Avatar,
    Typography,
    Spin,
    List
} from 'antd';
import {UserOutlined} from '@ant-design/icons';
import axios from 'axios';
import {useOrgLocation} from "../contexts/LocationContext";
import {AuthContext} from "../contexts/AuthContext";
import {UserModel} from "../models/UserModel";

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
    const [loading, setLoading] = useState(true);
    const {selectedLocation} = useOrgLocation();
    const [users, setUsers] = useState<UserModel[]>([]);
    const apiUrl = process.env.REACT_APP_API_URL as string;

    const fetchUserData = async () => {
        try {
            const res = await axios.get(`${apiUrl}/api/users/all/`, {
                params: {location_id: selectedLocation?.location.id},
                headers: {Authorization: `Token ${user?.token}`},
            });
            setUsers(res.data);
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

    const handleUserClick = (user: UserModel) => {
        console.log(`selected user - ${JSON.stringify(user)}`)
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
                <Title level={4}>Users</Title>
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
                <Header style={{background: '#fff', padding: '0 24px'}}>
                    <Title level={3} style={{margin: 0}}>Dashboard</Title>
                </Header>
                <Content style={{margin: '24px', background: '#fff', padding: '24px'}}>
                    Content goes here
                </Content>
            </Layout>
        </Layout>
    );
};

export default Dashboard;
