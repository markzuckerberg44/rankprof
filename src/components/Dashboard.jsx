import React from 'react'
import { useAuth } from '../context/AuthContext'
import { useNavigate } from 'react-router-dom'


const Dashboard = () => {

  const { session, signOut } = useAuth();
  const navigate = useNavigate();

  console.log("Session:", session);

  const handleSignOut = async (e) => {
    e.preventDefault();
    try {
        await signOut();
        navigate("/signin");
    } catch (error) {
        console.error("Error signing out:", error);
    }
  };
    
  return (
    <div>
        <h1>Dashboard</h1>
        <h2>Bienvenido, {session?.user?.email}</h2>
        <div>
            <p className='hover:cursor-pointer border inline-block px-4 py-3 mt-4' onClick={handleSignOut}>Cerrar sesion</p>
        </div>
    </div>
  )
}

export default Dashboard