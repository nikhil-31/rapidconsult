// src/api/services.ts
import api from "./axios";
import endpoints from "./endpoints";
import {PaginatedResponse} from "../models/PaginatedResponse";
import {Conversation} from "../models/ActiveConversation";
import {Department} from "../models/Department";
import {Location} from "../models/Location";
import {UserModel} from "../models/UserModel";
import {Unit} from "../models/Unit";
import {Message} from "../models/Message";

// Get active conversations
export const getActiveConversations = async (
    userId: string,
    organizationId: number,
    locationId: number,
    page_no: number,
    search: string,
): Promise<PaginatedResponse<Conversation>> => {
    const res = await api.get<PaginatedResponse<Conversation>>(
        endpoints.activeConversations,
        {
            params: {
                user_id: userId,
                organization_id: organizationId,
                location_id: locationId,
                page: page_no,
                search: search,
            },
        }
    );
    return res.data;
};

export const getLocations = async (
    organizationId: string,
    page: number = 1,
    pageSize: number = 20
): Promise<PaginatedResponse<Location>> => {
    const res = await api.get<PaginatedResponse<Location>>(endpoints.locations, {
        params: {
            organization_id: organizationId,
            page: page,
            page_size: pageSize,
        },
    });
    return res.data;
};

// Get departments
export const getDepartments = async (
    organizationId: string,
    page: number = 1,
    pageSize: number = 20
): Promise<PaginatedResponse<Department>> => {
    const res = await api.get<PaginatedResponse<Department>>(endpoints.departments, {
        params: {
            organization_id: organizationId,
            page,
            page_size: pageSize,
        },
    });
    return res.data;
};

// Get Users
export const getUsers = async (
    organizationId: string,
    page: number = 1,
    pageSize: number = 20,
): Promise<PaginatedResponse<UserModel>> => {
    const res = await api.get<PaginatedResponse<UserModel>>(
        endpoints.users,
        {
            params: {
                organization: organizationId,
                page: page,
                page_size: pageSize,
            },
        });
    return res.data;
};

// Get units with pagination
export const getUnits = async (
    organizationId: string,
    page: number = 1,
    pageSize: number = 20,
): Promise<PaginatedResponse<Unit>> => {
    const res = await api.get<PaginatedResponse<Unit>>(
        endpoints.units,
        {
            params: {
                organization_id: organizationId,
                page,
                page_size: pageSize,
            },
        });
    return res.data;
};

// Get messages
export const getMessages = async (
    conversationId: string,
    organizationId: number,
    locationId: number,
    page: number,
    pageSize: number = 50,
): Promise<PaginatedResponse<Message>> => {
    const res = await api.get<PaginatedResponse<Message>>(endpoints.messages, {
        params: {
            conversation_id: conversationId,
            page,
            page_size: pageSize,
            organization_id: organizationId,
            location_id: locationId,
        }
    });
    return res.data;
};

// Create a Text/ Image message
export const sendMessage = async (
    conversationId: string,
    organizationId: string,
    locationId: string,
    content: string,
    file?: File
): Promise<Message> => {
    const formData = new FormData();
    formData.append("conversationId", conversationId);
    formData.append("content", content);
    formData.append("organization_id", String(organizationId));
    formData.append("location_id", String(locationId));

    if (file) {
        formData.append("file", file);
    }

    const res = await api.post<Message>(
        endpoints.saveMessage, formData
    );

    return res.data;
};

// Create a new consultation
// export const createConsultation = async (
//     payload: ConsultationPayload
// ): Promise<any> => {
//     const res = await api.post("/api/consultations/", payload, {
//         headers: {
//             Authorization: `Token ${localStorage.getItem("token")}`,
//         },
//     });
//     return res.data;
// };
