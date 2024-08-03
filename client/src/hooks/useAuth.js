import { login, register } from "../api/auth-api"
import { useAuthContext } from "../contexts/AuthContext";

export const useLogin = () => {
    const {changeAuthState} = useAuthContext();

    const loginHandler = async (email, password) => {
        const { password: pass, ...authData} = await login(email, password);

        changeAuthState(authData);

        return authData;
     }

    return loginHandler;
}

export const useRegister = () => {
    const {changeAuthState} = useAuthContext();

    const registerHandler = async (email, password) => {
        const {password: pass, ...authData} = await register(email, password);

        changeAuthState(authData);

        return authData;
     }

    return registerHandler;
}