import {createContext, useContext, useState, useEffect, ReactNode} from 'react';
import {OrgLocation} from '../models/OrgLocation';
import {AuthContext} from "./AuthContext";

interface LocationContextType {
    selectedLocation: OrgLocation | null;
    setSelectedLocation: (location: OrgLocation | null) => void;
}

const LocationContext = createContext<LocationContextType | undefined>(undefined);

export const LocationProvider = ({children}: { children: ReactNode }) => {
    const [selectedLocation, setSelectedLocationState] = useState<OrgLocation | null>(null);
    const {user} = useContext(AuthContext);

    // Load from localStorage on mount
    useEffect(() => {
        const stored = localStorage.getItem('selected_location');
        if (stored) {
            try {
                setSelectedLocationState(JSON.parse(stored));
            } catch {
                localStorage.removeItem('selected_location');
            }
        }
    }, []);

    // Load from localstorage on login
    useEffect(() => {
        const stored = localStorage.getItem('selected_location');
        if (stored) {
            try {
                setSelectedLocationState(JSON.parse(stored));
            } catch {
                localStorage.removeItem('selected_location');
            }
        }
    }, [user]);

    // Save to localStorage on change
    const setSelectedLocation = (location: OrgLocation | null) => {
        setSelectedLocationState(location);
        if (location) {
            localStorage.setItem('selected_location', JSON.stringify(location));
        } else {
            localStorage.removeItem('selected_location');
        }
    };

    return (
        <LocationContext.Provider value={{selectedLocation, setSelectedLocation}}>
            {children}
        </LocationContext.Provider>
    );
};

// Custom hook
export const useOrgLocation = (): LocationContextType => {
    const context = useContext(LocationContext);
    if (!context) throw new Error('useLocation must be used within a LocationProvider');
    return context;
};
