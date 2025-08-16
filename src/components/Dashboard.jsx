import React, { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { useNavigate } from 'react-router-dom'
import logo from '../assets/smallwhitelogo.png'


const Dashboard = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
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
    <div className='min-h-screen text-white' style={{backgroundColor: '#2D2D2D'}}>
        {/* Header con logo y menú */}
        <div className='flex justify-between items-center p-4'>
            {/* Logo */}
            <div className='flex items-center'>
                <img src={logo} alt="RankProf" className='h-12 w-auto' />
            </div>
            
            {/* Menú hamburguesa */}
            <div className='relative'>
                <button 
                    onClick={() => setIsMenuOpen(!isMenuOpen)}
                    className='flex flex-col justify-center items-center w-10 h-10 space-y-1 focus:outline-none hover:bg-gray-700 rounded-md p-2 transition-colors duration-200'
                >
                    <div className='w-6 h-1 bg-white rounded-full'></div>
                    <div className='w-6 h-1 bg-white rounded-full'></div>
                    <div className='w-6 h-1 bg-white rounded-full'></div>
                </button>
                
                {/* Menú desplegable */}
                {isMenuOpen && (
                    <div className='absolute right-0 mt-2 w-64 bg-gray-800 rounded-lg shadow-lg z-10 border border-gray-700'>
                        <div className='p-4'>
                            {/* Saludo al usuario */}
                            <div className='mb-4 pb-4 border-b border-gray-600'>
                                <p className='text-sm text-gray-300 mb-1'>Bienvenido</p>
                                <p className='text-white font-medium text-sm break-all'>{session?.user?.email}</p>
                            </div>
                            
                            {/* Opción cerrar sesión */}
                            <button 
                                onClick={handleSignOut}
                                className='w-full bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors duration-200 text-sm'
                            >
                                Cerrar sesión
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
        
        {/* Contenido principal */}
        <div className='flex flex-col items-center px-6' style={{minHeight: 'calc(100vh - 80px)'}}>
            <div className='max-w-md w-full text-center'>
                {/* Barra de búsqueda */}
                <div className='relative mt-6 mb-4'>
                    <input 
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Buscar profesor..."
                        className='w-full p-3 text-white rounded-lg border border-gray-600 focus:border-blue-500 focus:outline-none transition-colors duration-200'
                        style={{backgroundColor: '#1A1A1A'}}
                    />
                    <div className='absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400'>
                        <svg className='w-5 h-5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                            <path strokeLinecap='round' strokeLinejoin='round' strokeWidth='2' d='M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z'></path>
                        </svg>
                    </div>
                </div>
                
                <button className='w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded shadow-lg hover:shadow-xl transition-all duration-200'>
                    ⭐ Enviar ranking ⭐
                </button>
                <h2 className='text-2xl font-thin mb-4 mt-6'>Ver tabla de rankings</h2>

                {/* Switch Toggle Component */}
                <div className='flex justify-center mb-6'>
                    <label htmlFor="filter" className="switch" aria-label="Toggle Filter">
                        <input type="checkbox" id="filter" />
                        <span>De alto a bajo</span>
                        <span>De bajo a alto</span>
                    </label>
                </div>
                
                <p className='text-gray-400'>Aquí puedes gestionar tu perfil y configuraciones.</p>
            </div>
        </div>
    </div>
  )
}

export default Dashboard