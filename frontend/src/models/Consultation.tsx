export interface Consultation {
    id: string;
    patientName: string;
    patientAge: number;
    patientSex: 'male' | 'female' | 'other';
    department: string;
    ward: string;
    referredByDoctorId: string;
    referredToDoctorId: string;
    urgency: 'routine' | 'urgent' | 'emergency' | string;
    diagnosis: string;
    reasonForReferral: string;
    status: 'pending' | 'accepted' | 'completed' | 'rejected' | string;
    consultantRemarks: string | null;
    consultantReview: string | null;
    reviewNotes: string | null;
    createdAt: string; // ISO date string
    updatedAt: string; // ISO date string
    consultationDateTime: string; // ISO date string
    closedAt: string | null; // ISO date string or null
    locationId: string;
    organizationId: string;
    unitId: string;
}

