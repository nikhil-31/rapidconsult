import axios, {AxiosResponse} from "axios";
import React, {useContext, useEffect, useRef, useState} from "react";
import {AuthContext} from "../contexts/AuthContext";
import {Layout, Typography, Avatar, List, Badge, Skeleton} from "antd";
import {useOrgLocation} from "../contexts/LocationContext";
import {Conversation} from "../models/ActiveConversation";
import ChatView from "./ChatView";
import {PaginatedResponse} from "../models/PaginatedResponse";
import {useLocation} from "react-router-dom";
import {getActiveConversations} from "../api/services";

const {Sider, Content} = Layout;
const {Title, Text} = Typography;

const Vox: React.FC = () => {
    const {user} = useContext(AuthContext);
    const routerLocation = useLocation();
    const {selectedLocation} = useOrgLocation();

    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [activeConversation, setActiveConversation] = useState<Conversation | null>(null);
    const [totalConversations, setTotalConversations] = useState<number>(0);
    const [loading, setLoading] = useState<boolean>(false);


    const fetchConversations = async (pageNum: number, append = false) => {
        if (!user || !selectedLocation) return;
        try {
            setLoading(true);
            const data = await getActiveConversations(
                user.id,
                selectedLocation.organization.id,
                selectedLocation.location.id,
                pageNum // pass page
            );

            setTotalConversations(data.count);
            setConversations((prev) =>
                append ? [...prev, ...data.results] : data.results
            );

            // handle ?conversation= param only on first load
            if (pageNum === 1) {
                const params = new URLSearchParams(routerLocation.search);
                const conversationId = params.get("conversation");
                if (conversationId) {
                    const found = data.results.find(
                        (c) => c.conversationId.toString() === conversationId
                    );
                    if (found) setActiveConversation(found);
                }
            }
        } catch (err) {
            console.error("Error fetching conversations:", err);
        } finally {
            setLoading(false);
        }
    };

    // initial load
    useEffect(() => {
        fetchConversations(1, false);
    }, [user, selectedLocation]);

    return (
        <Layout style={{height: 'calc(100vh - 64px)', background: '#f9f9f9'}}>
            <Sider width={350} style={{backgroundColor: '#ffffff', borderRight: '1px solid #f0f0f0'}}>
                <div style={{padding: 16}}>
                    <div>
                        <Title level={5} style={{marginBottom: 10}}>
                            Conversations {totalConversations ? `- ${totalConversations}` : ''}
                        </Title>
                    </div>

                    <div style={{flex: 1, overflowY: 'auto'}}>
                        {loading ? (
                            <List
                                itemLayout="horizontal"
                                dataSource={Array.from(Array(2).keys())}
                                renderItem={(i) => (
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
                                dataSource={conversations}
                                renderItem={(conv) => {
                                    const isDirect = conv.conversationType === 'direct';
                                    const name = isDirect
                                        ? conv.directMessage?.otherParticipantName
                                        : conv.groupChat?.name;
                                    const avatarUrl = isDirect
                                        ? conv.directMessage?.otherParticipantAvatar
                                        : conv.groupChat?.avatar;

                                    let lastMessage = 'No messages yet';
                                    if (conv.lastMessage) {
                                        let displayContent = conv.lastMessage.content;
                                        if ((!displayContent || displayContent.trim() === '') &&
                                            conv.lastMessage.type === 'file') {
                                            displayContent = 'Media';
                                        }
                                        if (conv.lastMessage.senderId === user?.id) {
                                            lastMessage = displayContent;
                                        } else if (!isDirect) {
                                            lastMessage = `${conv.lastMessage.senderName}: ${displayContent}`;
                                        } else {
                                            lastMessage = displayContent;
                                        }
                                    }

                                    return (
                                        <List.Item
                                            style={{
                                                padding: '8px 16px',
                                                cursor: 'pointer',
                                                background:
                                                    activeConversation?.conversationId === conv.conversationId
                                                        ? '#f0f5ff'
                                                        : 'transparent',
                                            }}
                                            onClick={() => setActiveConversation(conv)}
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
                                                            whiteSpace: 'nowrap',
                                                            overflow: 'hidden',
                                                            textOverflow: 'ellipsis',
                                                            display: 'block',
                                                            maxWidth: '250px',
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
                        )}
                    </div>
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
                            }}
                        />
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
