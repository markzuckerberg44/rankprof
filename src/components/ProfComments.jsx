import React, { useRef } from 'react';
import { useParams } from 'react-router-dom';
import logo from '../assets/smallwhitelogo.png'; // Asegúrate de que la ruta al logo sea correcta
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';


const ProfComments = () => {
  const { id } = useParams();
  
  const { session, signOut } = useAuth();
  const navigate = useNavigate();
  const scrollContainerRef = useRef(null);


  const handleLogoClick = () => {
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen text-white" style={{backgroundColor: '#2D2D2D'}}>    
      {/* Header con logo y menú */}
        <div className='flex justify-between items-center p-4'>
            {/* Logo */}
            <div className='flex items-center'>
                <img 
                    src={logo} 
                    alt="RankProf" 
                    className='h-12 w-auto cursor-pointer hover:opacity-80 transition-opacity duration-200' 
                    onClick={handleLogoClick}
                />
            </div>
        </div>

        <div>
            <h1 className="text-2xl font-bold text-center mt-8">Comentarios del Profesor</h1>
            <p className="text-center mt-4">Aquí puedes ver y gestionar los comentarios del profesor con ID: {id}</p>
        </div>
    </div>
  );
};

export default ProfComments;