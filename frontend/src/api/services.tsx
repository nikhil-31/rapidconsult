// src/api/services.ts
import api from "./axios";
import endpoints from "./endpoints";
import {AxiosResponse} from "axios";
import {PaginatedResponse} from "../models/PaginatedResponse";
import {Conversation} from "../models/ActiveConversation";
import {Department} from "../models/Department";
import {Location} from "../models/Location";
import {UserModel} from "../models/UserModel";
import {Unit} from "../models/Unit";
import {Message} from "../models/Message";
import {ProfileData} from "../models/ProfileData";
import {Contact} from "../models/Contact";
import {Shift} from "../models/Shift";
import {UnitMembership} from "../models/UnitMembership";
import {Role} from "../models/Role";
import {Consultation} from "../models/Consultation";

// Get all pages
const fetchAllPages = async <T, >(
    endpoint: string,
    params: Record<string, any> = {}
): Promise<T[]> => {
    let results: T[] = [];
    let nextUrl: string | null = endpoint;
    let currentParams = {...params};

    while (nextUrl) {
        const res: AxiosResponse<PaginatedResponse<T>> = await api.get(nextUrl, {
            params: currentParams,
        });

        results = [...results, ...res.data.results];
        nextUrl = res.data.next ? res.data.next.replace(api.defaults.baseURL!, "") : null;
        currentParams = {};
    }
    return results;
};

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
        endpoints.usersAll,
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

// Create location
export const createLocation = async (formData: FormData): Promise<Location> => {
    const res = await api.post<Location>(endpoints.locations, formData, {
        headers: {"Content-Type": "multipart/form-data"},
    });
    return res.data;
};

// update location
export const updateLocation = async (
    id: string | number,
    formData: FormData
): Promise<Location> => {
    const res = await api.patch<Location>(`${endpoints.locations}${id}/`, formData, {
        headers: {"Content-Type": "multipart/form-data"},
    });
    return res.data;
};

// Create or get a direct conversation
export const startDirectConversation = async (
    user1Id: string | undefined,
    user2Id: string | number | undefined,
    organizationId: string | number | undefined,
    locationId: string | number | undefined
): Promise<{ conversation_id: string }> => {
    const res = await api.post(endpoints.activeConversations, {
        type: "direct",
        user1_id: user1Id,
        user2_id: user2Id,
        organization_id: organizationId,
        location_id: locationId,
    });
    return res.data;
};

// Get departments by location
export const getDepartmentsByLocation = async (
    locationId: number,
    page: number = 1,
    pageSize: number = 20
): Promise<Department[]> => {
    const res = await api.get<PaginatedResponse<Department>>(endpoints.departments, {
        params: {
            location_id: locationId,
            page,
            page_size: pageSize,
        },
    });
    return res.data.results;
};

// Get units by department
export const getUnitsByDepartment = async (
    departmentId: number,
    page: number = 1,
    pageSize: number = 20
): Promise<Unit[]> => {
    const res = await api.get<PaginatedResponse<Unit>>(endpoints.units, {
        params: {
            department_id: departmentId,
            page,
            page_size: pageSize,
        },
    });
    return res.data.results;
};

// Login request
export const loginRequest = async (username: string, password: string): Promise<UserModel> => {
    const response = await api.post(endpoints.authToken, {username, password});
    return response.data;
};

// Get shifts by unit
export const getShiftsByUnit = async (
    unitId: number,
    shiftType: string | undefined,
): Promise<Shift[]> => {
    const params = {
        unit: unitId,
        shift_type: shiftType
    };
    return await fetchAllPages<Shift>(endpoints.shifts, params);
};

// Get my shifts
export const getMyShifts = async (
    userOrgProfileId: string | null,
    selectedLocationId: number | null,
    shiftType: string | undefined,
): Promise<Shift[]> => {
    const params = {
        user: userOrgProfileId,
        location: selectedLocationId,
        shift_type: shiftType
    };
    return await fetchAllPages<Shift>(endpoints.shifts, params);
};

// Delete shift
export const deleteShift = async (id: number): Promise<void> => {
    const url = `${endpoints.shifts}${id}/`;
    return await api.delete(url);
};

// Update shift
export const updateShift = async (
    shiftId: number,
    start_time: string,
    end_time: string
) => {
    const res = await api.patch(`${endpoints.shifts}${shiftId}/`, {
        start_time,
        end_time
    });
    return res.data;
};

// Create shift
export const createShift = async (payload: {
    user: number;
    unit: number;
    start_time: string;
    end_time: string;
    shift_type: string;
}): Promise<Shift> => {
    const res = await api.post<Shift>(endpoints.shifts, payload);
    return res.data;
};

// Get unit details by id
export const getUnitById = async (unitId: number): Promise<Unit> => {
    const res = await api.get<Unit>(`${endpoints.units}${unitId}/`);
    return res.data;
};

// Add a user as a member to unit
export const addUnitMember = async (
    unitId: number,
    orgUserId: number,
    isAdmin: boolean = false
): Promise<UnitMembership> => {
    const res = await api.post<UnitMembership>(`${endpoints.unitMemberships}`, {
        unit: unitId,
        user: orgUserId,
        is_admin: isAdmin,
    });
    return res.data;
};

// Remove unit members for a user
export const deleteUnitMember = async (id: number): Promise<void> => {
    return await api.delete(`${endpoints.unitMemberships}${id}/`);
};

// Add or remove admin status for unit members
export const updateUnitMemberAdminStatus = async (
    id: number,
    isAdmin: boolean
): Promise<UnitMembership> => {
    const res = await api.patch<UnitMembership>(
        `${endpoints.unitMemberships}${id}/`,
        {is_admin: isAdmin}
    );
    return res.data;
};

// Create unit
export const createUnit = async (formData: FormData): Promise<Unit> => {
    const res = await api.post<Unit>(`${endpoints.units}`, formData, {
        headers: {
            'Content-Type': 'multipart/form-data',
        },
    });
    return res.data;
};

// Update unit
export const updateUnit = async (
    unitId: number,
    formData: FormData
): Promise<Unit> => {
    const res = await api.patch<Unit>(
        `${endpoints.units}${unitId}/`,
        formData,
        {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        }
    );
    return res.data;
};

// Fetch roles
export const fetchRoles = async (): Promise<Role[]> => {
    const res = await api.get<PaginatedResponse<Role>>(`${endpoints.roles}`);
    return res.data.results;
};

// Create user
export const createUser = async (
    formData: FormData
): Promise<UserModel> => {
    const res = await api.post<UserModel>(`${endpoints.userRegister}`, formData, {
        headers: {
            'Content-Type': 'multipart/form-data',
        },
    });
    return res.data;
};

// Update user
export const updateUser = async (
    username: string,
    formData: FormData
): Promise<UserModel> => {
    const res = await api.patch<UserModel>(
        `${endpoints.users}${username}/`,
        formData,
        {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        }
    );
    return res.data;
};

// Allowed locations
export const updateAllowedLocations = async (
    orgProfileId: number,
    allowedLocations: number[]
): Promise<void> => {
    return await api.patch(
        `${endpoints.allowedLocations}${orgProfileId}/update-locations/`,
        {allowed_locations: allowedLocations},
        {
            headers: {
                'Content-Type': 'application/json',
            },
        }
    );
};

// Create consultation
export const createConsultation = async (
    values: Partial<Consultation>
): Promise<Consultation> => {
    const res = await api.post<Consultation>(`${endpoints.consultations}`, values);
    return res.data;
};

// Get Consultation
export const getConsultationsByStatus = async (
    status: "pending" | "in_progress" | "completed" | "closed"
): Promise<Consultation[]> => {
    const response = await api.get(endpoints.consultations, {
        params: {
            status: status
        },
    });
    return response.data.results;
};
