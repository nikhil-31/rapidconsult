import {OrgProfile} from "./OrgProfile";
import {Department} from "./Department";
import {Unit} from "./Unit";

export interface Consultation {
    id: number;
    patient_name: string;
    patient_age: number;
    patient_sex: "male" | "female" | "other";
    ward: string | null;
    referred_by_doctor: OrgProfile;
    referred_to_doctor: OrgProfile;
    urgency: "routine" | "urgent" | "emergency" | string;
    diagnosis: string;
    reason_for_referral: string;
    status: "pending" | "in_progress" | "completed" | "closed" | string;
    consultant_remarks: string | null;
    consultant_review: string | null;
    review_notes: string | null;
    consultation_datetime: string | null;
    closed_at: string | null;
    organization: number | null;
    location: number | null;
    created_at: string;
    updated_at: string;
    department: Department;
    unit: Unit;
}
