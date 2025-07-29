import { Address } from "./Address";

export interface Location {
  id: number;
  name: string;
  address: Address;
  display_picture: string | null;
}
