import { useState } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'

function App() {
  const { session, loading } = useAuth();
  
  // Si está cargando la sesión
  if (loading) {
    return <div className="min-h-screen flex items-center justify-center" style={{backgroundColor: '#2D2D2D'}}>
      <div className="text-white">Cargando...</div>
    </div>;
  }
  
  // Si hay sesión, ir al dashboard
  // Si no hay sesión, ir al signin
  return <Navigate to={session ? "/dashboard" : "/signin"} replace />;
}

export default App
