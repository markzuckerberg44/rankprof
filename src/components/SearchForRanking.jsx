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
  const [isUpdatingRating, setIsUpdatingRating] = useState(false);
  const [showConfirmPopup, setShowConfirmPopup] = useState(false);
  const [existingRatingData, setExistingRatingData] = useState(null);
  const [showMessagePopup, setShowMessagePopup] = useState(false);
  const [messagePopupData, setMessagePopupData] = useState({ title: '', message: '', type: 'success' });
  const [ratings, setRatings] = useState({
    personalidad: 0,
    metodo_ensenanza: 0,
    responsabilidad: 0
  });
  
  // Estados para manejo de facultades
  const [userFacultad, setUserFacultad] = useState(null);
  const [showFacultyModal, setShowFacultyModal] = useState(false);
  const [facultyChoice, setFacultyChoice] = useState('');
  const [savingFaculty, setSavingFaculty] = useState(false);
  const [facultyError, setFacultyError] = useState('');
  
  const { session, signOut } = useAuth();
  const navigate = useNavigate();

  // Verificar facultad del usuario al cargar
  useEffect(() => {
    const checkFaculty = async () => {
      try {
        if (!session?.user?.id) return;

        const { data, error } = await supabase
          .from('profiles')
          .select('id, facultad')
          .eq('id', session.user.id)
          .maybeSingle();

        if (error) {
          console.error('Error consultando profiles:', error);
          return;
        }

        // Guardar la facultad del usuario
        if (data && data.facultad) {
          setUserFacultad(data.facultad);
        }

        // Si no existe fila o la facultad es null, mostramos el modal
        if (!data || data.facultad == null) {
          setShowFacultyModal(true);
        }
      } catch (e) {
        console.error('Error al verificar facultad:', e);
      }
    };

    checkFaculty();
  }, [session]);

  // Cargar profesores por defecto al montar el componente (solo si ya conocemos la facultad)
  useEffect(() => {
    if (userFacultad !== null) {
      loadDefaultProfessors();
    }
  }, [userFacultad]);

  const loadDefaultProfessors = async () => {
    setIsLoading(true);
    try {
      // Seleccionar tabla según la facultad del usuario
      const tableName = userFacultad === 'derecho' ? 'profesores_derecho' 
                      : userFacultad === 'comercial' ? 'profesores_comercial'
                      : userFacultad === 'medicina' ? 'profesores_med'
                      : userFacultad === 'enfermeria' ? 'profesores_enf'
                      : 'profesores';
      
      // Obtener todos los profesores para el scroll
      const { data: profesores, error } = await supabase
        .from(tableName)
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
  
  /*
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
  */

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

  const handleProfesorClick = async (profesor) => {
    setSelectedProfesor(profesor);
    
    // Seleccionar tabla de calificaciones según la facultad del usuario
    const calificacionesTable = userFacultad === 'derecho' ? 'calificaciones_derecho' 
                               : userFacultad === 'comercial' ? 'calificaciones_comercial'
                               : userFacultad === 'medicina' ? 'calificaciones_med'
                               : userFacultad === 'enfermeria' ? 'calificaciones_enf'
                               : 'calificaciones';
    
    // Campo de usuario según la facultad (medicina y enfermería usan user_id, otras usan usuario_id)
    const userIdField = (userFacultad === 'medicina' || userFacultad === 'enfermeria') ? 'user_id' : 'usuario_id';
    
    // Verificar si ya existe una calificación para este profesor por este usuario
    try {
      const { data: existingRating, error } = await supabase
        .from(calificacionesTable)
        .select(`${userIdField}, profesor_id, personalidad, metodo_ensenanza, responsabilidad`)
        .eq(userIdField, session?.user?.id)
        .eq('profesor_id', profesor.id)
        .maybeSingle();

      if (error) {
        console.error('Error verificando calificación existente:', error);
        showMessage('Error', 'Error al verificar calificaciones previas', 'error');
        return;
      }

      if (existingRating) {
        // Ya existe una calificación, mostrar popup de confirmación personalizado
        setExistingRatingData(existingRating);
        setShowConfirmPopup(true);
      } else {
        // No existe calificación previa, inicializar en 0
        setIsUpdatingRating(false);
        setRatings({
          personalidad: 0,
          metodo_ensenanza: 0,
          responsabilidad: 0
        });
        setCurrentRatingStep(1);
        setShowRatingPopup(true);
      }

    } catch (error) {
      console.error('Error:', error);
      showMessage('Error', 'Error al verificar calificaciones previas', 'error');
    }
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
      showMessage('Rating Requerido', 'Por favor selecciona una calificación antes de continuar', 'warning');
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
      // Validar que todos los ratings estén completos
      if (ratings.personalidad === 0 || ratings.metodo_ensenanza === 0 || ratings.responsabilidad === 0) {
        showMessage('Ratings Incompletos', 'Todos los ratings deben estar completos', 'warning');
        return;
      }

      // Seleccionar tabla de calificaciones según la facultad del usuario
      const calificacionesTable = userFacultad === 'derecho' ? 'calificaciones_derecho' 
                                 : userFacultad === 'comercial' ? 'calificaciones_comercial'
                                 : userFacultad === 'medicina' ? 'calificaciones_med'
                                 : userFacultad === 'enfermeria' ? 'calificaciones_enf'
                                 : 'calificaciones';

      // Campo de usuario según la facultad (medicina y enfermería usan user_id, otras usan usuario_id)
      const userIdField = (userFacultad === 'medicina' || userFacultad === 'enfermeria') ? 'user_id' : 'usuario_id';

      // Preparar los datos para insertar/actualizar en la tabla calificaciones
      const ratingData = {
        [userIdField]: session?.user?.id,
        profesor_id: selectedProfesor.id,
        personalidad: ratings.personalidad,
        metodo_ensenanza: ratings.metodo_ensenanza,
        responsabilidad: ratings.responsabilidad
      };

      console.log('Datos a enviar:', ratingData);

      // Approach más confiable: primero verificar si existe, luego insertar o actualizar
      const { data: existingRating } = await supabase
        .from(calificacionesTable)
        .select('id')
        .eq(userIdField, session?.user?.id)
        .eq('profesor_id', selectedProfesor.id)
        .maybeSingle();

      let result;
      if (existingRating) {
        // Actualizar registro existente
        result = await supabase
          .from(calificacionesTable)
          .update({
            personalidad: ratings.personalidad,
            metodo_ensenanza: ratings.metodo_ensenanza,
            responsabilidad: ratings.responsabilidad
          })
          .eq('id', existingRating.id);
      } else {
        // Insertar nuevo registro
        result = await supabase
          .from(calificacionesTable)
          .insert([ratingData]);
      }

      if (result.error) {
        console.error('Error al procesar calificación:', result.error);
        showMessage('Error', 'Error al procesar el rating: ' + result.error.message, 'error');
        return;
      }

      console.log('Calificación procesada:', result);
      
      if (isUpdatingRating) {
        showMessage('¡Éxito!', 'Calificación actualizada exitosamente', 'success');
      } else {
        showMessage('¡Éxito!', 'Rating enviado exitosamente', 'success');
      }

      closeRatingPopup();
      
    } catch (error) {
      console.error('Error procesando rating:', error);
      showMessage('Error', 'Error al procesar el rating', 'error');
    }
  };

  const closeRatingPopup = () => {
    setShowRatingPopup(false);
    setSelectedProfesor(null);
    setCurrentRatingStep(1);
    setIsUpdatingRating(false);
    setRatings({
      personalidad: 0,
      metodo_ensenanza: 0,
      responsabilidad: 0
    });
  };

  const handleConfirmUpdate = () => {
    // El usuario confirma que quiere actualizar
    setIsUpdatingRating(true);
    setRatings({
      personalidad: existingRatingData.personalidad,
      metodo_ensenanza: existingRatingData.metodo_ensenanza,
      responsabilidad: existingRatingData.responsabilidad
    });
    setShowConfirmPopup(false);
    setCurrentRatingStep(1);
    setShowRatingPopup(true);
  };

  const handleCancelUpdate = () => {
    // El usuario cancela la actualización
    setShowConfirmPopup(false);
    setSelectedProfesor(null);
    setExistingRatingData(null);
  };

  const showMessage = (title, message, type = 'success') => {
    setMessagePopupData({ title, message, type });
    setShowMessagePopup(true);
  };

  const closeMessagePopup = () => {
    setShowMessagePopup(false);
  };

  const handleCreateProfesor = () => {
    navigate("/create-profesor");
  };

  // Función para manejar la selección y guardado de facultad
  const handleSaveFaculty = async () => {
    if (!facultyChoice) {
      setFacultyError('Por favor selecciona una facultad');
      return;
    }

    setSavingFaculty(true);
    setFacultyError('');
    
    try {
      const payload = {
        id: session?.user?.id,
        facultad: facultyChoice,
      };

      const { error } = await supabase
        .from('profiles')
        .upsert([payload], { onConflict: 'id' });

      if (error) {
        console.error('Error guardando facultad:', error);
        setFacultyError('Error al guardar la facultad. Inténtalo de nuevo.');
        return;
      }

      // Éxito: actualizar estado local y cerrar modal
      setUserFacultad(facultyChoice);
      setShowFacultyModal(false);
      setFacultyChoice('');
      
    } catch (error) {
      console.error('Error:', error);
      setFacultyError('Error inesperado. Inténtalo de nuevo.');
    } finally {
      setSavingFaculty(false);
    }
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
      // Seleccionar tabla según la facultad del usuario
      const tableName = userFacultad === 'derecho' ? 'profesores_derecho' 
                      : userFacultad === 'comercial' ? 'profesores_comercial'
                      : userFacultad === 'medicina' ? 'profesores_med'
                      : userFacultad === 'enfermeria' ? 'profesores_enf'
                      : 'profesores';
      
      let { data: profesores, error } = await supabase
        .from(tableName)
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
      // Seleccionar tabla según la facultad del usuario
      const tableName = userFacultad === 'derecho' ? 'profesores_derecho' 
                      : userFacultad === 'comercial' ? 'profesores_comercial'
                      : userFacultad === 'medicina' ? 'profesores_med'
                      : userFacultad === 'enfermeria' ? 'profesores_enf'
                      : 'profesores';
      
      let { data: profesores, error } = await supabase
        .from(tableName)
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
        <style>{`
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
                    className='h-12 w-auto cursor-pointer hover:opacity-80 transition-opacity duration-200 dropshadow-lg'
                    style={{ boxShadow: '0 4px 16px 0 rgba(0, 0, 0, 0.8)' }} 
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
                {/* Verificar si el usuario tiene acceso según su facultad */}
                {userFacultad && (userFacultad === 'ingenieria' || userFacultad === 'derecho' || userFacultad === 'comercial' || userFacultad === 'medicina' || userFacultad === 'enfermeria') ? (
                    <>
                        {/* Barra de búsqueda */}
                        <div className='relative mt-6 mb-4'>
                
                            <input 
                                type="text"
                                value={searchTerm}
                                onChange={handleSearchChange}
                                placeholder="Ingresa el nombre del profesor..."
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
                                <h3 className='text-lg font-medium mb-4'>
                                    Profesores {userFacultad === 'derecho' ? 'de Derecho' 
                                             : userFacultad === 'comercial' ? 'de Ciencias Empresariales'
                                             : userFacultad === 'medicina' ? 'de Medicina'
                                             : userFacultad === 'enfermeria' ? 'de Enfermería'
                                             : 'de Ingeniería'}:
                                </h3>
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
                            <div className='text-center py-6'>
                                <div className='bg-gray-800 rounded-lg p-6 border border-gray-600'>
                                    <div className='mb-4'>
                                        <svg className='w-16 h-16 text-gray-500 mx-auto mb-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                                            <path strokeLinecap='round' strokeLinejoin='round' strokeWidth='2' d='M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z'></path>
                                        </svg>
                                        <h3 className='text-lg font-medium text-white mb-2'>
                                            No se encontraron profesores
                                        </h3>
                                        <p className='text-gray-400 mb-4'>
                                            No pudimos encontrar ningún profesor {userFacultad === 'derecho' ? 'de Derecho' 
                                                                                : userFacultad === 'comercial' ? 'de Ciencias Empresariales'
                                                                                : userFacultad === 'medicina' ? 'de Medicina'
                                                                                : userFacultad === 'enfermeria' ? 'de Enfermería'
                                                                                : 'de Ingeniería'} con el nombre "<span className='text-white font-medium'>{searchTerm}</span>"
                                        </p>
                                    </div>
                                    
                                    <div className='space-y-3'>
                                        <p className='text-gray-300 text-sm'>
                                            ¿No encuentras al profesor que buscas?
                                        </p>
                                        <button 
                                            onClick={handleCreateProfesor}
                                            className='w-full bg-blue-600 hover:bg-blue-700 text-white py-3 px-4 rounded-lg transition-colors duration-200 font-medium flex items-center justify-center space-x-2'
                                        >
                                            <svg className='w-5 h-5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                                                <path strokeLinecap='round' strokeLinejoin='round' strokeWidth='2' d='M12 6v6m0 0v6m0-6h6m-6 0H6'></path>
                                            </svg>
                                            <span>Agregar nuevo profesor</span>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}

                        <p className='text-gray-400 mt-5'>Si no encuentras a tu profesor, escribe su nombre completo y haz click en Agregar.</p>
                        <p className='text-purple-400 mt-5'>Todo es ANONIMO 🕵️</p>
                    </>
                ) : userFacultad === null ? (
                    <div className='text-center py-8'>
                        <p className='text-gray-400 text-lg'>Verificando tu facultad...</p>
                    </div>
                ) : (
                    <div className='text-center py-8'>
                        <div className='bg-gray-800 rounded-lg p-6 border border-gray-600'>
                            <div className='mb-4'>
                                <svg className='w-16 h-16 text-gray-500 mx-auto mb-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                                    <path strokeLinecap='round' strokeLinejoin='round' strokeWidth='2' d='M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z'></path>
                                </svg>
                                <h3 className='text-lg font-medium text-white mb-2'>
                                    Facultad no disponible
                                </h3>
                                <p className='text-gray-400 mb-4'>
                                    La funcionalidad de rankings está disponible solo para estudiantes de Ingeniería, Derecho, Ingeniería Comercial, Medicina y Enfermería.
                                </p>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>

        {/* Popup de Confirmación de Actualización */}
        {showConfirmPopup && selectedProfesor && existingRatingData && (
            <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4'>
                <div className='bg-gray-800 rounded-lg p-6 w-full max-w-md mx-4 border border-gray-600'>
                    {/* Header del popup */}
                    <div className='text-center mb-6'>
                        <h3 className='text-xl font-bold text-white mb-2'>
                            Calificación Existente
                        </h3>
                        <p className='text-lg text-white font-medium mb-3'>
                            {selectedProfesor.nombre_apellido}
                        </p>
                        <p className='text-yellow-400 text-sm'>
                            ⚠️ Ya has calificado a este profesor
                        </p>
                    </div>

                    {/* Calificaciones actuales */}
                    <div className='bg-gray-700 rounded-lg p-4 mb-6'>
                        <h4 className='text-white font-semibold mb-3 text-center'>Tus calificaciones actuales:</h4>
                        <div className='space-y-2'>
                            <div className='flex justify-between items-center'>
                <span className='text-gray-300'>Personalidad:</span>
                <div className='flex'>
                  {Array.from({length: existingRatingData.personalidad || 0}, (_, i) => (
                    <span key={i+1} className='text-lg text-yellow-400'>⭐</span>
                  ))}
                </div>
                            </div>
                            <div className='flex justify-between items-center'>
                <span className='text-gray-300'>Método de Enseñanza:</span>
                <div className='flex'>
                  {Array.from({length: existingRatingData.metodo_ensenanza || 0}, (_, i) => (
                    <span key={i+1} className='text-lg text-yellow-400'>⭐</span>
                  ))}
                </div>
                            </div>
                            <div className='flex justify-between items-center'>
                <span className='text-gray-300'>Responsabilidad:</span>
                <div className='flex'>
                  {Array.from({length: existingRatingData.responsabilidad || 0}, (_, i) => (
                    <span key={i+1} className='text-lg text-yellow-400'>⭐</span>
                  ))}
                </div>
                            </div>
                        </div>
                    </div>

                    {/* Pregunta de confirmación */}
                    <div className='text-center mb-6'>
                        <p className='text-white text-lg font-medium'>
                            ¿Deseas cambiar tus calificaciones?
                        </p>
                    </div>

                    {/* Botones de acción */}
                    <div className='flex space-x-3'>
                        <button
                            onClick={handleCancelUpdate}
                            className='flex-1 bg-gray-600 hover:bg-gray-700 text-white py-3 px-4 rounded-lg transition-colors duration-200 font-medium'
                        >
                            No, mantener
                        </button>
                        <button
                            onClick={handleConfirmUpdate}
                            className='flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3 px-4 rounded-lg transition-colors duration-200 font-medium'
                        >
                            Sí, cambiar
                        </button>
                    </div>
                </div>
            </div>
        )}

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
                            {currentRatingStep === 3 
                                ? (isUpdatingRating ? 'Actualizar Rating' : 'Enviar Rating')
                                : 'Siguiente'
                            }
                        </button>
                    </div>
                </div>
            </div>
        )}

        {/* Popup de Mensaje Personalizado */}
        {showMessagePopup && (
            <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4'>
                <div className='bg-gray-800 rounded-lg p-6 w-full max-w-sm mx-4 border border-gray-600'>
                    {/* Ícono según el tipo */}
                    <div className='text-center mb-4'>
                        {messagePopupData.type === 'success' && (
                            <div className='w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4'>
                                <svg className='w-8 h-8 text-green-600' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                                    <path strokeLinecap='round' strokeLinejoin='round' strokeWidth='2' d='M5 13l4 4L19 7'></path>
                                </svg>
                            </div>
                        )}
                        {messagePopupData.type === 'error' && (
                            <div className='w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4'>
                                <svg className='w-8 h-8 text-red-600' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                                    <path strokeLinecap='round' strokeLinejoin='round' strokeWidth='2' d='M6 18L18 6M6 6l12 12'></path>
                                </svg>
                            </div>
                        )}
                        {messagePopupData.type === 'warning' && (
                            <div className='w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4'>
                                <svg className='w-8 h-8 text-yellow-600' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                                    <path strokeLinecap='round' strokeLinejoin='round' strokeWidth='2' d='M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z'></path>
                                </svg>
                            </div>
                        )}
                        
                        <h3 className='text-xl font-bold text-white mb-2'>
                            {messagePopupData.title}
                        </h3>
                        <p className='text-gray-300'>
                            {messagePopupData.message}
                        </p>
                    </div>

                    {/* Botón de cerrar */}
                    <div className='text-center'>
                        <button
                            onClick={closeMessagePopup}
                            className={`px-6 py-2 rounded-lg font-medium transition-colors duration-200 ${
                                messagePopupData.type === 'success' 
                                    ? 'bg-green-600 hover:bg-green-700 text-white'
                                    : messagePopupData.type === 'error'
                                    ? 'bg-red-600 hover:bg-red-700 text-white'
                                    : 'bg-yellow-600 hover:bg-yellow-700 text-white'
                            }`}
                        >
                            Entendido
                        </button>
                    </div>
                </div>
            </div>
        )}
        
        {/* ==== POPUP: Selección de facultad ==== */}
        {showFacultyModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center">
                {/* Overlay */}
                <div className="absolute inset-0 bg-black/60" />

                {/* Modal */}
                <div className="relative z-10 w-11/12 max-w-md rounded-xl border border-gray-700 bg-zinc-900 p-6 shadow-xl">
                    <h3 className="text-xl font-semibold mb-2 text-white">Completa tu facultad</h3>
                    <p className="text-sm text-gray-300 mb-4">
                        Selecciona tu facultad para acceder al sistema de calificaciones.
                    </p>

                    <div className="space-y-3">
                        <label className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${facultyChoice === 'ingenieria' ? 'border-blue-500 bg-blue-500/10' : 'border-gray-700 hover:border-gray-600'}`}>
                            <input
                                type="radio"
                                name="facultad"
                                value="ingenieria"
                                checked={facultyChoice === 'ingenieria'}
                                onChange={(e) => setFacultyChoice(e.target.value)}
                                className="accent-blue-500"
                            />
                            <span className="text-white">Escuela de ingeniería</span>
                        </label>

                        <label className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${facultyChoice === 'derecho' ? 'border-blue-500 bg-blue-500/10' : 'border-gray-700 hover:border-gray-600'}`}>
                            <input
                                type="radio"
                                name="facultad"
                                value="derecho"
                                checked={facultyChoice === 'derecho'}
                                onChange={(e) => setFacultyChoice(e.target.value)}
                                className="accent-blue-500"
                            />
                            <span className="text-white">Facultad de derecho</span>
                        </label>

                        <label className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${facultyChoice === 'comercial' ? 'border-blue-500 bg-blue-500/10' : 'border-gray-700 hover:border-gray-600'}`}>
                            <input
                                type="radio"
                                name="facultad"
                                value="comercial"
                                checked={facultyChoice === 'comercial'}
                                onChange={(e) => setFacultyChoice(e.target.value)}
                                className="accent-blue-500"
                            />
                            <span className="text-white">Ingeniería comercial</span>
                        </label>

                        <label className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${facultyChoice === 'medicina' ? 'border-blue-500 bg-blue-500/10' : 'border-gray-700 hover:border-gray-600'}`}>
                            <input
                                type="radio"
                                name="facultad"
                                value="medicina"
                                checked={facultyChoice === 'medicina'}
                                onChange={(e) => setFacultyChoice(e.target.value)}
                                className="accent-blue-500"
                            />
                            <span className="text-white">Facultad de medicina</span>
                        </label>

                        <label className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${facultyChoice === 'enfermeria' ? 'border-blue-500 bg-blue-500/10' : 'border-gray-700 hover:border-gray-600'}`}>
                            <input
                                type="radio"
                                name="facultad"
                                value="enfermeria"
                                checked={facultyChoice === 'enfermeria'}
                                onChange={(e) => setFacultyChoice(e.target.value)}
                                className="accent-blue-500"
                            />
                            <span className="text-white">Enfermería</span>
                        </label>
                    </div>

                    {facultyError && (
                        <p className="text-red-400 text-sm mt-3">{facultyError}</p>
                    )}

                    <div className="mt-5 flex justify-end gap-3">
                        <button
                            type="button"
                            className="px-4 py-2 rounded-md bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-60"
                            onClick={handleSaveFaculty}
                            disabled={savingFaculty}
                        >
                            {savingFaculty ? 'Guardando...' : 'Guardar'}
                        </button>
                    </div>
                </div>
            </div>
        )}
    </div>
  )
}

export default SearchForRanking