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
import {deserializeMessage, Message} from "../models/Message";

const {Text} = Typography;


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
            setConversationId(conversation.conversationId);
            setInput("");
            setFiles([]);
        }
    }, [conversation]);

    const handleSend = () => {
        if (!input) return;
        const payload = {
            type: "chat_message",
            conversationId: conversationId,
            content: input,
            messageType: files.length > 0 ? "image" : "text",
            replyTo: replyTo ? replyTo.id : null,
            locationId: selectedLocation?.location.id,
            organizationId: selectedLocation?.organization.id,
        };

        sendJsonMessage(payload);
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
            onMessage: (e) => {
                const data = JSON.parse(e.data);
                switch (data.type) {
                    case "welcome_message":
                        setWelcomeMessage(data.message);
                        break;
                    case "chat_message_echo":
                        const newMessage: Message = deserializeMessage(data.message);
                        setMessages((prev) => [...prev, newMessage]);
                        break;
                    case "last_50_messages":
                        const history = data.messages.map((msg: any) => (deserializeMessage(msg)));
                        setMessages(history);
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

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 bg-gray-50 flex flex-col-reverse">
                <List
                    dataSource={messages}
                    renderItem={(msg) => (
                        <List.Item
                            key={msg.id}
                            className={`flex ${
                                msg.senderId === user?.id ? "justify-end" : "justify-start"
                            }`}
                        >
                            <div className="flex flex-col max-w-xs">
                                {msg.replyTo && (
                                    <div className="text-xs bg-gray-200 p-1 px-2 rounded mb-1">
                                        Replying to: <b>{msg.replyTo.senderName}</b> – {msg.replyTo.content}
                                    </div>
                                )}
                                <div
                                    className={`p-2 rounded-lg shadow ${
                                        msg.senderId === user?.id
                                            ? "bg-blue-500 text-white rounded-br-none"
                                            : "bg-white text-black rounded-bl-none"
                                    }`}
                                >
                                    <div className="font-semibold text-xs mb-1">
                                        {msg.senderName}
                                    </div>
                                    {msg.content && <div>{msg.content}</div>}
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
                                    {/* Timestamp */}
                                    {msg.timestamp && (
                                        <div className="text-[10px] text-gray-400 mt-1 text-right">
                                            {new Date(msg.timestamp).toLocaleString([], {
                                                // year: "numeric",
                                                month: "short",
                                                day: "numeric",
                                                hour: "2-digit",
                                                minute: "2-digit",
                                            })}
                                        </div>
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
                            </div>
                        </List.Item>
                    )}
                />
            </div>

            {/* Reply Context */}
            {replyTo && (
                <div className="bg-gray-100 px-2 py-1 text-sm flex items-center justify-between">
                    Replying to: <b>{replyTo.senderName}</b> – {replyTo.content}
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
                        return false;
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
