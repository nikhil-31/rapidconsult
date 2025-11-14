import React, {createContext, ReactNode, useState} from "react";

import {UserModel} from "../models/UserModel"
import AuthService from "../services/AuthService";

const DefaultProps = {
    login: () => null,
    logout: () => null,
    user: null
};

export interface AuthProps {
    login: (username: string, password: string) => any;
    logout: () => void;
    user: UserModel | null;
}

export const AuthContext = createContext<AuthProps>(DefaultProps);

export const AuthContextProvider: React.FC<{ children: ReactNode }> = ({children}) => {
    const [user, setUser] = useState(() => AuthService.getCurrentUser());

    async function login(username: string, password: string) {
        const data = await AuthService.login(username, password);
        setUser(data);
        return data;
    }

    function logout() {
        AuthService.logout();
        setUser(null);
        window.location.replace("/login");
    }

    return (
        <AuthContext.Provider value={{user, login, logout}}>
            {children}
        </AuthContext.Provider>
    );
};
