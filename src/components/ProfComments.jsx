import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import logo from '../assets/smallwhitelogo.png';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../supabaseClient';


const ProfComments = () => {
  const { id } = useParams();
  const [profesorPromedios, setProfesorPromedios] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [nombreytal, setNombreytal] = useState([]);
  const [comentario, setComentario] = useState('');
  const [comentarioUI, setComentarioUI] = useState([]);
  const [textareaPlaceholder, setTextareaPlaceholder] = useState('Comenta tu opinión!');

  useEffect(() => {
    fetchProfesorData();
    fetchRankingData();
    loadComents();
    }, [id, comentario]); // Fetch data when the component mounts or id changes


    useEffect(() => {

    });

    useEffect(() => {

    }, [comentarioUI], );


  
  const { session, signOut } = useAuth();
  const navigate = useNavigate();
  const scrollContainerRef = useRef(null);
  const textareaRef = useRef(null);


  const handleLogoClick = () => {
    navigate('/dashboard');
  };

  const handleComentarioSubmit = async () => {
    console.log("comentario: " + comentario)

    try {
        if (comentario.trim() === "") {
            setTextareaPlaceholder("escribe algo antes de enviar!");
        return;
    }
    setTextareaPlaceholder("Comenta tu opinión!");

    const commentData = {
        usuario_id: session?.user.id,
        profesor_id: id,
        texto: comentario,
    };
    
    console.log("datos: " + commentData) 

    let result;

    result = await supabase
        .from('comentarios_ing')
        .insert({ 
            usuario_id: session?.user.id,
            profesor_id: id,
            texto: comentario.trim(),
         })

    console.log("result submit: " + result)

    if (result.error) {
        console.error('Error inserting comment:', result.error);
        return;
    };


    } catch (error) {
        console.error('Error al comentar:', error);
        return;
    } finally {
        setComentario('');
    }

  };


  const ajustarCajaComentario = () => {
    const textarea = textareaRef.current;
    if (textarea) {
        textarea.style.height = 'auto';
        const newHeight = Math.min(textarea.scrollHeight, 200); // Maximum height in pixels
        textarea.style.height = `${newHeight}px`;
    }
  };

  const loadComents = async () => {
    //cargasion de comentarios
    setIsLoading(true);
    try {

        //agarro los comentarios
        const { data: comentarios, error: comentariosError } = await supabase
            .from('comentarios_ing')
            .select('*')
            .eq('aprobado', true); //filtrar por usuario logueado
        if (comentariosError) throw comentariosError;

        const listac = comentarios ?? [];
        if (listac.length === 0) {
            return;
        }

        setComentarioUI(comentarios);

        return;
    } catch (error) {
        console.error(error);
        return;
    } finally {
        setIsLoading(false);
    }
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

        setNombreytal(profesores);


    } catch (error) {
        console.error('Error fetching shit:', error);
    } finally {
        setIsLoading(false);
    }
  };

  const fetchRankingData = async () => {
    setIsLoading(true)
    try {
        const { data: profesor_promedios, error: profesor_promediosError} = await supabase
            .from('profesores_ranked')
            .select('*')
            .eq('id_profesor', id)
            .single();

        if (profesor_promediosError) throw profesor_promediosError;

        setProfesorPromedios(profesor_promedios);

    } catch (error) {
        console.error('Error fetching shit:', error);
    } finally {
        setIsLoading(false)
    }
  };

  //###########################
  //tailwind y etc vvv
  //###########################

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

        {/* caja con info del profesor */}
        <div
        className='bg-zinc-800 rounded-lg p-4 border border-zinc-600 mx-5'
        >
            <div className='flex items-center justify-between mb-3'>
                <div className='flex items-center space-x-3'>
                    <div>
                        <h3 className='text-white font-medium text-lg'>
                        {nombreytal.nombre_apellido || `Cargando...`}
                        </h3>
                    </div>
                </div>
                <div className='text-right'>
                    <div className='text-yellow-400 font-bold text-lg'>
                      {profesorPromedios.puntaje_ponderado?.toFixed(1) || 'N/A'}
                    </div>
                    <p className='text-gray-400 text-xs'>Puntaje total</p>
                  </div>
            </div>

            <div className='grid grid-cols-3 gap-2'>
                <div className='text-center rounded-lg p-3'>
                    <div className='text-white font-semibold'>
                        {profesorPromedios.prom_personalidad?.toFixed(1) || 'N/A'}
                    </div>
                    <p className='text-gray-400 text-xs mt-1'>Personalidad</p>
                </div>
                <div className='text-center rounded-lg p-3'>
                    <div className='text-white font-semibold'>
                        {profesorPromedios.prom_metodo_ensenanza?.toFixed(1) || 'N/A'}
                    </div>
                    <p className='text-gray-400 text-xs mt-1'>Método</p>
                </div>
                <div className='text-center rounded-lg p-3'>
                    <div className='text-white font-semibold'>
                        {profesorPromedios.prom_responsabilidad?.toFixed(1) || 'N/A'}
                    </div>
                    <p className='text-gray-400 text-xs mt-1'>Responsabilidad</p>
                </div>
            </div>
        </div>

        
        <div className="mx-5 pt-3 rounded-lg  bg-zinc-900 border border-gray-600 mt-4">
            <div className="relative w-full mx-auto ">
                <div className="flex items-start ">
                    <div
                    className= "pb-3"
                    > {/* dumahh div para que el texto no se suba al padding */}
                    <textarea
                    ref= {textareaRef}
                    value= {comentario}
                    onChange={(e) => {
                        setComentario(e.target.value);
                        ajustarCajaComentario();
                    }}
                    className="flex w-full min-h-[52px] max-h-[105px] rounded-lg rounded-b-none px-4 
                    bg-zinc-900 text-white placeholder:text-white/70 border-0 outline-none 
                    resize-none focus:ring-0 focus:outline-none leading-[1.2] overflow-y-scroll
                    scrollbar-hide box-content"
                    placeholder={textareaPlaceholder}
                    id="ai-input"
                    ></textarea>
                </div>

                <div className= 'w-30'>
                <button
                    onClick= {handleComentarioSubmit}
                    className="rounded-lg p-2 !bg-white/10 hover:bg-white/20 text-white/80 hover:text-white 
                    cursor-pointer transition-colors focus: !outline-none focus: !ring-0 active: transform active:scale-90 active:!bg-white/30 button-override
                    absolute right-2 bottom-2"
                    type="button"
                    disabled={!comentario.trim()}
                >
                <svg
                    strokeLinejoin="round"
                    strokeLinecap="round"
                    strokeWidth="2"
                    stroke="currentColor"
                    fill="curre"
                    viewBox="0 0 24 24"
                    height="16"
                    width="16"
                    xmlns="http://www.w3.org/2000/svg"
                >
                    <path d="m22 2-7 20-4-9-9-4Z"></path>
                    <path d="M22 2 11 13"></path>
                </svg>
                </button>
                </div>

                </div>
            </div>
        </div>
        

        {/* aqui falta un div para el comentario del usuario */}


        {/* Aquí irían los comentarios */}           
        <div className='py-6'>
            <div
            ref={scrollContainerRef}
            className='w-full h-full flex-1 overflow-y-auto flex flex-col scrollbar-hide'
            style={{
                height: 'calc(100vh - 400px)',
                scrollSnapType: 'y mandatory', 
                msOverflowStyle: 'none', 
                scrollbarWidth: 'none'}}
            >
                
                {comentarioUI
                .filter(comentario => comentario.profesor_id === id)
                .map((comentario) => (
                
                <div 
                style={{ scrollSnapAlign: 'start' }}
                key={comentario.id}
                className="mx-5 mt-4 ">
                    <div className="space-y-4">
                        {/* Ejemplo de comentario */}
                        <div className="bg-zinc-800 p-4 rounded-lg border border-zinc-600">
                            <p className="text-white">{comentario.texto}</p>
                            <span className="text-gray-400 text-sm">- Anonimo</span>
                        </div>
                    </div>
                </div>
                ))}
            </div>
        </div>
    </div>
  );
};

export default ProfComments;