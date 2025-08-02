import {Address} from "./Address";

export interface Organization {
    id: number;
    address: Address;
    name: string;
    display_picture: string | null;
}
