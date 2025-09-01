import {Contact} from "./Contact";

export interface OnCall {
    id: number;
    user_id: number;
    name: string;
    job_title: string;
    shift_start: string;
    shift_end: string;
    primary_contact: Contact;
}
