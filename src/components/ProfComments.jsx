import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import logo from '../assets/smallwhitelogo.png'; // Asegúrate de que la ruta al logo sea correcta
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../supabaseClient';


const ProfComments = () => {
  const { id } = useParams();
  const [profesorUI, setProfesorUI] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [namensuch, setNamensuch] = useState('');

  useEffect(() => {
    fetchProfesorData();
    }, [id]); // Fetch data when the component mounts or id changes
  
  const { session, signOut } = useAuth();
  const navigate = useNavigate();
  const scrollContainerRef = useRef(null);


  const handleLogoClick = () => {
    navigate('/dashboard');
  };

  const fetchProfesorData = async () => {
    setIsLoading(true);
    try {
      
      const { data: profesores, error: profesoresError } = await supabase
        .from('profesores')
        .select('*')
        .eq('id', id)
        .single();

      if (profesoresError) throw profesoresError;

        setNamensuch(profesores.nombre_apellido);


    } catch (error) {
        console.error('Error fetching shit:', error);
    } finally {
        setIsLoading(false);
    }

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
            
        <div className="text-center mt-8">
            <h1 className="text-2xl font-bold mb-4">
            {isLoading ? 'Cargando...' : namensuch || 'Profesor no encontrado'}
            </h1>
            <p className="text-gray-400">
            ID del profesor: {id}
            </p>
        </div>

        
    </div>
  );
};

export default ProfComments;