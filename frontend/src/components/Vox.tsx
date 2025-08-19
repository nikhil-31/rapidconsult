import axios from 'axios';
import React, {useContext, useEffect, useState} from 'react';
import {AuthContext} from '../contexts/AuthContext';
import {Layout, Typography, Avatar, List} from 'antd';
import {useOrgLocation} from "../contexts/LocationContext";
import {Conversation} from "../models/ActiveConversation";
import ChatView from "./ChatView";

const {Sider, Content} = Layout;
const {Title, Text} = Typography;


const Vox: React.FC = () => {
    const {user} = useContext(AuthContext);
    const orgs = user?.organizations || [];
    const apiUrl = process.env.REACT_APP_API_URL as string;

    const [selectedLocationId, setSelectedLocationId] = useState<number | null>(null);
    const {selectedLocation, setSelectedLocation} = useOrgLocation();

    const [conversations, setConversations] = useState<Conversation[]>([]);


    useEffect(() => {
        if (!user) return;

        const fetchConversations = async () => {
            try {
                const response = await axios.get(`${apiUrl}/api/active-conversations/`, {
                    params: {
                        user_id: user.id,
                        organization_id: selectedLocation?.organization.id,
                        location_id: selectedLocation?.location.id
                    },
                    headers: {Authorization: `Token ${user.token}`},
                });
                setConversations(response.data.results);
            } catch (err) {
                console.error('Error fetching conversations:', err);
            }
        };

        fetchConversations();
    }, [user, selectedLocation]);

    return (
        <Layout style={{height: 'calc(100vh - 64px)', background: '#f9f9f9'}}>
            <Sider width={350} style={{backgroundColor: '#ffffff', borderRight: '1px solid #f0f0f0'}}>
                <div style={{padding: 16}}>
                    <Title level={5} style={{marginBottom: 10}}>Conversations</Title>
                    <List
                        itemLayout="horizontal"
                        dataSource={conversations}
                        renderItem={conv => {
                            const isDirect = conv.conversationType === 'direct';
                            const name = isDirect
                                ? conv.directMessage?.otherParticipantName
                                : conv.groupChat?.name;
                            const avatarUrl = isDirect
                                ? conv.directMessage?.otherParticipantAvatar
                                : conv.groupChat?.avatar;
                            const lastMessage = conv.lastMessage?.content || 'No messages yet';
                            return (
                                <List.Item style={{padding: '8px 16px', cursor: 'pointer'}}>
                                    <List.Item.Meta
                                        avatar={<Avatar src={avatarUrl || undefined}>{!avatarUrl && name?.[0]}</Avatar>}
                                        title={<Text strong>{name}</Text>}
                                        description={<Text type="secondary">{lastMessage}</Text>}
                                    />
                                </List.Item>
                            );
                        }}
                    />
                </div>
            </Sider>

            <Layout>
                <Content style={{background: '#fff'}}>
                    <ChatView/>


                </Content>
            </Layout>
        </Layout>
    );
};

export default Vox;
