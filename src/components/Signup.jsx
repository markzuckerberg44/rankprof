import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const Signup = () => {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState("");

    const { session } = useAuth();
    console.log(session);

  return (
    <div className='min-h-screen flex items-center justify-center'>
        <form className='max-w-md w-full px-6'>
            <h2 className='font-bold pb-2 text-center text-2xl'>Signup</h2>
            <p className='text-center mb-4'>Ya tienes una cuenta? <Link to="/signin">Inicia sesión!</Link></p>
            <div className='flex flex-col py-4'>
                <input className='p-3 mt-6 text-white' style={{backgroundColor: '#0D0D0D'}} type="email" name='email' id='signup-email' placeholder='Email'/>
                <input className='p-3 mt-6 text-white' style={{backgroundColor: '#0D0D0D'}} type="password" name='password' id='signup-password' placeholder='Password'/>
                <button type='submit' disabled={loading} className='mt-6 w-full'>Crear cuenta</button>
            </div>
        </form>
    </div>
  )
}

export default Signup