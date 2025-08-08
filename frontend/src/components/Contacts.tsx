// src/pages/Dashboard.tsx
import React, {useContext, useEffect, useState} from 'react';
import {
    Layout,
    Avatar,
    Typography,
    Space,
    Tag,
    Spin,
    List
} from 'antd';
import {UserOutlined} from '@ant-design/icons';
import axios from 'axios';
import {useOrgLocation} from "../contexts/LocationContext";
import {AuthContext} from "../contexts/AuthContext";

const {Header, Sider, Content} = Layout;
const {Title, Text} = Typography;

interface UserData {
    id: number;
    username: string;
    profile_picture?: string;
    organizations?: { role?: { name?: string } }[];
}

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
    const [users, setUsers] = useState<UserData[]>([]);
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
        if (!selectedLocation?.location?.id) {
            // Wait until the location is loaded before making the request
            return;
        }
        fetchUserData();
    }, [selectedLocation]);

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
                            <List.Item>
                                <List.Item.Meta
                                    avatar={
                                        <Avatar
                                            src={item.profile_picture}
                                            icon={!item.profile_picture && <UserOutlined/>}
                                            style={{
                                                backgroundColor: !item.profile_picture
                                                    ? getColorForUser(item.username)
                                                    : undefined
                                            }}
                                        >
                                            {!item.profile_picture && item.username?.[0]?.toUpperCase()}
                                        </Avatar>
                                    }
                                    title={<Text strong>{item.username}</Text>}
                                    description={
                                        item.organizations && item.organizations[0]?.role?.name && (
                                            <Tag
                                                color={getColorForUser(item.username)}
                                                style={{color: '#fff'}}
                                            >
                                                {item.organizations[0].role.name}
                                            </Tag>
                                        )
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
