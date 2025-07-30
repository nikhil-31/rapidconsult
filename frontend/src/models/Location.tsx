import {Address} from "./Address";

export interface Location {
    id: number;
    name: string;
    organization: string;
    address: Address;
    display_picture: string | null;
}
