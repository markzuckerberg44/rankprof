import React, { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { useNavigate } from 'react-router-dom'
import logo from '../assets/smallwhitelogo.png'
import { supabase } from '../supabaseClient'


const Dashboard = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [profesorPromedios, setProfesorPromedios] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [sortOrder, setSortOrder] = useState('desc'); // 'desc' para alto a bajo, 'asc' para bajo a alto
  const [searchRanking, setSearchRanking] = useState("");
  const { session, signOut } = useAuth();
  const navigate = useNavigate();

  // Cargar profesores con promedios al montar el componente
  useEffect(() => {
    loadProfesorPromedios();
  }, [sortOrder]);

  const loadProfesorPromedios = async () => {
    setIsLoading(true);
    try {
      // Paso 1: Consulta básica a profesor_promedios
      const { data: promedios, error: promediosError } = await supabase
        .from('profesor_promedios')
        .select('*');

      if (promediosError) {
        console.error('Error al obtener promedios:', promediosError);
        setProfesorPromedios([]);
        return;
      }

      if (!promedios || promedios.length === 0) {
        setProfesorPromedios([]);
        return;
      }

      // Paso 2: Ordenar manualmente
      const promediosOrdenados = [...promedios].sort((a, b) => {
        if (sortOrder === 'asc') {
          return (a.puntaje_ponderado || 0) - (b.puntaje_ponderado || 0);
        } else {
          return (b.puntaje_ponderado || 0) - (a.puntaje_ponderado || 0);
        }
      });

      // Paso 3: Obtener nombres de profesores
      const { data: profesores, error: profesoresError } = await supabase
        .from('profesores')
        .select('id, nombre_apellido');

      if (profesoresError) {
        console.error('Error al obtener profesores:', profesoresError);
        setProfesorPromedios([]);
        return;
      }

      // Paso 4: Contar ratings de cada profesor desde la tabla calificaciones
      const profesorIds = promediosOrdenados.map(p => p.profesor_id);
      const { data: calificaciones, error: calificacionesError } = await supabase
        .from('calificaciones')
        .select('profesor_id')
        .in('profesor_id', profesorIds);

      if (calificacionesError) {
        console.error('Error al obtener calificaciones:', calificacionesError);
      }

      // Contar cuántas veces aparece cada profesor_id
      const conteoRatings = {};
      if (calificaciones) {
        calificaciones.forEach(cal => {
          conteoRatings[cal.profesor_id] = (conteoRatings[cal.profesor_id] || 0) + 1;
        });
      }

      // Paso 5: Combinar datos
      const resultado = promediosOrdenados.map(promedio => {
        const profesor = profesores?.find(p => {
          return String(p.id) === String(promedio.profesor_id);
        });
        return {
          ...promedio,
          total_ratings: conteoRatings[promedio.profesor_id] || 0,
          profesores: profesor ? {
            nombre_apellido: profesor.nombre_apellido,
            departamento: null
          } : {
            nombre_apellido: 'Profesor no encontrado',
            departamento: null
          }
        };
      });

      setProfesorPromedios(resultado);

    } catch (error) {
      console.error('Error al cargar datos:', error);
      setProfesorPromedios([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSortChange = (e) => {
    setSortOrder(e.target.checked ? 'asc' : 'desc');
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

  const handleSendRanking = () => {
    navigate("/search-ranking");
  };

  const handleLogoClick = () => {
    navigate("/dashboard");
  };
    
  return (
    <div className='min-h-screen text-white' style={{backgroundColor: '#2D2D2D'}}>
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
      <div className='flex flex-col items-center px-0' style={{height: 'calc(100vh - 80px)', overflow: 'hidden'}}>
        <div className='max-w-md w-full text-center'>
          <div className='px-4'>
            <button 
              onClick={handleSendRanking}
              className='mt-6 w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded shadow-lg hover:shadow-xl transition-all duration-200 mb-4'
            >
              ⭐ Enviar ranking ⭐
            </button>
          </div>
          <h2 className='text-2xl font-thin mb-4 mt-6'>Tabla de rankings</h2>
          {/* Switch Toggle Component */}
          <div className='flex justify-center mb-6'>
            <label htmlFor="filter" className="switch" aria-label="Toggle Filter">
              <input 
                type="checkbox" 
                id="filter" 
                checked={sortOrder === 'asc'}
                onChange={handleSortChange}
              />
              <span>De alto a bajo</span>
              <span>De bajo a alto</span>
            </label>
          </div>
          {/* Barra de búsqueda para rankings */}
          <div className='mb-6 flex justify-center px-4'>
            <input
              type='text'
              value={searchRanking}
              onChange={e => setSearchRanking(e.target.value)}
              placeholder='Buscar profesor en rankings...'
              className='w-full max-w-md p-3 text-white rounded-lg border border-gray-600 focus:border-blue-500 focus:outline-none transition-colors duration-200 bg-zinc-900 px-4'
            />
          </div>
        </div>
        {/* Lista de profesores con rankings */}
        {isLoading ? (
          <div className='text-center py-4'>
            <p className='text-gray-400'>Cargando rankings...</p>
          </div>
        ) : (
          <div className='w-full h-full flex-1 overflow-y-auto flex flex-col gap-6 scrollbar-hide px-4 py-6' style={{scrollSnapType: 'y mandatory', msOverflowStyle: 'none', scrollbarWidth: 'none'}}>
            {profesorPromedios
              .filter(profesor => {
                const nombre = profesor.profesores?.nombre_apellido?.toLowerCase() || '';
                return nombre.includes(searchRanking.toLowerCase());
              })
              .map((profesor, index) => (
                <div 
                  key={profesor.profesor_id} 
                  className='bg-zinc-800 rounded-lg p-4 border border-zinc-600' style={{ scrollSnapAlign: 'start' }}
                >
                  {/* Header con ranking y nombre */}
                  <div className='flex items-center justify-between mb-3'>
                    <div className='flex items-center space-x-3'>
                      <div className={  index === 0 ? 
                        'flex items-center justify-center w-8 h-8 rounded-full text-white font-bold text-sm shadow-md shadow-yellow-400' : index === 1 ?
                        'flex items-center justify-center w-8 h-8 rounded-full text-white font-bold text-sm shadow-md shadow-yellow-400' : index === 2 ? 'flex items-center justify-center w-8 h-8 rounded-full text-white font-bold text-sm' : 'flex items-center justify-center w-8 h-8 rounded-full text-white font-bold text-sm'} 
                        style={{
                          background:
                            sortOrder === "desc"
                              ? (index === 0
                                  ? "linear-gradient(to right, #ffd000ff, #685f14ff)"
                                  : index === 1
                                    ? "linear-gradient(to right, #646464ff, #e6e6e6ff)"
                                    : index === 2
                                      ? "linear-gradient(to right, #a37621ff, #66503bff)"
                                      : "#686868")
                              : sortOrder === "asc"
                                ? (index === 0
                                    ? "linear-gradient(to right, #9b2626ff, #ff0000ff)"
                                    : index === 1
                                      ? "linear-gradient(to right, #5f1813ff, #9e0f0fff)"
                                      : index === 2
                                        ? "linear-gradient(to right, #813421ff, #99460eff)"
                                        : "#686868")
                                : "#686868",

                          boxShadow:
                            sortOrder === "desc" && index === 0
                              ? "0 0 9px 3px rgba(255, 215, 0, 0.5)"
                              : "none",
                        }}>
                        {index + 1}
                      </div>
                      <div>
                        <h3 className='text-white font-medium text-lg'>
                          {profesor.profesores?.nombre_apellido || `Profesor ID: ${profesor.profesor_id}`}
                        </h3>
                        <p className='text-gray-400 text-sm'>
                          {profesor.total_ratings || 0} rating{(profesor.total_ratings || 0) !== 1 ? 's' : ''}
                        </p>
                      </div>
                    </div>
                    <div className='text-right'>
                      <div className='text-yellow-400 font-bold text-lg'>
                        {profesor.puntaje_ponderado?.toFixed(1) || 'N/A'}
                      </div>
                      <p className='text-gray-400 text-xs'>Puntaje total</p>
                    </div>
                  </div>
                  {/* Promedios por categoría */}
                  <div className='grid grid-cols-3 gap-2'>
                    <div className='text-center rounded-lg p-3'>
                      <div className='text-white font-semibold'>
                        {profesor.prom_personalidad?.toFixed(1) || 'N/A'}
                      </div>
                      <p className='text-gray-400 text-xs mt-1'>Personalidad</p>
                    </div>
                    <div className='text-center rounded-lg p-3'>
                      <div className='text-white font-semibold'>
                        {profesor.prom_metodo_ensenanza?.toFixed(1) || profesor.prom_metodo?.toFixed(1) || 'N/A'}
                      </div>
                      <p className='text-gray-400 text-xs mt-1'>Método</p>
                    </div>
                    <div className='text-center rounded-lg p-3'>
                      <div className='text-white font-semibold'>
                        {profesor.prom_responsabilidad?.toFixed(1) || 'N/A'}
                      </div>
                      <p className='text-gray-400 text-xs mt-1'>Responsabilidad</p>
                    </div>
                  </div>
                </div>
              ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default Dashboard