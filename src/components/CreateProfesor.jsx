import React, { useState } from 'react';
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
  const { session, signOut } = useAuth();
  const navigate = useNavigate();

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!nombreApellido.trim()) {
      showMessage('⚠️ Debes ingresar un nombre y apellido', 'error');
      return;
    }

    // Traer todos los docentes
    const { data: existente, error: errorBuscar } = await supabase
      .from("profesores")
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
      showMessage('⚠️ Ya existe un docente con un nombre similar', 'error');
      return;
    }

    // Insertar nuevo docente
    const { error: errorInsertar } = await supabase
      .from("profesores")
      .insert([{ nombre_apellido: nombreApellido.trim() }]);
      setTimeout(() => navigate("/search-ranking"), 1000);

    if (errorInsertar) {
      console.error(errorInsertar);
      showMessage('❌ Error al agregar el docente', 'error');
    } else {
      showMessage('✅ Docente agregado correctamente', 'success');
      setNombreApellido('');
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
          <p className='font-md mb-4'>Agrega un nuevo profesor (no uses tildes en el nombre)</p>
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
        </div>
      </div>
    </div>
  );
};

export default CreateProfesor;