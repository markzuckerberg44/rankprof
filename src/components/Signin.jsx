import React, { useState, useEffect } from 'react'
import GoogleAuthPopup from './GoogleAuthPopup'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import logo from '../assets/rankprofbigwhite.png'

const Signin = () => {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const [googleLoading, setGoogleLoading] = useState(false);
    const [message, setMessage] = useState("");
    const [showGooglePopup, setShowGooglePopup] = useState(false);
    
    // Estado para el efecto typewriter
    const [typewriterText, setTypewriterText] = useState("");
    const [showCursor, setShowCursor] = useState(true);
    const fullText = "Hecho por Julián Honores, Winter, Claudio Monsalve y Diego Ravanal.";

    const { session, signInUser, signInWithGoogle } = useAuth();
    const navigate = useNavigate();

    // Efecto typewriter
    useEffect(() => {
        let currentIndex = 0;
        const typingInterval = setInterval(() => {
            if (currentIndex <= fullText.length) {
                setTypewriterText(fullText.slice(0, currentIndex));
                currentIndex++;
            } else {
                clearInterval(typingInterval);
                // Ocultar cursor cuando termine de escribir
                setTimeout(() => setShowCursor(false), 1000);
            }
        }, 50); // Velocidad de escritura: 100ms por letra

        return () => clearInterval(typingInterval);
    }, []);

    const handleSignIn = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError("");
        setMessage("");
        
        try {
            const result = await signInUser(email, password);

            if (result.success) {
                // Inicio de sesión exitoso - redirigir al dashboard
                setMessage("¡Inicio de sesión exitoso!");
                navigate("/dashboard");
            } else {
                setError(result.error);
            }
        } catch (error) {
            setError("Error al iniciar sesión: " + error.message);
            console.error("Sign in error:", error);
        } finally {
            setLoading(false);
        }
    }

    const handleGoogle = async () => {
    try {
      setGoogleLoading(true);
      setError(""); 
      await signInWithGoogle(); // redirige a Google y volverá a /auth/callback 
    } catch (err) {
      console.error("Google sign-in error:", err);
      setError("No se pudo iniciar con Google"); 
      setGoogleLoading(false); 
    }
  };

  return (
    <div className='min-h-screen flex items-center justify-center'>
        <form onSubmit={handleSignIn} className='max-w-md w-full px-6'>
            {/* Logo centrado */}
            <div className='flex justify-center mb-8'>
                <img src={logo} alt="RankProf" className='h-16 w-auto' />
            </div>
            
            
            <button
                type="button"
                onClick={() => setShowGooglePopup(true)}
                className='w-full mb-4 bg-white hover:bg-gray-100 text-white-900 font-medium py-3 px-4 rounded-lg border border-white border-opacity-15 transition-colors duration-200 flex items-center justify-center gap-3'
            >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Inicia o crea tu cuenta with Google
            </button>

            {/* BORRAR MAS TARDE - Form temporal para testing */}
            <div>
                <input 
                    type="email" 
                    placeholder="Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                />
                <input 
                    type="password" 
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                />
                <button type="submit" disabled={loading}>
                    {loading ? 'Iniciando sesión...' : 'Iniciar sesión'}
                </button>
            </div>

            <div className='flex flex-col py-4'>
                <GoogleAuthPopup
                    open={showGooglePopup}
                    onClose={() => setShowGooglePopup(false)}
                    onContinue={() => { setShowGooglePopup(false); navigate('/signup'); }}
                />
                
                
                <p className='text-center mt-0 text-yellow-400'>Solo correos @alumnos.ucn.cl permitidos</p>
                {error && <p className='text-red-400 text-center pt-4'>{error}</p>}
                {message && <p className='text-green-400 text-center pt-4'>{message}</p>}
                <p className='text-sm text-center mt-5 text-white font-medium'>
                    {typewriterText}
                    {showCursor && <span className='animate-pulse'>|</span>}
                </p>
                <p className='text-sm text-center mt-5 text-gray-400 font-thin '>Para problemas y consultas <br></br> <a href="mailto:rankprof79@gmail.com">Contáctanos en rankprof79@gmail.com</a></p>
            </div>
        </form>
    </div>
  )
}

export default Signin