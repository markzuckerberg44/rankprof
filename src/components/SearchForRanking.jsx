import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import logo from '../assets/smallwhitelogo.png';
import { supabase } from '../supabaseClient';

const SearchForRanking = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [defaultProfessors, setDefaultProfessors] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [allProfessors, setAllProfessors] = useState([]);
  const [showRatingPopup, setShowRatingPopup] = useState(false);
  const [selectedProfesor, setSelectedProfesor] = useState(null);
  const [currentRatingStep, setCurrentRatingStep] = useState(1);
  const [ratings, setRatings] = useState({
    personalidad: 0,
    metodo_ensenanza: 0,
    responsabilidad: 0
  });
  
  const { session, signOut } = useAuth();
  const navigate = useNavigate();

  // Cargar profesores por defecto al montar el componente
  useEffect(() => {
    loadDefaultProfessors();
  }, []);

  const loadDefaultProfessors = async () => {
    setIsLoading(true);
    try {
      // Obtener todos los profesores para el scroll
      const { data: profesores, error } = await supabase
        .from('profesores')
        .select("*");

      if (error) {
        console.error('Error cargando profesores:', error);
        setDefaultProfessors([]);
        setAllProfessors([]);
      } else {
        const allProfs = profesores || [];
        setAllProfessors(allProfs);
        // Mostrar solo los primeros 4 inicialmente
        setDefaultProfessors(allProfs.slice(0, 4));
      }
    } catch (error) {
      console.error('Error:', error);
      setDefaultProfessors([]);
      setAllProfessors([]);
    } finally {
      setIsLoading(false);
    }
  };

  const loadMoreProfessors = async () => {
    const newLimit = showMore + 5;
    setIsLoading(true);
    
    try {
      const { data: profesores, error } = await supabase
        .from('profesores')
        .select("*")
        .limit(newLimit);

      if (error) {
        console.error('Error:', error);
      } else {
        setDefaultProfessors(profesores || []);
        setShowMore(newLimit);
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignOut = async (e) => {
    e.preventDefault();
    try {
        await signOut();
        navigate("/signin");
    } catch (error) {
        console.error("Error signing out:", error);
    }
  };

  const handleLogoClick = () => {
    navigate("/dashboard");
  };

  const handleProfesorClick = (profesor) => {
    setSelectedProfesor(profesor);
    setCurrentRatingStep(1);
    setRatings({
      personalidad: 0,
      metodo_ensenanza: 0,
      responsabilidad: 0
    });
    setShowRatingPopup(true);
  };

  const handleStarClick = (rating) => {
    const currentParam = getCurrentRatingParam();
    setRatings(prev => ({
      ...prev,
      [currentParam]: rating
    }));
  };

  const handleRadioChange = (e) => {
    const rating = parseInt(e.target.value);
    handleStarClick(rating);
  };

  const getCurrentRatingParam = () => {
    switch(currentRatingStep) {
      case 1: return 'personalidad';
      case 2: return 'metodo_ensenanza';
      case 3: return 'responsabilidad';
      default: return 'personalidad';
    }
  };

  const getCurrentRatingTitle = () => {
    switch(currentRatingStep) {
      case 1: return 'Personalidad';
      case 2: return 'Método de Enseñanza';
      case 3: return 'Responsabilidad';
      default: return 'Personalidad';
    }
  };

  const handleNextStep = () => {
    const currentParam = getCurrentRatingParam();
    const currentRating = ratings[currentParam];
    
    if (currentRating === 0) {
      alert('Por favor selecciona una calificación antes de continuar');
      return;
    }

    if (currentRatingStep < 3) {
      setCurrentRatingStep(prev => prev + 1);
    } else {
      // Aquí se enviaría el rating final
      submitRating();
    }
  };

  const submitRating = async () => {
    try {
      // Aquí implementarías la lógica para guardar el rating en Supabase
      console.log('Enviando rating:', {
        profesor: selectedProfesor,
        ratings: ratings,
        usuario: session?.user?.id
      });
      
      alert('¡Rating enviado exitosamente!');
      closeRatingPopup();
    } catch (error) {
      console.error('Error enviando rating:', error);
      alert('Error al enviar el rating');
    }
  };

  const closeRatingPopup = () => {
    setShowRatingPopup(false);
    setSelectedProfesor(null);
    setCurrentRatingStep(1);
    setRatings({
      personalidad: 0,
      metodo_ensenanza: 0,
      responsabilidad: 0
    });
  };

  // Función de búsqueda simple
  const handleSearch = async () => {
    if (!searchTerm.trim()) {
      // Si no hay término de búsqueda, resetear a vista por defecto
      setSearchResults([]);
      loadDefaultProfessors();
      return;
    }

    setIsLoading(true);
    
    try {
      let { data: profesores, error } = await supabase
        .from('profesores')
        .select("*")
        .ilike('nombre_apellido', `%${searchTerm}%`);

      if (error) {
        console.error('Error:', error);
        setSearchResults([]);
      } else {
        setSearchResults(profesores || []);
      }
    } catch (error) {
      console.error('Error buscando:', error);
      setSearchResults([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Función para manejar cambios en el input
  const handleSearchChange = async (e) => {
    const value = e.target.value;
    setSearchTerm(value);
    
    // Si se borra todo el texto, volver a mostrar profesores por defecto
    if (!value.trim()) {
      setSearchResults([]);
      setDefaultProfessors(allProfessors.slice(0, 4));
      return;
    }

    // Buscar en tiempo real mientras el usuario escribe
    setIsLoading(true);
    
    try {
      let { data: profesores, error } = await supabase
        .from('profesores')
        .select("*")
        .ilike('nombre_apellido', `%${value}%`);

      if (error) {
        console.error('Error:', error);
        setSearchResults([]);
      } else {
        setSearchResults(profesores || []);
      }
    } catch (error) {
      console.error('Error buscando:', error);
      setSearchResults([]);
    } finally {
      setIsLoading(false);
    }
  };



  return (
    <div className='min-h-screen text-white' style={{backgroundColor: '#2D2D2D'}}>
        {/* Estilos para ocultar scrollbar y para las estrellas */}
        <style jsx>{`
          .scrollbar-hide {
            -ms-overflow-style: none;  /* Internet Explorer 10+ */
            scrollbar-width: none;  /* Firefox */
          }
          .scrollbar-hide::-webkit-scrollbar { 
            display: none;  /* Safari and Chrome */
          }
          
          .rating > label {
            margin-right: 4px;
          }

          .rating:not(:checked) > input {
            display: none;
          }

          .rating:not(:checked) > label {
            float: right;
            cursor: pointer;
            font-size: 30px;
          }

          .rating:not(:checked) > label > svg {
            fill: #666;
            transition: fill 0.3s ease;
          }

          .rating > input:checked ~ label > svg {
            fill: #ffa723;
          }

          .rating:not(:checked) > label:hover ~ label > svg,
          .rating:not(:checked) > label:hover > svg {
            fill: #ff9e0b;
          }

          .star1:hover ~ label > svg,
          .star1:hover > svg {
            fill: #a23c3c !important;
          }

          .star2:hover ~ label > svg,
          .star2:hover > svg {
            fill: #99542d !important;
          }

          .star3:hover ~ label > svg,
          .star3:hover > svg {
            fill: #9f7e18 !important;
          }

          .star4:hover ~ label > svg,
          .star4:hover > svg {
            fill: #22885e !important;
          }

          .star5:hover ~ label > svg,
          .star5:hover > svg {
            fill: #7951ac !important;
          }

          .star1:checked ~ label > svg {
            fill: #ef4444;
          }

          .star2:checked ~ label > svg {
            fill: #e06c2b;
          }

          .star3:checked ~ label > svg {
            fill: #eab308;
          }

          .star4:checked ~ label > svg {
            fill: #19c37d;
          }

          .star5:checked ~ label > svg {
            fill: #ab68ff;
          }
        `}</style>
        
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
                        onChange={handleSearchChange}
                        placeholder="Buscar profesor..."
                        className='w-full p-3 text-white rounded-lg border border-gray-600 focus:border-blue-500 focus:outline-none transition-colors duration-200'
                        style={{backgroundColor: '#1A1A1A'}}
                        onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                    />
                    <button 
                        onClick={handleSearch}
                        className='absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition-colors'
                    >
                        <svg className='w-5 h-5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                            <path strokeLinecap='round' strokeLinejoin='round' strokeWidth='2' d='M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z'></path>
                        </svg>
                    </button>
                </div>

                {/* Resultados de búsqueda o profesores por defecto */}
                {isLoading && (
                    <div className='text-center py-4'>
                        <p className='text-gray-400'>Cargando...</p>
                    </div>
                )}

                {/* Mostrar resultados de búsqueda cuando hay término de búsqueda */}
                {searchTerm && searchResults.length > 0 && (
                    <div className='mt-4 space-y-3'>
                        <h3 className='text-lg font-medium mb-4'>Resultados de búsqueda:</h3>
                        {searchResults.map((profesor) => (
                            <div 
                                key={profesor.id} 
                                className='bg-zinc-800 p-4 rounded-lg hover:bg-zinc-700 cursor-pointer transition-colors duration-200 border border-zinc-600'
                                onClick={() => handleProfesorClick(profesor)}
                            >
                                <h4 className='text-white font-medium'>{profesor.nombre_apellido}</h4>
                                {profesor.departamento && <p className='text-gray-400 text-sm'>{profesor.departamento}</p>}
                            </div>
                        ))}
                    </div>
                )}

                {/* Mostrar profesores por defecto cuando no hay búsqueda */}
                {!searchTerm && defaultProfessors.length > 0 && (
                    <div className='mt-4'>
                        <h3 className='text-lg font-medium mb-4'>Profesores:</h3>
                        <div 
                            className='space-y-3 max-h-80 overflow-y-auto scrollbar-hide'
                            style={{
                                scrollbarWidth: 'none', /* Firefox */
                                msOverflowStyle: 'none'  /* Internet Explorer and Edge */
                            }}
                        >
                            {allProfessors.map((profesor) => (
                                <div 
                                    key={profesor.id} 
                                    className='bg-zinc-800 p-4 rounded-lg hover:bg-zinc-700 cursor-pointer transition-colors duration-200 border border-zinc-600 flex-shrink-0'
                                    onClick={() => handleProfesorClick(profesor)}
                                >
                                    <h4 className='text-white font-medium'>{profesor.nombre_apellido}</h4>
                                    {profesor.departamento && <p className='text-gray-400 text-sm'>{profesor.departamento}</p>}
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Mensaje cuando no hay resultados de búsqueda */}
                {searchTerm && searchResults.length === 0 && !isLoading && (
                    <div className='text-center py-4'>
                        <p className='text-gray-400'>No se encontraron profesores</p>
                    </div>
                )}

                {/* <h2 className='text-2xl font-thin mb-4'>Enviar ranking</h2> */}
                <p className='text-gray-400 mt-5'>Busca y selecciona un profesor para enviar tu ranking.</p>
            </div>
        </div>

        {/* Popup de Rating */}
        {showRatingPopup && selectedProfesor && (
            <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4'>
                <div className='bg-gray-800 rounded-lg p-6 w-full max-w-md mx-4'>
                    {/* Header del popup */}
                    <div className='text-center mb-6'>
                        <h3 className='text-xl font-bold text-white mb-2'>
                            Calificar Profesor
                        </h3>
                        <p className='text-lg text-white font-medium'>
                            {selectedProfesor.nombre_apellido}
                        </p>
                        <p className='text-sm text-yellow-400 mt-3'>
                            ⚠️ Es obligatorio agregar rating en los 3 parámetros
                        </p>
                    </div>

                    {/* Indicador de progreso */}
                    <div className='flex justify-center mb-6'>
                        <div className='flex space-x-2'>
                            {[1, 2, 3].map((step) => (
                                <div 
                                    key={step}
                                    className={`w-3 h-3 rounded-full ${
                                        step <= currentRatingStep ? 'bg-blue-500' : 'bg-gray-600'
                                    }`}
                                />
                            ))}
                        </div>
                    </div>

                    {/* Título del parámetro actual */}
                    <div className='text-center mb-6'>
                        <h4 className='text-lg font-semibold text-white mb-2'>
                            {getCurrentRatingTitle()}
                        </h4>
                        <p className='text-sm text-gray-400'>
                            Paso {currentRatingStep} de 3
                        </p>
                    </div>

                    {/* Estrellas de rating */}
                    <div className='flex justify-center mb-8'>
                        <div className="rating">
                            <input 
                                type="radio" 
                                id={`star5-${currentRatingStep}`} 
                                name={`rate-${currentRatingStep}`} 
                                value="5" 
                                checked={ratings[getCurrentRatingParam()] === 5}
                                onChange={handleRadioChange}
                                className="star5"
                            />
                            <label title="Excellent!" htmlFor={`star5-${currentRatingStep}`}>
                                <svg xmlns="http://www.w3.org/2000/svg" height="1em" viewBox="0 0 576 512">
                                    <path d="M316.9 18C311.6 7 300.4 0 288.1 0s-23.4 7-28.8 18L195 150.3 51.4 171.5c-12 1.8-22 10.2-25.7 21.7s-.7 24.2 7.9 32.7L137.8 329 113.2 474.7c-2 12 3 24.2 12.9 31.3s23 8 33.8 2.3l128.3-68.5 128.3 68.5c10.8 5.7 23.9 4.9 33.8-2.3s14.9-19.3 12.9-31.3L438.5 329 542.7 225.9c8.6-8.5 11.7-21.2 7.9-32.7s-13.7-19.9-25.7-21.7L381.2 150.3 316.9 18z"></path>
                                </svg>
                            </label>
                            <input 
                                value="4" 
                                name={`rate-${currentRatingStep}`} 
                                id={`star4-${currentRatingStep}`} 
                                type="radio" 
                                checked={ratings[getCurrentRatingParam()] === 4}
                                onChange={handleRadioChange}
                                className="star4"
                            />
                            <label title="Great!" htmlFor={`star4-${currentRatingStep}`}>
                                <svg xmlns="http://www.w3.org/2000/svg" height="1em" viewBox="0 0 576 512">
                                    <path d="M316.9 18C311.6 7 300.4 0 288.1 0s-23.4 7-28.8 18L195 150.3 51.4 171.5c-12 1.8-22 10.2-25.7 21.7s-.7 24.2 7.9 32.7L137.8 329 113.2 474.7c-2 12 3 24.2 12.9 31.3s23 8 33.8 2.3l128.3-68.5 128.3 68.5c10.8 5.7 23.9 4.9 33.8-2.3s14.9-19.3 12.9-31.3L438.5 329 542.7 225.9c8.6-8.5 11.7-21.2 7.9-32.7s-13.7-19.9-25.7-21.7L381.2 150.3 316.9 18z"></path>
                                </svg>
                            </label>
                            <input 
                                value="3" 
                                name={`rate-${currentRatingStep}`} 
                                id={`star3-${currentRatingStep}`} 
                                type="radio" 
                                checked={ratings[getCurrentRatingParam()] === 3}
                                onChange={handleRadioChange}
                                className="star3"
                            />
                            <label title="Good" htmlFor={`star3-${currentRatingStep}`}>
                                <svg xmlns="http://www.w3.org/2000/svg" height="1em" viewBox="0 0 576 512">
                                    <path d="M316.9 18C311.6 7 300.4 0 288.1 0s-23.4 7-28.8 18L195 150.3 51.4 171.5c-12 1.8-22 10.2-25.7 21.7s-.7 24.2 7.9 32.7L137.8 329 113.2 474.7c-2 12 3 24.2 12.9 31.3s23 8 33.8 2.3l128.3-68.5 128.3 68.5c10.8 5.7 23.9 4.9 33.8-2.3s14.9-19.3 12.9-31.3L438.5 329 542.7 225.9c8.6-8.5 11.7-21.2 7.9-32.7s-13.7-19.9-25.7-21.7L381.2 150.3 316.9 18z"></path>
                                </svg>
                            </label>
                            <input 
                                value="2" 
                                name={`rate-${currentRatingStep}`} 
                                id={`star2-${currentRatingStep}`} 
                                type="radio" 
                                checked={ratings[getCurrentRatingParam()] === 2}
                                onChange={handleRadioChange}
                                className="star2"
                            />
                            <label title="Okay" htmlFor={`star2-${currentRatingStep}`}>
                                <svg xmlns="http://www.w3.org/2000/svg" height="1em" viewBox="0 0 576 512">
                                    <path d="M316.9 18C311.6 7 300.4 0 288.1 0s-23.4 7-28.8 18L195 150.3 51.4 171.5c-12 1.8-22 10.2-25.7 21.7s-.7 24.2 7.9 32.7L137.8 329 113.2 474.7c-2 12 3 24.2 12.9 31.3s23 8 33.8 2.3l128.3-68.5 128.3 68.5c10.8 5.7 23.9 4.9 33.8-2.3s14.9-19.3 12.9-31.3L438.5 329 542.7 225.9c8.6-8.5 11.7-21.2 7.9-32.7s-13.7-19.9-25.7-21.7L381.2 150.3 316.9 18z"></path>
                                </svg>
                            </label>
                            <input 
                                value="1" 
                                name={`rate-${currentRatingStep}`} 
                                id={`star1-${currentRatingStep}`} 
                                type="radio" 
                                checked={ratings[getCurrentRatingParam()] === 1}
                                onChange={handleRadioChange}
                                className="star1"
                            />
                            <label title="Bad" htmlFor={`star1-${currentRatingStep}`}>
                                <svg xmlns="http://www.w3.org/2000/svg" height="1em" viewBox="0 0 576 512">
                                    <path d="M316.9 18C311.6 7 300.4 0 288.1 0s-23.4 7-28.8 18L195 150.3 51.4 171.5c-12 1.8-22 10.2-25.7 21.7s-.7 24.2 7.9 32.7L137.8 329 113.2 474.7c-2 12 3 24.2 12.9 31.3s23 8 33.8 2.3l128.3-68.5 128.3 68.5c10.8 5.7 23.9 4.9 33.8-2.3s14.9-19.3 12.9-31.3L438.5 329 542.7 225.9c8.6-8.5 11.7-21.2 7.9-32.7s-13.7-19.9-25.7-21.7L381.2 150.3 316.9 18z"></path>
                                </svg>
                            </label>
                        </div>
                    </div>

                    {/* Rating seleccionado */}
                    <div className='text-center mb-6'>
                        <p className='text-white'>
                            Rating: {ratings[getCurrentRatingParam()]} / 5
                        </p>
                    </div>

                    {/* Botones de acción */}
                    <div className='flex space-x-3'>
                        <button
                            onClick={closeRatingPopup}
                            className='flex-1 bg-gray-600 hover:bg-gray-700 text-white py-2 px-4 rounded-lg transition-colors duration-200'
                        >
                            Cancelar
                        </button>
                        <button
                            onClick={handleNextStep}
                            className='flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg transition-colors duration-200'
                        >
                            {currentRatingStep === 3 ? 'Enviar Rating' : 'Siguiente'}
                        </button>
                    </div>
                </div>
            </div>
        )}
    </div>
  )
}

export default SearchForRanking