import React from "react";
import {List, Button, Tooltip} from "antd";
import {RollbackOutlined} from "@ant-design/icons";
import {Message} from "../models/Message";

interface ChatBubbleProps {
    msg: Message;
    userId: string | undefined;
    setReplyTo: (msg: Message) => void;
}

export const ChatBubble: React.FC<ChatBubbleProps> = ({msg, userId, setReplyTo}) => {
    const mine = Number(msg.senderId) === Number(userId);

    // Helper to format consult message content
    const renderConsultContent = (content: string) => {
        const lines = content.split("\n").filter(line => line.trim() !== "");
        return (
            <div className="space-y-1">
                {lines.map((line, index) => {
                    const [label, value] = line.split(":").map(s => s.trim());
                    return (
                        <div key={index}>
                            <span className="text-white/80">{label}:</span>{" "}
                            <span className="font-semibold text-white">{value}</span>
                        </div>
                    );
                })}
            </div>
        );
    };

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
                                    el.scrollIntoView({behavior: "smooth", block: "center"});
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
                                <div className="font-semibold">{msg.replyTo.senderName}</div>
                                <div className="text-gray-700">{msg.replyTo.content}</div>
                            </div>
                        </div>
                    )}

                    {/* Message bubble */}
                    <div
                        className={`p-2 rounded-2xl shadow max-w-xs break-words ${
                            msg.type === "consult"
                                ? "bg-red-500 text-white"
                                : mine
                                    ? "bg-white text-gray-900 rounded-br-sm text-right"
                                    : "bg-white text-gray-900 rounded-bl-sm text-left"
                        }`}
                    >
                        <div
                            className={`font-semibold text-[11px] mb-1 ${
                                msg.type === "consult" ? "opacity-90" : "opacity-80"
                            }`}
                        >
                            {msg.senderName}
                        </div>

                        {/* Media / attachments */}
                        {msg.media?.url ? (
                            msg.media.mimeType?.startsWith("image/") ? (
                                <a href={msg.media.url} target="_blank" rel="noopener noreferrer">
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
                                    className={`mt-2 block underline ${
                                        msg.type === "consult"
                                            ? "text-blue-200"
                                            : "text-blue-500"
                                    }`}
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

                        {/* Message content */}
                        {msg.content && (
                            <div className="whitespace-pre-wrap break-words">
                                {msg.type === "consult"
                                    ? renderConsultContent(msg.content)
                                    : msg.content}
                            </div>
                        )}

                        {/* Timestamp */}
                        {msg.timestamp && (
                            <div
                                className={`text-[10px] mt-1 text-right ${
                                    msg.type === "consult" ? "text-white/70" : "text-gray-400"
                                }`}
                            >
                                {new Date(msg.timestamp).toLocaleString([], {
                                    month: "short",
                                    day: "numeric",
                                    hour: "2-digit",
                                    minute: "2-digit",
                                })}
                            </div>
                        )}
                    </div>

                    {/* Reply button */}
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
};
