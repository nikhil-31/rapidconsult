import React, {useState, useEffect, useContext} from "react";
import {Input, Button, Upload, List, Tooltip, Typography} from "antd";
import {
    UploadOutlined, SendOutlined, SmileOutlined, RollbackOutlined, CloseOutlined,
} from "@ant-design/icons";
import type {UploadFile} from "antd/es/upload/interface";
import Picker from "emoji-picker-react";
import {Conversation} from "../models/ActiveConversation";
import useWebSocket, {ReadyState} from "react-use-websocket";
import {AuthContext} from "../contexts/AuthContext";
import {useOrgLocation} from "../contexts/LocationContext";

const {Text} = Typography;

interface Message {
    id: string;
    sender: string;
    text?: string;
    fileUrl?: string;
    replyTo?: Message;
}

interface ChatViewProps {
    conversation: Conversation;
}

const ChatView: React.FC<ChatViewProps> = ({conversation}) => {
    const apiUrl = process.env.REACT_APP_API_URL;
    const wsUrl = process.env.REACT_APP_WS_URL;

    const {user} = useContext(AuthContext);
    const [selectedLocationId, setSelectedLocationId] = useState<number | null>(null);
    const {selectedLocation} = useOrgLocation();
    const [conversationId, setConversationId] = useState("");
    const [welcomeMessage, setWelcomeMessage] = useState("");

    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState("");
    const [files, setFiles] = useState<UploadFile[]>([]);
    const [showEmoji, setShowEmoji] = useState(false);
    const [replyTo, setReplyTo] = useState<Message | null>(null);


    // Reset messages when conversation changes
    useEffect(() => {
        if (conversation) {
            setConversationId(conversation.conversationId)
            // setMessages([]); // could also fetch from API here
            setInput("");
            setFiles([]);
            // setReplyTo(null);
        }
    }, [conversation]);

    // TODO - Handle message send, this has to be removed
    const handleSend = () => {
        if (!input) return;
        const payload = {
            type: "chat_message",
            conversationId: conversationId,
            content: input,
            messageType: files.length > 0 ? "image" : "text", // simple switch
            replyTo: replyTo ? replyTo.id : null,
            locationId: selectedLocation?.location.id,
            organizationId: selectedLocation?.organization.id,
        };

        // Send message to server
        sendJsonMessage(payload);

        // Reset UI state
        setInput("");
        setFiles([]);
        setReplyTo(null);
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
            onOpen: () => {
                // pingRef.current = setInterval(() => sendJsonMessage({type: "ping"}), 30000);
            },
            onClose: () => {
                // if (pingRef.current) clearInterval(pingRef.current);
            },
            onError: (e) => console.error("WebSocket Error:", e),
            onMessage: (e) => {
                const data = JSON.parse(e.data);
                switch (data.type) {
                    case "welcome_message":
                        setWelcomeMessage(data.message);
                        break;
                    case "chat_message_echo":
                        const newMsg: Message = {
                            id: data.id,
                            sender: data.senderId === user?.id ? "Me" : data.senderId,
                            text: data.content,
                            replyTo: data.replyTo,
                        };
                        setMessages((prev) => [...prev, newMsg]);
                        break;
                    case "last_50_messages":
                        const history = data.messages.map((msg: any) => ({
                            id: msg.id,
                            sender: msg.senderId === user?.id ? "Me" : msg.senderId,
                            text: msg.content,
                            replyTo: msg.replyTo,
                        }));
                        setMessages(history);
                        break;
                    case "typing":

                        break;
                    case "user_join":

                        break;
                    case "user_leave":

                        break;
                    case "online_user_list":

                        break;
                    case "message_read":

                        break;
                    default:
                        break;
                }
            },
        }
    );

    const connectionStatus = {
        [ReadyState.CONNECTING]: "Connecting",
        [ReadyState.OPEN]: "Open",
        [ReadyState.CLOSING]: "Closing",
        [ReadyState.CLOSED]: "Closed",
        [ReadyState.UNINSTANTIATED]: "Uninstantiated",
    }[readyState];

    useEffect(() => {
        if (connectionStatus === "Open") {
            console.log(`Connection status ${connectionStatus}`)
        }
    }, [connectionStatus]);

    const handleEmojiClick = (emojiObject: any) => {
        setInput((prev) => prev + emojiObject.emoji);
    };

    const title =
        conversation.conversationType === "direct"
            ? conversation.directMessage?.otherParticipantName
            : conversation.groupChat?.name;

    return (
        <div className="flex flex-col h-full relative">

            {/* Header */}
            <div className="p-3 border-b bg-white shadow-sm flex justify-center">
                <Text strong>{title}</Text>
            </div>

            <div>
                <Text strong>{connectionStatus}</Text>
            </div>

            {/* Chat Window */}
            <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
                <List
                    dataSource={messages}
                    renderItem={(msg) => (

                        <List.Item
                            key={msg.id}
                            className={`flex flex-col ${
                                msg.sender === "Me" ? "items-end" : "items-start"
                            }`}
                        >
                            {msg.replyTo && (
                                <div className="text-xs bg-gray-200 p-1 px-2 rounded mb-1">
                                    Replying to: <b>{msg.replyTo.sender}</b> – {msg.replyTo.text}
                                </div>
                            )}
                            <div className="bg-white p-2 rounded shadow max-w-xs">
                                <div className="font-semibold">{msg.sender}</div>
                                {msg.text && <div>{msg.text}</div>}
                                {msg.fileUrl && (
                                    <a
                                        href={msg.fileUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                    >
                                        <img
                                            src={msg.fileUrl}
                                            alt="file"
                                            className="max-w-[200px] mt-1 rounded"
                                        />
                                    </a>
                                )}
                            </div>
                            <Tooltip title="Reply">
                                <Button
                                    size="small"
                                    type="text"
                                    icon={<RollbackOutlined/>}
                                    onClick={() => setReplyTo(msg)}
                                />
                            </Tooltip>
                        </List.Item>
                    )}
                />
            </div>

            {/* Reply Context */}
            {replyTo && (
                <div className="bg-gray-100 px-2 py-1 text-sm flex items-center justify-between">
                    Replying to: <b>{replyTo.sender}</b> – {replyTo.text}
                    <Button
                        size="small"
                        type="text"
                        icon={<CloseOutlined/>}
                        onClick={() => setReplyTo(null)}
                    />
                </div>
            )}

            {/* Input Area */}
            <div className="p-2 border-t flex items-center gap-2">
                <Upload
                    beforeUpload={(file) => {
                        setFiles([file]);
                        return false; // prevent auto upload
                    }}
                    fileList={files}
                    onRemove={(file) => {
                        setFiles(files.filter((f) => f.uid !== file.uid));
                    }}
                >
                    <Button icon={<UploadOutlined/>}/>
                </Upload>

                <Button
                    icon={<SmileOutlined/>}
                    onClick={() => setShowEmoji(!showEmoji)}
                />

                <Input.TextArea
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Type a message..."
                    autoSize={{minRows: 1, maxRows: 4}}
                />

                <Button type="primary" icon={<SendOutlined/>} onClick={handleSend}/>
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
