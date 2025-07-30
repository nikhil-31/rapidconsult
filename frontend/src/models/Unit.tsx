import {Department} from "./Department";


export interface Unit {
    id: number;
    name: string;
    display_picture: string | null;
    members: {
        user: number;
        is_admin: boolean;
    }[];
    department: Department
}
