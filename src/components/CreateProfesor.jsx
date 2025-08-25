import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import logo from '../assets/smallwhitelogo.png';
import { supabase } from '../supabaseClient';

// Función para calcular la distancia de Levenshtein
function distanciaLevenshtein(a, b) {
  const matrix = Array.from({ length: b.length + 1 }, (_, i) => [i]);
  for (let j = 0; j <= a.length; j++) matrix[0][j] = j;

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b[i - 1].toLowerCase() === a[j - 1].toLowerCase()) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }
  return matrix[b.length][a.length];
}

const CreateProfesor = () => {
  const [nombreApellido, setNombreApellido] = useState('');
  const [mensaje, setMensaje] = useState('');
  const [mensajeTipo, setMensajeTipo] = useState(''); // 'success' o 'error'
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  
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

  const showMessage = (texto, tipo) => {
    setMensaje(texto);
    setMensajeTipo(tipo);
    setTimeout(() => setMensaje(''), 3000); // desaparece después de 3s
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
        facultad: facultyChoice,   // 'ingenieria' o 'derecho'
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!nombreApellido.trim()) {
      showMessage('⚠️ Debes ingresar un nombre y apellido', 'error');
      return;
    }

    // Determinar tabla según la facultad del usuario
    const tableName = userFacultad === 'derecho' ? 'profesores_derecho' 
                    : userFacultad === 'comercial' ? 'profesores_comercial'
                    : 'profesores';

    // Traer todos los docentes de la tabla correspondiente
    const { data: existente, error: errorBuscar } = await supabase
      .from(tableName)
      .select("nombre_apellido");

    if (errorBuscar) {
      console.error(errorBuscar);
      showMessage('❌ Error al verificar el docente', 'error');
      return;
    }

    // Verificar nombres similares usando Levenshtein
    const umbral = 2; 
    const similares = existente.filter(prof => 
      distanciaLevenshtein(prof.nombre_apellido.trim(), nombreApellido.trim()) <= umbral
    );

    if (similares.length > 0) {
      const facultyName = userFacultad === 'derecho' ? 'de Derecho' 
                        : userFacultad === 'comercial' ? 'de Ingeniería Comercial'
                        : 'de Ingeniería';
      showMessage(`⚠️ Ya existe un docente ${facultyName} con un nombre similar`, 'error');
      return;
    }

    // Insertar nuevo docente en la tabla correspondiente
    const { error: errorInsertar } = await supabase
      .from(tableName)
      .insert([{ nombre_apellido: nombreApellido.trim() }]);

    if (errorInsertar) {
      console.error(errorInsertar);
      showMessage('❌ Error al agregar el docente', 'error');
    } else {
      const facultyName = userFacultad === 'derecho' ? 'de Derecho' 
                        : userFacultad === 'comercial' ? 'de Ingeniería Comercial'
                        : 'de Ingeniería';
      showMessage(`✅ Docente ${facultyName} agregado correctamente`, 'success');
      setNombreApellido('');
      setTimeout(() => navigate("/search-ranking"), 1000);
    }
  };

  return (
    <div className='min-h-screen text-white' style={{backgroundColor: '#2D2D2D'}}>
      {/* Header */}
      <div className='flex justify-between items-center p-4'>
        <div className='flex items-center'>
          <img 
            src={logo} 
            alt="RankProf" 
            className='h-12 w-auto cursor-pointer hover:opacity-80 transition-opacity duration-200 dropshadow-lg'
            style={{ boxShadow: '0 4px 16px 0 rgba(0, 0, 0, 0.8)' }} 
            onClick={handleLogoClick}
          />
        </div>
        <div className='relative'>
          <button 
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className='flex flex-col justify-center items-center w-10 h-10 space-y-1 focus:outline-none hover:bg-gray-700 rounded-md p-2 transition-colors duration-200'
          >
            <div className='w-6 h-1 bg-white rounded-full'></div>
            <div className='w-6 h-1 bg-white rounded-full'></div>
            <div className='w-6 h-1 bg-white rounded-full'></div>
          </button>
          {isMenuOpen && (
            <div className='absolute right-0 mt-2 w-64 bg-gray-800 rounded-lg shadow-lg z-10 border border-gray-700'>
              <div className='p-4'>
                <div className='mb-4 pb-4 border-b border-gray-600'>
                  <p className='text-sm text-gray-300 mb-1'>Bienvenido</p>
                  <p className='text-white font-medium text-sm break-all'>{session?.user?.email}</p>
                </div>
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
        <div className='max-w-md w-full mt-6'>
          {/* Verificar si el usuario tiene acceso según su facultad */}
          {userFacultad && (userFacultad === 'ingenieria' || userFacultad === 'derecho' || userFacultad === 'comercial') ? (
            <>
              <p className='font-md mb-4'>
                Agrega un nuevo profesor (no uses tildes en el nombre)
              </p>
              <form onSubmit={handleSubmit} className='space-y-4'>
                <input
                  type="text"
                  placeholder="Nombre y Apellido"
                  value={nombreApellido}
                  onChange={(e) => setNombreApellido(e.target.value)}
                  className='w-full p-3 text-white rounded-lg border border-gray-600 focus:border-blue-500 focus:outline-none transition-colors duration-200'
                  style={{backgroundColor: '#1A1A1A'}}
                />
                <button
                  type="submit"
                  className='w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded shadow-lg hover:shadow-xl transition-all duration-200'
                >
                  Agregar
                </button>
              </form>

              {/* Mensaje de éxito/error */}
              {mensaje && (
                <div 
                  className={`mt-4 p-3 rounded text-center font-medium ${
                    mensajeTipo === 'success' ? 'bg-green-600 text-white' : 'bg-red-600 text-white'
                  }`}
                >
                  {mensaje}
                </div>
              )}
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
                    La funcionalidad de agregar profesores está disponible solo para estudiantes de Ingeniería, Derecho e Ingeniería Comercial.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ==== POPUP: Selección de facultad ==== */}
      {showFacultyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Overlay */}
          <div className="absolute inset-0 bg-black/60" />

          {/* Modal */}
          <div className="relative z-10 w-11/12 max-w-md rounded-xl border border-gray-700 bg-zinc-900 p-6 shadow-xl">
            <h3 className="text-xl font-semibold mb-2 text-white">Completa tu facultad</h3>
            <p className="text-sm text-gray-300 mb-4">
              Selecciona tu facultad para acceder al sistema de profesores.
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
  );
};

export default CreateProfesor;