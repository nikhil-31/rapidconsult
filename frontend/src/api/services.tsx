// src/api/services.ts
import api from "./axios";
import endpoints from "./endpoints";
import {PaginatedResponse} from "../models/PaginatedResponse";
import {Conversation} from "../models/ActiveConversation";

// Get active conversations
export const getActiveConversations = async (
    userId: string,
    organizationId: number,
    locationId: number,
    page_no: number,
): Promise<PaginatedResponse<Conversation>> => {
    const res = await api.get<PaginatedResponse<Conversation>>(
        endpoints.activeConversations,
        {
            params: {
                user_id: userId,
                organization_id: organizationId,
                location_id: locationId,
                page: page_no
            },
        }
    );
    return res.data;
};
