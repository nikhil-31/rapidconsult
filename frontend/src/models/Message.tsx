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
        media: data.media ? {
            url: data.media.url,
            filename: data.media.filename,
            size: data.media.size,
            mimeType: data.media.mimeType,
        } : undefined,
    };
}
