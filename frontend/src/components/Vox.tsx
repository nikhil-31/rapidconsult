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
    const {selectedLocation} = useOrgLocation();

    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [activeConversation, setActiveConversation] = useState<Conversation | null>(null); // NEW

    useEffect(() => {
        if (!user) return;

        if (selectedLocation) {
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
        }
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
                            let lastMessage = 'No messages yet';
                            if (conv.lastMessage) {
                                if (conv.lastMessage.senderId === user?.id) {
                                    lastMessage = conv.lastMessage.content;
                                } else if (!isDirect) {
                                    lastMessage = `${conv.lastMessage.senderName}: ${conv.lastMessage.content}`;
                                } else {
                                    lastMessage = conv.lastMessage.content;
                                }
                            }
                            return (
                                <List.Item
                                    style={{
                                        padding: '8px 16px',
                                        cursor: 'pointer',
                                        background: activeConversation?.conversationId === conv.conversationId ? '#f0f5ff' : 'transparent'
                                    }}
                                    onClick={() => setActiveConversation(conv)}
                                >
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
                    {activeConversation ? (
                        <ChatView
                            conversation={activeConversation}
                            onNewMessage={(convId, message) => {
                                setConversations((prev) =>
                                    prev.map((c) =>
                                        c.conversationId === convId
                                            ? {
                                                ...c,
                                                lastMessage: {
                                                    messageId: message.id,        // map to correct field
                                                    content: message.content,
                                                    senderId: message.senderId,
                                                    senderName: message.senderName,
                                                    timestamp: message.timestamp,
                                                    type: message.messageType,
                                                },
                                                updatedAt: message.timestamp,   // keep list sorting fresh
                                            }
                                            : c
                                    )
                                );

                            }}/>
                    ) : (
                        <div style={{padding: 24}}>
                            <Text type="secondary">Select a conversation to start chatting</Text>
                        </div>
                    )}
                </Content>
            </Layout>
        </Layout>
    );
};

export default Vox;
