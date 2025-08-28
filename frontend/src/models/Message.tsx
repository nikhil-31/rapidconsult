export interface Message {
    id: string;
    conversationId: string;
    senderId: string;
    senderName: string;
    content: string;
    type: string;
    timestamp: string;
    fileUrl?: string;
    replyTo?: Message;
    readBy?: {
        userId: string;
        readAt: string;
    }[]
    media?: {
        url: string,
        filename: string,
        size: number;
        mimeType: string;
    }
}

export function deserializeMessage(data: any): Message {
    return {
        id: data.id,
        conversationId: data.conversationId,
        senderId: data.senderId,
        senderName: data.senderName,
        content: data.content,
        type: data.type,
        timestamp: data.timestamp,
        replyTo: data.replyTo,
        readBy: data.readBy
            ? data.readBy.map((r: any) => ({
                userId: r.userId,
                readAt: r.readAt,
            })) : [],
        media:
            data.media ? {
                url: data.media.url,
                filename: data.media.filename,
                size: data.media.size,
                mimeType: data.media.mimeType,
            } : undefined,
    }
}
