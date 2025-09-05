import {Department} from "./Department";
import {Member} from "./Member";
import {OnCall} from "./OnCall";
import {Conversation} from "./ActiveConversation";


export interface Unit {
    id: number;
    name: string;
    display_picture: string | null;
    members: Member[];
    department: Department;
    oncall?: OnCall[];
    conversation?: Conversation
}
