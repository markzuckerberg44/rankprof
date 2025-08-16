import { createContext, useEffect, useState, useContext, use } from "react";
import { supabase } from "../supabaseClient"; 
import { data } from "react-router-dom";

const AuthContext = createContext();

export const AuthContextProvider = ({ children }) => {
    const [session, setSession] = useState(undefined);
    const [loading, setLoading] = useState(true);
    
    // sign up function
    const signUpuser = async (email, password) => {
        if (!email.endsWith("@alumnos.ucn.cl")) {
        return { success: false, error: "Solo se permite el correo institucional"};
        }

        const { data, error } = await supabase.auth.signUp({ email, password });

       
         // Si Supabase no devuelve error pero el usuario ya existía,
        // puedes verificar con data.user.identities
        if (data.user && data.user.identities.length === 0) {
        return { success: false, error: "El correo ya está registrado" };
        }

        return { success: true, data };
    };

    // sign in
    const signInUser = async (email, password) => {
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
            setLoading(false);
        });

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setSession(session);
            setLoading(false);
        });

        return () => subscription?.unsubscribe();
    }, []);

    // sign out

    const signOut = async () => {
        const { error } = await supabase.auth.signOut();
        if (error) {
            console.error("Error cerrando sesion:", error);
        }
    };

    return (
        <AuthContext.Provider value={{ session , signUpuser , signInUser , signOut, loading }}>
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => {
    return useContext(AuthContext);
}
