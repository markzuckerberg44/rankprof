import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";

export default function AuthCallback() {
  const navigate = useNavigate();

  useEffect(() => {
    (async () => {
      // 1) Obtén el usuario autenticado después del redirect
      const { data: userData, error: userErr } = await supabase.auth.getUser();
      if (userErr || !userData?.user) {
        navigate("/signin?error=session", { replace: true });
        return;
      }

      const email = userData.user.email ?? "";
      // 2) Valida dominio institucional
      const ok = email.toLowerCase().endsWith("@alumnos.ucn.cl");

      if (!ok) {
        // 3) Si no cumple: cierra sesión y redirige con error
        await supabase.auth.signOut();
        navigate("/signin?error=dominio", { replace: true });
        return;
      }

      // 4) Si cumple: entra a tu app
      navigate("/dashboard", { replace: true });
    })();
  }, [navigate]);

  return (
    <div className="min-h-screen grid place-items-center p-6 text-white">
      Procesando inicio de sesión…
    </div>
  );
}

