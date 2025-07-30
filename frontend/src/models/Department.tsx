import {Location} from "./Location";

export interface Department {
    id: number;
    name: string;
    display_picture: string | null;
    location_details: Location
}
