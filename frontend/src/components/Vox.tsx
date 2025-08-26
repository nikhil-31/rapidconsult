import axios from 'axios';
import React, {useContext, useEffect, useState} from 'react';
import {AuthContext} from '../contexts/AuthContext';
import {Layout, Typography, Avatar, List, Badge} from 'antd';
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
                                // Default to content
                                let displayContent = conv.lastMessage.content;

                                // ✅ If it's a file-type message and has no content, show "Media"
                                if (
                                    (!displayContent || displayContent.trim() === "") &&
                                    (conv.lastMessage.type === "file")
                                ) {
                                    displayContent = "Media";
                                }

                                if (conv.lastMessage.senderId === user?.id) {
                                    lastMessage = displayContent;
                                } else if (!isDirect) {
                                    lastMessage = `${conv.lastMessage.senderName}: ${displayContent}`;
                                } else {
                                    lastMessage = displayContent;
                                }
                            }
                            const unreadCount = conv.unreadCount
                            return (
                                <List.Item
                                    style={{
                                        padding: '8px 16px',
                                        cursor: 'pointer',
                                        background: activeConversation?.conversationId === conv.conversationId ? '#f0f5ff' : 'transparent'
                                    }}
                                    onClick={() => setActiveConversation(conv)}
                                    // extra={
                                    //     conv.unreadCount > 0 ? (
                                    //         <span
                                    //             style={{
                                    //                 backgroundColor: '#f5222d',
                                    //                 color: '#fff',
                                    //                 borderRadius: '12px',
                                    //                 padding: '2px 8px',
                                    //                 fontSize: '12px',
                                    //                 fontWeight: 500,
                                    //                 minWidth: '24px',
                                    //                 textAlign: 'center',
                                    //                 display: 'inline-block',
                                    //             }}
                                    //         >
                                    //             {conv.unreadCount}
                                    //         </span>
                                    //     ) : null
                                    // }
                                    extra={
                                        conv.unreadCount > 0 ? (
                                            <Badge
                                                count={conv.unreadCount}
                                                style={{
                                                    backgroundColor: '#f5222d',
                                                    boxShadow: '0 0 0 1px #fff',
                                                }}
                                            />
                                        ) : null
                                    }
                                >
                                    <List.Item.Meta
                                        avatar={
                                            <Avatar src={avatarUrl || undefined}>
                                                {!avatarUrl && name?.[0]}
                                            </Avatar>
                                        }
                                        title={<Text strong>{name}</Text>}
                                        description={
                                            <Text
                                                type="secondary"
                                                style={{
                                                    whiteSpace: "nowrap",
                                                    overflow: "hidden",
                                                    textOverflow: "ellipsis",
                                                    display: "block",
                                                    maxWidth: "250px",
                                                }}
                                            >
                                                {lastMessage}
                                            </Text>
                                        }
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
                            key={activeConversation.conversationId}
                            conversation={activeConversation}
                            onNewMessage={(convId, message) => {
                                setConversations((prev) =>
                                    prev.map((conv) =>
                                        conv.conversationId === convId
                                            ? {
                                                ...conv,
                                                lastMessage: {
                                                    messageId: message.id,
                                                    content: message.content,
                                                    senderId: message.senderId,
                                                    senderName: message.senderName,
                                                    timestamp: message.timestamp,
                                                    type: message.type,
                                                },
                                                updatedAt: message.timestamp,
                                            }
                                            : conv
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
