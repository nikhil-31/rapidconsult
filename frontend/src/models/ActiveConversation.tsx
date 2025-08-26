export interface Conversation {
    _id: string;
    user_id: string;
    conversationId: string;
    conversationType: 'direct' | 'group';
    directMessage: {
        otherParticipantId: string;
        otherParticipantName: string;
        otherParticipantAvatar: string | null;
        otherParticipantStatus: string;
    } | null;
    groupChat: {
        name: string;
        description: string;
        avatar: string | null;
        memberCount: number;
        adminIds: string[];
        myRole: string;
    } | null;
    lastMessage: {
        messageId: string;
        content: string;
        senderId: string;
        senderName: string;
        timestamp: string;
        type: string;
    } | null;
    unreadCount: number;
    lastReadAt: string;
    isPinned: boolean;
    isMuted: boolean;
    isArchived: boolean;
    customNotifications: boolean;
    draft: string;
    updatedAt: string;
}
