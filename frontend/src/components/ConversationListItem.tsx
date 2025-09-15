import React from "react";
import {Avatar, Badge, List, Typography} from "antd";
import {Conversation} from "../models/ActiveConversation";

const {Text} = Typography;

interface Props {
    conv: Conversation;
    userId: string | undefined;
    activeConversation: Conversation | null;
    onSelect: (conv: Conversation) => void;
}

const ConversationListItem: React.FC<Props> = ({
                                                   conv,
                                                   userId,
                                                   activeConversation,
                                                   onSelect,
                                               }) => {
    const isDirect = conv.conversationType === "direct";
    const name = isDirect
        ? conv.directMessage?.otherParticipantName
        : conv.groupChat?.name;
    const avatarUrl = isDirect
        ? conv.directMessage?.otherParticipantAvatar
        : conv.groupChat?.avatar;

    let lastMessage = "No messages yet";
    if (conv.lastMessage) {
        let displayContent = conv.lastMessage.content;
        if (
            (!displayContent || displayContent.trim() === "") &&
            conv.lastMessage.type === "file"
        ) {
            displayContent = "Media";
        }
        if (conv.lastMessage.senderId === userId) {
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
                padding: "8px 16px",
                cursor: "pointer",
                background:
                    activeConversation?.conversationId === conv.conversationId
                        ? "#f0f5ff"
                        : "transparent",
            }}
            onClick={() => onSelect(conv)}
            extra={
                conv.unreadCount > 0 ? (
                    <Badge
                        count={conv.unreadCount}
                        style={{
                            backgroundColor: "#f5222d",
                            boxShadow: "0 0 0 1px #fff",
                        }}
                    />
                ) : null
            }
        >
            <List.Item.Meta
                avatar={
                    <Avatar src={avatarUrl || undefined}>{!avatarUrl && name?.[0]}</Avatar>
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
};

export default ConversationListItem;
