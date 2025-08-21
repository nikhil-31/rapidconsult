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
    onNewMessage: (conversationId: string, message: Message) => void;
}

const ChatView: React.FC<ChatViewProps> = ({conversation, onNewMessage}) => {
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

                        if (onNewMessage) {
                            onNewMessage(conversationId, newMessage);
                        }
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

            <div className="px-3 py-1">
                <Text strong>{connectionStatus}</Text>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-3 bg-gray-50 flex flex-col-reverse">
                <List
                    dataSource={messages}
                    renderItem={(msg) => {
                        const mine = Number(msg.senderId) === Number(user?.id);
                        return (
                            <List.Item
                                key={msg.id}
                                style={{padding: 0, border: "none", background: "transparent"}}
                            >
                                {/* Full-width row that controls left/right placement */}
                                <div className={`w-full flex ${mine ? "justify-end" : "justify-start"} my-1`}>
                                    <div className="flex flex-col max-w-[75%] sm:max-w-[65%] md:max-w-[55%]">
                                        {msg.replyTo && (
                                            <div
                                                className="text-xs text-gray-600 bg-gray-100 border-l-2 border-red-500 pl-2 pr-3 py-1 rounded mb-1 max-w-xs">
                                                <div className="italic text-gray-500">Replying to:</div>
                                                <div>
                                                    <div className="font-semibold">{msg.replyTo.senderName}</div>
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

                                            {msg.content &&
                                                <div className="whitespace-pre-wrap break-words">{msg.content}</div>}

                                            {msg.fileUrl && (
                                                <a href={msg.fileUrl} target="_blank" rel="noopener noreferrer">
                                                    <img
                                                        src={msg.fileUrl}
                                                        alt="file"
                                                        className="max-w-full mt-2 rounded-lg"
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
            </div>

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

            {/* Input Area */}
            <div className="p-2 border-t bg-white flex items-center gap-2">
                <Upload
                    beforeUpload={(file) => {
                        setFiles([file]);
                        return false; // prevent auto upload
                    }}
                    fileList={files}
                    onRemove={(file) => {
                        setFiles((prev) => prev.filter((f) => f.uid !== file.uid));
                    }}
                >
                    <Button icon={<UploadOutlined/>}/>
                </Upload>

                <Button
                    icon={<SmileOutlined/>}
                    onClick={() => setShowEmoji((v) => !v)}
                />

                <Input.TextArea
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
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
