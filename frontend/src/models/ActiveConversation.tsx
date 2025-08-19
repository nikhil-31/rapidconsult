export interface Conversation {
    _id: string;
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
        content: string;
    } | null;
}
