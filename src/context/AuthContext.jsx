import { createContext, useEffect, useState, useContext, use } from "react";
import { supabase } from "../supabaseClient"; 
import { data } from "react-router-dom";

const AuthContext = createContext();

export const AuthContextProvider = ({ children }) => {
    const [session, setSession] = useState(undefined);
    
    // sign up function
    const signUpuser = async (email, password) => {
        const { data, error } = await supabase.auth.signUp({ email, password });
        return { data, error };
    };

    // sign in
    const signInUser = async (email, password) => {
        if (!email.endsWith("@alumnos.ucn.cl")) {
        return { success: false, error: "Solo se permite el correo institucional};
        }
        try {
            const { data, error } = await supabase.auth.signInWithPassword({ email, password });
            if (error) {
                console.error("Error signing in:", error);
                return { success: false, error: error.message };
            }
            console.log("Sign in success:", data);
            return { success: true, data };
        } catch (error) {
            console.error("Unexpected error during sign in:", error);
            return { success: false, error: error.message };
        }
    };



    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session);
        });

        supabase.auth.onAuthStateChange((_event, session) => {
            setSession(session);
        });
    }, []);

    // sign out

    const signOut = async () => {
        const { error } = await supabase.auth.signOut();
        if (error) {
            console.error("Error cerrando sesion:", error);
        }
    };

    return (
        <AuthContext.Provider value={{ session , signUpuser , signInUser , signOut }}>
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => {
    return useContext(AuthContext);
}
