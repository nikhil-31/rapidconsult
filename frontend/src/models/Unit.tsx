import {Department} from "./Department";
import {Member} from "./Member";


export interface Unit {
    id: number;
    name: string;
    display_picture: string | null;
    members: Member[];
    department: Department
}
