import { createContext } from "react";

export const AuthContext = createContext({
    userId: '',
    email: '',
    accessToken: '',
    isAuthenticate: false,
    changeAuthState: (authState = {}) => null,
});