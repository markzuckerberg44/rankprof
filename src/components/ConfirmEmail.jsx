import React, { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../supabaseClient'

const ConfirmEmail = () => {
    const navigate = useNavigate();

    useEffect(() => {
        // Manejar la confirmación del email
        const handleEmailConfirmation = async () => {
            try {
                // Verificar si hay un hash en la URL (token de confirmación)
                const hashParams = new URLSearchParams(window.location.hash.substr(1));
                const accessToken = hashParams.get('access_token');
                const refreshToken = hashParams.get('refresh_token');

                if (accessToken && refreshToken) {
                    // Si hay tokens, el email fue confirmado exitosamente
                    console.log('Email confirmado exitosamente');
                    
                    // Redirigir al signin después de 3 segundos
                    setTimeout(() => {
                        navigate('/signin');
                    }, 3000);
                } else {
                    // Si no hay tokens, redirigir inmediatamente
                    navigate('/signin');
                }
            } catch (error) {
                console.error('Error en confirmación:', error);
                navigate('/signin');
            }
        };

        handleEmailConfirmation();
    }, [navigate]);

    return (
        <div className='min-h-screen flex items-center justify-center bg-gray-900 text-white'>
            <div className='max-w-md w-full px-6 text-center'>
                <h2 className='text-2xl font-bold mb-4'>¡Email Confirmado!</h2>
                <p className='text-gray-300 mb-6'>
                    Tu cuenta ha sido verificada exitosamente.
                </p>
                <p className='text-gray-400'>
                    Serás redirigido al inicio de sesión en unos segundos...
                </p>
                <div className='mt-6'>
                    <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto'></div>
                </div>
            </div>
        </div>
    )
}

export default ConfirmEmail
