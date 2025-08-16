import React, { useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import logo from '../assets/rankprofbigwhite.png'

const Signin = () => {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState("");

    const { session, signInUser } = useAuth();
    const navigate = useNavigate();

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

  return (
    <div className='min-h-screen flex items-center justify-center'>
        <form onSubmit={handleSignIn} className='max-w-md w-full px-6'>
            {/* Logo centrado */}
            <div className='flex justify-center mb-8'>
                <img src={logo} alt="RankProf" className='h-16 w-auto' />
            </div>
            <h2 className='font-bold pb-2 text-center text-2xl'>Iniciar sesión</h2>
            <p className='text-center mb-4'>No tienes una cuenta? <Link to="/signup">Crea una!</Link></p>
            <div className='flex flex-col py-4'>
                <input onChange={(e) => setEmail(e.target.value)} className='p-3 mt-6 text-white rounded-lg' style={{backgroundColor: '#0D0D0D'}} type="email" name='email' id='signin-email' placeholder='Email'/>
                <input onChange={(e) => setPassword(e.target.value)} className='p-3 mt-6 text-white rounded-lg' style={{backgroundColor: '#0D0D0D'}} type="password" name='password' id='signin-password' placeholder='Password'/>
                <button type='submit' disabled={loading} className='mt-6 w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white py-2 px-4 rounded'>
                    {loading ? 'Iniciando sesión...' : 'Iniciar sesión'}
                </button>
                {error && <p className='text-red-400 text-center pt-4'>{error}</p>}
                {message && <p className='text-green-400 text-center pt-4'>{message}</p>}
            </div>
        </form>
    </div>
  )
}

export default Signin