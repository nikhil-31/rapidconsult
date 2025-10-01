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
import {ProfileData} from "../models/ProfileData";
import {Contact} from "../models/Contact";

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

// Get Locations
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
    const res = await api.get<PaginatedResponse<Department>>(endpoints.departmentsOrg, {
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

// Get user profile
export const getUserProfile = async (userId: string): Promise<ProfileData> => {
    const res = await api.get<ProfileData>(`${endpoints.userProfile}${userId}/`);
    return res.data;
};

// Search users
export const searchUsers = async (query: string): Promise<UserModel[]> => {
    const res = await api.get(endpoints.userSearch, {
        params: {q: query},
    });

    // Normalize response to always be an array
    if (Array.isArray(res.data)) {
        return res.data;
    } else if (Array.isArray(res.data.results)) {
        return res.data.results;
    } else {
        return [];
    }
};

// Create department
export const createDepartment = async (formData: FormData) => {
    const res = await api.post(endpoints.departments, formData, {
        headers: {"Content-Type": "multipart/form-data"},
    });
    return res.data;
};

// Update department
export const updateDepartment = async (departmentId: number, formData: FormData) => {
    const res = await api.patch(`${endpoints.departments}${departmentId}/`, formData, {
        headers: {"Content-Type": "multipart/form-data"},
    });
    return res.data;
};

// Get profile
export const getProfile = async (): Promise<ProfileData> => {
    const res = await api.get<ProfileData>(endpoints.profileMe);
    return res.data;
};

// Update profile (with FormData for file upload)
export const updateProfile = async (formData: FormData) => {
    const res = await api.patch(endpoints.profileMe, formData, {
        headers: {"Content-Type": "multipart/form-data"},
    });
    return res.data;
};

// Add contact
export const addContact = async (contact: Partial<Contact>) => {
    const res = await api.post(endpoints.contacts, contact);
    return res.data;
};

// Update contact
export const updateContact = async (contactId: number, contact: Partial<Contact>) => {
    const res = await api.put(`${endpoints.contacts}${contactId}/`, contact);
    return res.data;
};

// Delete contact
export const deleteContact = async (contactId: number) => {
    const res = await api.delete(`${endpoints.contacts}${contactId}/`);
    return res.data;
};

// update shift
export const updateShift = async (
    shiftId: number,
    start_time: string,
    end_time: string
) => {
    const res = await api.patch(`${endpoints.shifts}${shiftId}/`, {
        start_time,
        end_time,
    });
    return res.data;
};

// Delete shift
export const deleteShift = async (shiftId: number) => {
    const res = await api.delete(`${endpoints.shifts}${shiftId}/`);
    return res.data;
};

// Create location
export const createLocation = async (formData: FormData): Promise<Location> => {
  const res = await api.post<Location>(endpoints.locations, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.data;
};

// update location
export const updateLocation = async (
  id: string | number,
  formData: FormData
): Promise<Location> => {
  const res = await api.patch<Location>(`${endpoints.locations}${id}/`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
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
