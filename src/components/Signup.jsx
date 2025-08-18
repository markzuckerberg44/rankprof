import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";

export default function Signup() {
  const { signInWithGoogle } = useAuth();
  const [error, setError] = useState("");

  useEffect(() => {
    (async () => {
      try {
        await signInWithGoogle(); // redirige a Google y vuelve a /auth/callback
      } catch (e) {
        setError(e?.message || "No se pudo iniciar con Google");
      }
    })();
  }, [signInWithGoogle]);

  return (
    <div className="min-h-screen grid place-items-center p-6 text-white">
      {error ? <p>Error: {error}</p> : <p>Abriendo Google…</p>}
    </div>
  );
}

