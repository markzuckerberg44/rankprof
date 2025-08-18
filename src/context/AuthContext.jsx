import { createContext, useEffect, useState, useContext } from "react";
import { supabase } from "../supabaseClient";

const AuthContext = createContext(null);

export const AuthContextProvider = ({ children }) => {
  const [session, setSession] = useState(undefined);
  const [loading, setLoading] = useState(true);

  // ------ Email / Password ------
  const signUpuser = async (email, password) => {
    if (!email.endsWith("@alumnos.ucn.cl")) {
      return { success: false, error: "Solo se permite el correo institucional" };
    }
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) return { success: false, error: error.message };

    // Si usuario ya existía
    if (data?.user && data.user.identities?.length === 0) {
      return { success: false, error: "El correo ya está registrado" };
    }
    return { success: true, data };
  };

  const signInUser = async (email, password) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) return { success: false, error: error.message };
      return { success: true, data };
    } catch (err) {
      return { success: false, error: err.message };
    }
  };

  // ------ Google OAuth ------
  const signInWithGoogle = async () => {
    const redirectTo = `${window.location.origin}/auth/callback`;
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo },
    });
    if (error) throw error;
  };

  // ------ Sesión ------
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session ?? null);
      setLoading(false);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
      setLoading(false);
    });

    return () => sub.subscription.unsubscribe();
  }, []);

  // ------ Cerrar sesión ------
  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) console.error("Error cerrando sesión:", error);
  };

  return (
    <AuthContext.Provider
      value={{ session, loading, signUpuser, signInUser, signInWithGoogle, signOut }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
