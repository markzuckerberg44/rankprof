import React from 'react'
import { useAuth } from '../context/AuthContext.jsx';
import { Navigate } from 'react-router-dom';

const PrivateRoute = ({children}) => {
    const { session, loading } = useAuth();
    
    // Mientras se carga la sesión, mostrar loading
    if (loading) {
        return <div className="min-h-screen flex items-center justify-center" style={{backgroundColor: '#2D2D2D'}}>
            <div className="text-white">Cargando...</div>
        </div>;
    }
    
    // Si hay sesión, mostrar el contenido protegido
    // Si no hay sesión, redirigir a signin
    return <>{session ? <>{children}</> : <Navigate to="/signin" />}</>;
};

export default PrivateRoute