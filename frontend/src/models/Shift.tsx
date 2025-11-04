import {OrgProfile} from "./OrgProfile";
import {Unit} from "./Unit";

export interface Shift {
    id: number;
    start_time: string;
    end_time: string;
    user_details: OrgProfile;
    shift_type: string;
    unit_details: Unit;
}
