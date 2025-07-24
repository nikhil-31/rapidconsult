import {createContext, useContext, useState, ReactNode} from 'react';
import {OrganizationProfile} from "../models/OrganizationProfile";

interface OrgContextType {
    selectedOrg: OrganizationProfile | null;
    setSelectedOrg: (org: OrganizationProfile) => void;
}

const OrgContext = createContext<OrgContextType | undefined>(undefined);

export const OrgProvider = ({children}: { children: ReactNode }) => {
    const [selectedOrg, setSelectedOrg] = useState<OrganizationProfile | null>(null);

    return (
        <OrgContext.Provider value={{selectedOrg, setSelectedOrg}}>
            {children}
        </OrgContext.Provider>
    );
};

export const useOrg = () => {
    const context = useContext(OrgContext);
    if (!context) {
        throw new Error("useOrg must be used within OrgProvider");
    }
    return context;
};
