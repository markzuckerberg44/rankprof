import React, { useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'


const Signup = () => {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState("");

    const { session, signUpuser } = useAuth();
    const navigate = useNavigate();


    const handleSignup = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError("");
        setMessage("");
        
        try {
            const result = await signUpuser(email, password);
            
            if (result.error) {
                setError(result.error);
            }
            else {
                // Registro exitoso - mostrar mensaje de confirmación
                setMessage("¡Cuenta creada! Revisa tu email para confirmar tu cuenta.");
                // Opcional: redirigir después de unos segundos
                setTimeout(() => {
                    navigate("/signin");
                }, 5000);
            }
        } catch (error) {
            setError("Error creating account: " + error.message);
            console.error("Signup error:", error);
        } finally {
            setLoading(false);
        }
    }

  return (
    <div className='min-h-screen flex items-center justify-center'>
        <form onSubmit={handleSignup} className='max-w-md w-full px-6'>
            <h2 className='font-bold pb-2 text-center text-2xl'>Signup</h2>
            <p className='text-center mb-4'>Ya tienes una cuenta? <Link to="/signin">Inicia sesión!</Link></p>
            <div className='flex flex-col py-4'>
                <input onChange={(e) => setEmail(e.target.value)} className='p-3 mt-6 text-white' style={{backgroundColor: '#0D0D0D'}} type="email" name='email' id='signup-email' placeholder='Email'/>
                <input onChange={(e) => setPassword(e.target.value)} className='p-3 mt-6 text-white' style={{backgroundColor: '#0D0D0D'}} type="password" name='password' id='signup-password' placeholder='Password'/>
                <button type='submit' disabled={loading} className='mt-6 w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white py-2 px-4 rounded'>
                    {loading ? 'Creando cuenta...' : 'Crear cuenta'}
                </button>
                {error && <p className='text-red-400 text-center pt-4'>{error}</p>}
                {message && <p className='text-green-400 text-center pt-4'>{message}</p>}
            </div>
        </form>
    </div>
  )
}

export default Signup