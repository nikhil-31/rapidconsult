import axios from "axios";
import React, {useState, useEffect, useContext, useRef} from "react";
import {Input, Button, Upload, List, Tooltip, Typography, Spin} from "antd";
import {
    UploadOutlined, SendOutlined, SmileOutlined, RollbackOutlined, CloseOutlined,
} from "@ant-design/icons";
import type {UploadFile} from "antd/es/upload/interface";
import Picker from "emoji-picker-react";
import {Conversation} from "../models/ActiveConversation";
import useWebSocket, {ReadyState} from "react-use-websocket";
import {AuthContext} from "../contexts/AuthContext";
import {useOrgLocation} from "../contexts/LocationContext";
import {deserializeMessage, Message} from "../models/Message";
import InfiniteScroll from "react-infinite-scroll-component";

const {Text} = Typography;

interface PreviewFile extends UploadFile {
    preview?: string;
}

interface ChatViewProps {
    conversation: Conversation;
    onNewMessage: (conversationId: string, message: Message) => void;
}

const ChatView: React.FC<ChatViewProps> = ({conversation, onNewMessage}) => {
    const apiUrl = process.env.REACT_APP_API_URL;
    const wsUrl = process.env.REACT_APP_WS_URL;

    const {user} = useContext(AuthContext);
    const [selectedLocationId, setSelectedLocationId] = useState<number | null>(null);
    const {selectedLocation} = useOrgLocation();
    const [conversationId, setConversationId] = useState("");

    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState("");
    const [files, setFiles] = useState<PreviewFile[]>([]); // ✅ use extended type
    const [showEmoji, setShowEmoji] = useState(false);
    const [replyTo, setReplyTo] = useState<Message | null>(null);
    const [typingUsers, setTypingUsers] = useState<string[]>([]);

    // Infinite scroll
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const listRef = useRef<HTMLDivElement | null>(null);
    const [loadError, setLoadError] = useState(false);

    // Typing
    const [isTyping, setIsTyping] = useState(false);
    const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const typingTimeouts = useRef<Record<string, NodeJS.Timeout>>({});

    // status changes
    const [otherUserStatus, setOtherUserStatus] = useState<"online" | "offline" | null>(null);
    const [lastSeen, setLastSeen] = useState<string | null>(null);

    // Reset messages when conversation changes
    useEffect(() => {
        if (conversation) {
            setConversationId(conversation.conversationId);
            setInput("");
            setFiles([]);
        }
    }, [conversation]);

    // Fetch messages via REST (paginated)
    const fetchMessages = async (pageNum: number) => {
        try {
            const res = await axios.get(`${apiUrl}/api/messages/`, {
                params: {
                    conversation_id: conversationId,
                    page: pageNum,
                    page_size: 50,
                    organization_id: selectedLocation?.organization.id,
                    location_id: selectedLocation?.location.id,
                },
                headers: {Authorization: `Token ${user?.token}`},
            });

            const newMsgs: Message[] = res.data.results.map((m: any) =>
                deserializeMessage(m)
            );

            if (pageNum === 1) {
                setMessages(newMsgs.reverse());
            } else {
                const list = listRef.current;
                if (!list) return;

                if (!list) return;

                // ✅ Load older messages → preserve position
                const prevScrollHeight = list.scrollHeight;

                const reversed = newMsgs.reverse()
                setMessages((prev) => [...reversed, ...prev]);

                requestAnimationFrame(() => {
                    if (list) {
                        const newScrollHeight = list.scrollHeight;
                        list.scrollTop = newScrollHeight - prevScrollHeight + list.scrollTop;
                    }
                });
            }

            setHasMore(!!res.data.next);
            setPage(pageNum);
            setLoadError(false);
        } catch (err) {
            console.error("Failed to fetch messages:", err);
            setLoadError(true);
        }
    };

    const handleTypingTimeout = (username: string, duration = 10000) => {
        // clear any existing timer
        if (typingTimeouts.current[username]) {
            clearTimeout(typingTimeouts.current[username]);
        }

        // set a new one
        typingTimeouts.current[username] = setTimeout(() => {
            setTypingUsers((prev) => {
                const updated = prev.filter((name) => name !== username);
                if (updated.length === 0) {
                    setIsTyping(false);
                }
                return updated;
            });
            delete typingTimeouts.current[username];
        }, duration);
    };

    useEffect(() => {
        if (conversation?.conversationId) {
            setConversationId(conversation.conversationId);
            setMessages([]);
            setPage(1);
            // fetchMessages(1);
        }
    }, [conversation]);

    // 🔹 Load more when user scrolls to top
    const loadMore = () => {
        console.log(`load more ${hasMore}`)
        if (hasMore) {
            fetchMessages(page + 1);
        }
    };

    const {readyState, sendJsonMessage} = useWebSocket(
        user ? `${wsUrl}/voxchats/${conversationId}/` : null,
        {
            share: true,
            retryOnError: true,
            reconnectAttempts: 20,
            reconnectInterval: 5000,
            shouldReconnect: (closeEvent) => closeEvent.code !== 1000,
            queryParams: {token: user?.token ?? ""},
            onMessage: (e) => {
                const data = JSON.parse(e.data);
                switch (data.type) {
                    case "chat_message_echo":
                        const newMessage: Message = deserializeMessage(data.message);
                        setMessages((prev) => [...prev, newMessage]);

                        if (onNewMessage) {
                            onNewMessage(conversationId, newMessage);
                        }
                        break;
                    case "last_50_messages":
                        const hasMore = data.has_more
                        setHasMore(hasMore)
                        const history = data.messages.map((msg: any) => (deserializeMessage(msg)));
                        setMessages(history);
                        break;
                    case "typing":
                        if (Number(data.userId) !== Number(user?.id)) {
                            if (data.status === "typing") {
                                setIsTyping(true)
                                setTypingUsers((prev) =>
                                    prev.includes(data.username) ? prev : [...prev, data.username]
                                );
                                handleTypingTimeout(data.username, 10000);
                            } else if (data.status === "stop_typing") {
                                setTypingUsers((prev) =>
                                    prev.filter((name) => name !== data.username)
                                );
                                if (typingUsers.length === 0) {
                                    setIsTyping(false)
                                }
                                if (typingTimeouts.current[data.username]) {
                                    clearTimeout(typingTimeouts.current[data.username]);
                                    delete typingTimeouts.current[data.username];
                                }
                            }
                        }
                        break;
                    // case "user_status": // 👈 updates when status changes
                    //     if (Number(data.user_id) !== Number(user?.id)) {
                    //         setOtherUserStatus(data.status); // "online" or "offline"
                    //     }
                    //     break;
                    case "presence":
                        if (Number(data.user_id) !== Number(user?.id)) {
                            setOtherUserStatus(data.status);
                            if (data.status === "offline" && data.last_seen) {
                                setLastSeen(data.last_seen);
                            }
                            if (data.status === "online") {
                                setLastSeen(null); // clear when online
                            }
                        }
                        break;
                    default:
                        break;
                }
            },
        }
    );

    const sendTypingEvent = (status: string) => {
        sendJsonMessage({
            type: "typing",
            conversationId,
            userId: user?.id,
            username: user?.name,
            status: status,
        });
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setInput(e.target.value);

        // first keystroke → mark as typing
        if (!isTyping) {
            setIsTyping(true);
            sendTypingEvent("typing");
        }

        // clear previous soft timer
        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);

        // restart soft timer → stop 3s after last keystroke
        typingTimeoutRef.current = setTimeout(() => {
            setIsTyping(false);
            sendTypingEvent("stop_typing");
        }, 5000);
    };

    const connectionStatus = {
        [ReadyState.CONNECTING]: "Connecting",
        [ReadyState.OPEN]: "Open",
        [ReadyState.CLOSING]: "Closing",
        [ReadyState.CLOSED]: "Closed",
        [ReadyState.UNINSTANTIATED]: "Uninstantiated",
    }[readyState];

    const handleEmojiClick = (emojiObject: any) => {
        setInput((prev) => prev + emojiObject.emoji);
    };

    const title =
        conversation.conversationType === "direct"
            ? conversation.directMessage?.otherParticipantName
            : conversation.groupChat?.name;

    const handleSendText = () => {
        const payload = {
            type: "chat_message",
            conversationId: conversationId,
            content: input,
            messageType: "text",
            replyTo: replyTo ? replyTo.id : null,
            locationId: selectedLocation?.location.id,
            organizationId: selectedLocation?.organization.id,
        };
        sendJsonMessage(payload);
        setInput("");
        setFiles([]);
        setReplyTo(null);
    }

    const handleSend = () => {
        if (!input && files.length === 0) return;

        if (files.length > 0) {
            handleSendImage()
        } else {
            handleSendText()
        }
    };

    const handleSendImage = async () => {
        try {
            const formData = new FormData();
            formData.append("conversationId", conversationId);
            formData.append("content", input);
            formData.append("organization_id", String(selectedLocation?.organization.id ?? ""));
            formData.append("location_id", String(selectedLocation?.location.id ?? ""));

            // attach a file (extend if you want multiple)
            if (files.length > 0) {
                formData.append("file", files[0] as any);
            }

            // send via REST API
            const response = await axios.post(
                `${apiUrl}/api/save-message/`,
                formData,
                {
                    headers: {
                        "Authorization": `Token ${user?.token}`,
                        "Content-Type": "multipart/form-data",
                    },
                }
            );

            const savedMessage: Message = deserializeMessage(response.data);

            setInput("");
            setFiles([]);
            setReplyTo(null);

        } catch (error) {
            console.error("Failed to send message:", error);
        }
    };

    return (
        <div className="flex flex-col h-full relative">

            {/* Header */}
            <div className="p-4 border-b bg-white shadow-sm flex items-center justify-center gap-2">
                <Text strong className="text-base">{title}</Text>
                {otherUserStatus && (
                    <span
                        className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                            otherUserStatus === "online"
                                ? "bg-green-100 text-green-600"
                                : "bg-gray-100 text-gray-500"
                        }`}
                    >
                        {otherUserStatus === "online"
                            ? "Online"
                            : lastSeen
                                ? `Last seen ${new Date(lastSeen).toLocaleString([], {
                                    month: "short",
                                    day: "numeric",
                                    hour: "2-digit",
                                    minute: "2-digit"
                                })}`
                                : "Offline"}
                    </span>
                )}
            </div>

            <div className="px-3 py-1">
                <Text strong>{connectionStatus}</Text>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-3 bg-gray-50 flex flex-col-reverse">
                <div
                    id="scrollableDiv"
                    ref={listRef}
                    className="flex-1 overflow-y-auto p-3 bg-gray-50"
                    style={{display: "flex", flexDirection: "column-reverse"}}
                >
                    <InfiniteScroll
                        dataLength={messages.length}
                        next={loadMore}
                        inverse={true}
                        hasMore={hasMore}
                        loader={
                            loadError ? (
                                <div
                                    className="w-full flex items-center justify-between bg-red-50 border border-red-200 text-red-600 px-4 py-2">
                                    <span className="text-sm font-medium">
                                      Couldn’t load messages
                                    </span>
                                    <Button
                                        type="primary"
                                        size="small"
                                        danger
                                        onClick={() => fetchMessages(page + 1)}
                                    >
                                        Retry
                                    </Button>
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center py-4 text-gray-500">
                                    <Spin size="small"/>
                                    <span className="mt-2 text-xs tracking-wide uppercase">Loading</span>
                                </div>
                            )
                        }
                        scrollableTarget="scrollableDiv"
                        style={{display: "flex", flexDirection: "column-reverse"}}
                    >
                        <List
                            dataSource={messages}
                            renderItem={(msg) => {
                                const mine = Number(msg.senderId) === Number(user?.id);
                                return (
                                    <List.Item
                                        key={msg.id}
                                        id={`message-${msg.id}`}
                                        style={{padding: 0, border: "none", background: "transparent"}}
                                    >
                                        {/* Full-width row that controls left/right placement */}
                                        <div className={`w-full flex ${mine ? "justify-end" : "justify-start"} my-1`}>
                                            <div className="flex flex-col max-w-[75%] sm:max-w-[65%] md:max-w-[55%]">
                                                {msg.replyTo && (
                                                    <div
                                                        className="text-xs text-gray-600 bg-gray-100 border-l-2 border-red-500 pl-2 pr-3 py-1 rounded mb-1 max-w-xs cursor-pointer hover:bg-gray-200 transition"
                                                        onClick={() => {
                                                            const el = document.getElementById(`message-${msg.replyTo?.id}`);
                                                            if (el) {
                                                                el.scrollIntoView({
                                                                    behavior: "smooth",
                                                                    block: "center"
                                                                });
                                                                const originalBg = el.style.backgroundColor;
                                                                el.style.backgroundColor = "#FEF3C7";
                                                                setTimeout(() => {
                                                                    el.style.backgroundColor = originalBg;
                                                                }, 2000);
                                                            }
                                                        }}
                                                    >
                                                        <div className="italic text-gray-500">Replying to:</div>
                                                        <div>
                                                            <div
                                                                className="font-semibold">{msg.replyTo.senderName}</div>
                                                            <div className="text-gray-700">{msg.replyTo.content}</div>
                                                        </div>
                                                    </div>
                                                )}

                                                {/* The bubble */}
                                                <div
                                                    className={`p-2 rounded-2xl shadow max-w-xs break-words ${
                                                        mine
                                                            ? "bg-white text-gray-900 rounded-br-sm text-right"
                                                            : "bg-white text-gray-900 rounded-bl-sm text-left"
                                                    }`}
                                                >
                                                    <div className="font-semibold text-[11px] opacity-80 mb-1">
                                                        {msg.senderName}
                                                    </div>

                                                    {/* An Image will be displayed if it exists */}
                                                    {msg.media?.url ? (
                                                        msg.media.mimeType?.startsWith("image/") ? (
                                                            <a href={msg.media.url} target="_blank"
                                                               rel="noopener noreferrer">
                                                                <img
                                                                    src={msg.media.url}
                                                                    alt={msg.media.filename || "image"}
                                                                    className="max-w-full mt-2 rounded-lg"
                                                                />
                                                            </a>
                                                        ) : (
                                                            <a
                                                                href={msg.media.url}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="text-blue-500 underline mt-2 block"
                                                            >
                                                                {msg.media.filename || "Download file"}
                                                            </a>
                                                        )
                                                    ) : msg.fileUrl ? (
                                                        <a href={msg.fileUrl} target="_blank" rel="noopener noreferrer">
                                                            <img
                                                                src={msg.fileUrl}
                                                                alt="file"
                                                                className="max-w-full mt-2 rounded-lg"
                                                            />
                                                        </a>
                                                    ) : null}

                                                    {/* Image content text */}
                                                    {msg.content &&
                                                        <div
                                                            className="whitespace-pre-wrap break-words">{msg.content}</div>}

                                                    {/* Timestamp */}
                                                    {msg.timestamp && (
                                                        <div className="text-[10px] text-gray-400 mt-1 text-right">
                                                            {new Date(msg.timestamp).toLocaleString([], {
                                                                month: "short",
                                                                day: "numeric",
                                                                hour: "2-digit",
                                                                minute: "2-digit",
                                                            })}
                                                        </div>
                                                    )}
                                                </div>

                                                <div className={`mt-1 ${mine ? "self-end" : "self-start"}`}>
                                                    <Tooltip title="Reply">
                                                        <Button
                                                            size="small"
                                                            type="text"
                                                            icon={<RollbackOutlined/>}
                                                            onClick={() => setReplyTo(msg)}
                                                        />
                                                    </Tooltip>
                                                </div>
                                            </div>
                                        </div>
                                    </List.Item>
                                );
                            }}
                        />
                    </InfiniteScroll>
                </div>
            </div>

            {/* Typing users */}
            {isTyping && typingUsers.length > 0 && (
                <div className="px-3 pb-2 pt-2 text-xs text-gray-500 italic animate-pulse">
                    <span className="font-medium text-gray-600">
                      {typingUsers.join(", ")}
                    </span>{" "}
                    {typingUsers.length > 1 ? "are" : "is"} typing<span className="animate-ping">...</span>
                </div>
            )}

            {/* Reply Context */}
            {replyTo && (
                <div
                    className="w-full text-xs text-gray-600 bg-gray-100 border-l-2 border-red-500 pl-2 pr-3 py-3 rounded mb-1 flex justify-between items-start"
                >
                    <div>
                        <div className="italic text-gray-500">Replying to:</div>
                        <div>
                            <div className="font-semibold">{replyTo.senderName}</div>
                            <div className="text-gray-700 truncate">{replyTo.content}</div>
                        </div>
                    </div>
                    <Button
                        size="small"
                        type="text"
                        icon={<CloseOutlined/>}
                        onClick={() => setReplyTo(null)}
                        className="ml-2"
                    />
                </div>
            )}

            {/* Preview Area */}
            {files.length > 0 && (
                <div className="p-2 flex justify-end">
                    <div className="flex gap-2 overflow-x-auto max-w-[70%]">
                        {files.map((file) => (
                            <div key={file.uid} className="relative">
                                {file.type?.startsWith("image/") ? (
                                    <img
                                        src={(file as any).preview || URL.createObjectURL(file as any)}
                                        alt={file.name}
                                        className="h-40 rounded shadow object-contain"
                                    />
                                ) : (
                                    <div className="p-3 bg-gray-200 rounded">{file.name}</div>
                                )}
                                <Button
                                    size="small"
                                    type="text"
                                    icon={<CloseOutlined/>}
                                    className="absolute top-0 right-0 bg-white"
                                    onClick={() =>
                                        setFiles((prev) => prev.filter((f) => f.uid !== file.uid))
                                    }
                                />
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Input Area */}
            <div className="p-2 border-t bg-white flex items-center gap-2">
                <Upload
                    beforeUpload={(file) => {
                        if (file.type.startsWith("image/")) {
                            (file as any).preview = URL.createObjectURL(file);
                        }
                        setFiles((prev) => [...prev, file]);
                        return false; // prevent auto-upload
                    }}
                    showUploadList={false} // 👈 disable AntD’s default preview
                >
                    <Button icon={<UploadOutlined/>}/>
                </Upload>

                <Button
                    icon={<SmileOutlined/>}
                    onClick={() => setShowEmoji((v) => !v)}
                />

                <Input.TextArea
                    value={input}
                    onChange={handleInputChange}
                    placeholder="Type a message..."
                    autoSize={{minRows: 1, maxRows: 4}}
                    onPressEnter={(e) => {
                        if (!e.shiftKey) {
                            e.preventDefault();
                            handleSend();
                        }
                    }}
                />

                <Button type="primary" danger icon={<SendOutlined/>} onClick={handleSend}/>
            </div>

            {/* Emoji Picker */}
            {showEmoji && (
                <div className="absolute bottom-16 left-4 z-10 bg-white border rounded shadow">
                    <Picker
                        onEmojiClick={(_, emojiObject) => handleEmojiClick(emojiObject)}
                    />
                </div>
            )}
        </div>
    );
};

export default ChatView;
