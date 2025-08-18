import { useState } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'

function App() {
  const { session, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center dark" style={{backgroundColor: '#2D2D2D'}}>
        <div className="text-white">Cargando...</div>
      </div>
    );
  }
  
  return <Navigate to={session ? "/dashboard" : "/signin"} replace />;
}

export default App
