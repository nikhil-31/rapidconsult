export interface Message {
    id: string;
    conversationId: string;
    senderId: string;
    senderName: string;
    content: string;
    messageType: string;
    timestamp: string;
    fileUrl?: string;
    replyTo?: Message;
}

export function deserializeMessage(data: any): Message {
    return {
        id: data.id,
        conversationId: data.conversationId,
        senderId: data.senderId,
        senderName: data.senderName,
        content: data.content,
        messageType: data.messageType,
        timestamp: data.timestamp,
        replyTo: data.replyTo,
    };
}
