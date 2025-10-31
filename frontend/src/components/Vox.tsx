import React, {useContext, useEffect, useRef, useState, UIEvent} from "react";
import {AuthContext} from "../contexts/AuthContext";
import {Layout, Typography, List, Skeleton, Input, Button} from "antd";
import {useOrgLocation} from "../contexts/LocationContext";
import {useLocation} from "react-router-dom";
import {getActiveConversations} from "../api/services";
import {SearchOutlined, MessageOutlined} from "@ant-design/icons";
import {Conversation} from "../models/ActiveConversation";
import ConversationListItem from "./ConversationListItem";
import ChatView from "./ChatView";
import {UserModel} from "../models/UserModel";
import StartConversationModal from "./StartConversationModal";

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
    const [page, setPage] = useState<number>(1);
    const [hasMore, setHasMore] = useState<boolean>(true);
    const [searchTerm, setSearchTerm] = useState<string>("");
    const [modalOpen, setModalOpen] = useState(false);

    const listRef = useRef<HTMLDivElement | null>(null);
    const debounceTimeout = useRef<NodeJS.Timeout | null>(null);

    const fetchConversations = async (pageNum: number, append = false) => {
        if (!user || !selectedLocation || loading) return;
        try {
            setLoading(true);
            const data = await getActiveConversations(
                user.id,
                selectedLocation.organization.id,
                selectedLocation.location.id,
                pageNum,
                searchTerm
            );

            setTotalConversations(data.count);
            setConversations((prev) =>
                append ? [...prev, ...data.results] : data.results
            );
            setHasMore(
                data.results.length > 0 &&
                (append
                    ? [...conversations, ...data.results].length < data.count
                    : data.results.length < data.count)
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

    // initial load or when org/location changes
    useEffect(() => {
        setPage(1);
        fetchConversations(1, false);
    }, [user, selectedLocation]);

    // 🔎 Debounced search effect
    useEffect(() => {
        if (debounceTimeout.current) {
            clearTimeout(debounceTimeout.current);
        }
        debounceTimeout.current = setTimeout(() => {
            setPage(1);
            fetchConversations(1, false);
        }, 500); // 500ms debounce
        return () => {
            if (debounceTimeout.current) clearTimeout(debounceTimeout.current);
        };
    }, [searchTerm]); // trigger search on input change

    // load more when scrolling
    const handleScroll = (e: UIEvent<HTMLDivElement>) => {
        const {scrollTop, clientHeight, scrollHeight} = e.currentTarget;
        if (scrollHeight - scrollTop <= clientHeight + 50 && hasMore && !loading) {
            const nextPage = page + 1;
            setPage(nextPage);
            fetchConversations(nextPage, true);
        }
    };

    const handleSelectUser = (user: UserModel) => {
        console.log("Selected user:", user);
        // Create or open conversation logic here
    };

    const handleOnCreateGroup = () => {
        fetchConversations(1, false);
    };

    return (
        <Layout style={{height: 'calc(100vh - 64px)', background: '#f9f9f9'}}>
            <Sider width={350} style={{backgroundColor: '#ffffff', borderRight: '1px solid #f0f0f0'}}>
                <div style={{padding: 16, height: '100%', display: 'flex', flexDirection: 'column'}}>
                    {/* Header row: Title + Button */}
                    <div
                        style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            marginBottom: 20,
                        }}
                    >
                        <Title level={5} style={{margin: 0}}>
                            Conversations {totalConversations ? `- ${totalConversations}` : ''}
                        </Title>

                        {/* ➕ Add Conversation Button */}
                        <Button
                            type="primary"
                            size="large"
                            icon={<MessageOutlined/>}
                            style={{
                                backgroundColor: '#ff4d4f',
                                borderColor: '#ff4d4f',
                            }}
                            onClick={() => setModalOpen(true)}
                        />

                        <StartConversationModal
                            open={modalOpen}
                            onClose={() => setModalOpen(false)}
                            onSelectUser={handleSelectUser}
                            onCreateGroup={handleOnCreateGroup}
                        />
                    </div>

                    {/* 🔎 Auto Search Input */}
                    <Input
                        placeholder="Search conversations"
                        allowClear
                        prefix={<SearchOutlined style={{color: "red"}}/>}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        style={{
                            marginBottom: 12,
                            borderColor: "red",
                        }}
                    />

                    <div
                        ref={listRef}
                        style={{flex: 1, overflowY: 'auto'}}
                        onScroll={handleScroll}
                    >
                        <List
                            itemLayout="horizontal"
                            dataSource={conversations}
                            renderItem={(conv) => (
                                <ConversationListItem
                                    conv={conv}
                                    userId={user?.id}
                                    activeConversation={activeConversation}
                                    onSelect={setActiveConversation}
                                />
                            )}
                        />
                        {loading && (
                            <div style={{padding: 12}}>
                                <Skeleton active avatar title={false} paragraph={{rows: 1}}/>
                                <Skeleton active avatar title={false} paragraph={{rows: 1}}/>
                            </div>
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
                                setConversations((prev) => {
                                    const updated = prev.map((conv) =>
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
                                    );
                                    const movedConv = updated.find((c) => c.conversationId === convId);
                                    if (!movedConv) return updated;
                                    const filtered = updated.filter((c) => c.conversationId !== convId);
                                    return [movedConv, ...filtered];
                                });
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
