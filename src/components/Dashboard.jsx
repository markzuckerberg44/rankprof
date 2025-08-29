import React, { useState, useEffect, useRef } from 'react'
import { useAuth } from '../context/AuthContext'
import { useNavigate } from 'react-router-dom'
import logo from '../assets/smallwhitelogo.png'
import speechBubble from '../assets/speechBubble.png'
import { supabase } from '../supabaseClient'
import CustomButton from './CustomButton'

const Dashboard = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [profesoresUI, setProfesoresUI] = useState([]); // datos normalizados para render
  const [isLoading, setIsLoading] = useState(false);
  const [sortOrder, setSortOrder] = useState('desc'); // 'desc' alto→bajo, 'asc' bajo→alto
  const [searchRanking, setSearchRanking] = useState('');
  const [totalProfesores, setTotalProfesores] = useState(null);
  const [activeFilter, setActiveFilter] = useState('top'); // 'todos' | 'top'
  const [userFacultad, setUserFacultad] = useState(null);
  // ==== POPUP: estado ====
  const [showFacultyModal, setShowFacultyModal] = useState(false);
  const [facultyChoice, setFacultyChoice] = useState(null);
  const [savingFaculty, setSavingFaculty] = useState(false);
  const [facultyError, setFacultyError] = useState('');


  const { session, signOut } = useAuth();
  const navigate = useNavigate();
  const scrollContainerRef = useRef(null);

  // ===== Efectos: cargar según filtro y orden/búsqueda =====

  // ==== POPUP: checkear si el usuario tiene "facultad" en profiles ====
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


  useEffect(() => {
    // Solo cargar datos si ya conocemos la facultad del usuario
    if (userFacultad === null) {
      // Aún no sabemos la facultad, no cargar nada
      return;
    }
    
    // Cargar datos según la facultad del usuario
    if (userFacultad === 'ingenieria') {
      if (activeFilter === 'todos') {
        loadDesdePromedios();
      } else {
        loadDesdeRanked();
      }
    } else if (userFacultad === 'derecho') {
      if (activeFilter === 'todos') {
        loadDerechoTodos();
      } else {
        loadDerechoRanked();
      }
    } else if (userFacultad === 'comercial') {
      if (activeFilter === 'todos') {
        loadComercialTodos();
      } else {
        loadComercialRanked();
      }
    } else if (userFacultad === 'medicina') {
      if (activeFilter === 'todos') {
        loadMedicinaTodos();
      } else {
        loadMedicinaRanked();
      }
    } else {
      // Facultad no soportada, limpiar datos
      setProfesoresUI([]);
      setTotalProfesores(0);
      setIsLoading(false);
    }
  }, [activeFilter, sortOrder, searchRanking, userFacultad]);

  // ===== Efecto: scroll to top cuando cambian los datos =====
  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = 0;
    }
  }, [profesoresUI]);

  // ====== Carga: modo "Todos" (profesor_promedios) ======
  const loadDesdePromedios = async () => {
    setIsLoading(true);
    try {
      // 1) Traer promedios
      const { data: promedios, error: promediosError } = await supabase
        .from('profesor_promedios')
        .select('*');

      if (promediosError) throw promediosError;

      const lista = promedios ?? [];
      if (lista.length === 0) {
        setProfesoresUI([]);
        setTotalProfesores(0);
        return;
      }

      // 2) Orden por puntaje_ponderado
      const ordenados = [...lista].sort((a, b) => {
        const A = a.puntaje_ponderado ?? 0;
        const B = b.puntaje_ponderado ?? 0;
        return sortOrder === 'asc' ? A - B : B - A;
      });

      // 3) Traer nombres
      const { data: profesores, error: profesoresError } = await supabase
        .from('profesores')
        .select('id, nombre_apellido');

      if (profesoresError) throw profesoresError;

      // 4) Conteo de ratings
      const ids = ordenados.map(p => p.profesor_id);
      const { data: calificaciones, error: calificacionesError } = await supabase
        .from('calificaciones')
        .select('profesor_id')
        .in('profesor_id', ids);

      if (calificacionesError) {
        console.error('Error al obtener calificaciones:', calificacionesError);
      }

      const conteoRatings = {};
      (calificaciones ?? []).forEach(c => {
        conteoRatings[c.profesor_id] = (conteoRatings[c.profesor_id] || 0) + 1;
      });

      // 5) Normalizar + fallback de posición si no existe
      const profMap = new Map((profesores ?? []).map(p => [String(p.id), p]));
      const normalizados = ordenados.map((row, idx) => {
        const info = profMap.get(String(row.profesor_id));
        const pos = row.pos_ranking ?? (idx + 1);
        return {
          profesor_id: row.profesor_id,
          pos_ranking: pos,
          prom_personalidad: row.prom_personalidad,
          prom_metodo_ensenanza: row.prom_metodo_ensenanza ?? row.prom_metodo,
          prom_responsabilidad: row.prom_responsabilidad,
          puntaje_ponderado: row.puntaje_ponderado,
          total_ratings: conteoRatings[row.profesor_id] || 0,
          profesores: info
            ? { nombre_apellido: info.nombre_apellido, departamento: null }
            : { nombre_apellido: 'Profesor no encontrado', departamento: null },
        };
      });

      // 6) Filtro por búsqueda
      const q = (searchRanking ?? '').trim().toLowerCase();
      const filtrados =
        q === ''
          ? normalizados
          : normalizados.filter(p =>
              (p.profesores?.nombre_apellido ?? '').toLowerCase().includes(q)
            );

      setProfesoresUI(filtrados);
      setTotalProfesores(normalizados.length);
    } catch (error) {
      console.error('Error en modo "Todos":', error);
      setProfesoresUI([]);
      setTotalProfesores(0);
    } finally {
      setIsLoading(false);
    }
  };

  // ====== Carga: modo "Los más calificados" (profesores_ranked) ======
  const loadDesdeRanked = async () => {
    setIsLoading(true);
    try {
      // 1) Traer ranked
      const { data: ranked, error: rankedError } = await supabase
        .from('profesores_ranked')
        .select('id_profesor, ranked_pos, prom_personalidad, prom_metodo_ensenanza, prom_responsabilidad, puntaje_ponderado');

      if (rankedError) throw rankedError;

      const lista = ranked ?? [];
      if (lista.length === 0) {
        setProfesoresUI([]);
        setTotalProfesores(0);
        return;
      }

      // 2) Ordenar por puntaje_ponderado (mantenemos misma UX)
      const ordenados = [...lista].sort((a, b) => {
        const A = a.puntaje_ponderado ?? 0;
        const B = b.puntaje_ponderado ?? 0;
        return sortOrder === 'asc' ? A - B : B - A;
      });

      // 3) Traer nombres
      const { data: profesores, error: profesoresError } = await supabase
        .from('profesores')
        .select('id, nombre_apellido');

      if (profesoresError) throw profesoresError;

      const profMap = new Map((profesores ?? []).map(p => [String(p.id), p]));

      // 4) Conteo de ratings (AQUÍ ESTABA EL PROBLEMA: ahora sí contamos)
      const ids = ordenados.map(p => p.id_profesor);
      const { data: califs, error: califsError } = await supabase
        .from('calificaciones')
        .select('profesor_id')
        .in('profesor_id', ids);

      if (califsError) {
        console.error('Error al obtener calificaciones (top):', califsError);
      }

      const ratingsCount = {};
      (califs ?? []).forEach(c => {
        ratingsCount[c.profesor_id] = (ratingsCount[c.profesor_id] || 0) + 1;
      });

      // 5) Normalizar con POSICIÓN desde ranked_pos
      const normalizados = ordenados.map(row => {
        const info = profMap.get(String(row.id_profesor));
        return {
          profesor_id: row.id_profesor,
          pos_ranking: row.ranked_pos, // posición de la tabla ranked
          prom_personalidad: row.prom_personalidad,
          prom_metodo_ensenanza: row.prom_metodo_ensenanza,
          prom_responsabilidad: row.prom_responsabilidad,
          puntaje_ponderado: row.puntaje_ponderado,
          total_ratings: ratingsCount[row.id_profesor] || 0, // ← ahora sí mostramos el total
          profesores: info
            ? { nombre_apellido: info.nombre_apellido, departamento: null }
            : { nombre_apellido: 'Profesor no encontrado', departamento: null },
        };
      });

      // 6) Filtro por búsqueda
      const q = (searchRanking ?? '').trim().toLowerCase();
      const filtrados =
        q === ''
          ? normalizados
          : normalizados.filter(p =>
              (p.profesores?.nombre_apellido ?? '').toLowerCase().includes(q)
            );

      setProfesoresUI(filtrados);
      setTotalProfesores(normalizados.length);
    } catch (error) {
      console.error('Error en modo "Los más calificados":', error);
      setProfesoresUI([]);
      setTotalProfesores(0);
    } finally {
      setIsLoading(false);
    }
  };

  // ====== Carga: modo "Todos" para DERECHO (profesores_promedios_derecho) ======
  const loadDerechoTodos = async () => {
    setIsLoading(true);
    try {
      // 1) Traer promedios de derecho
      const { data: promedios, error: promediosError } = await supabase
        .from('profesores_promedios_derecho')
        .select('*');

      if (promediosError) throw promediosError;

      const lista = promedios ?? [];
      if (lista.length === 0) {
        setProfesoresUI([]);
        setTotalProfesores(0);
        return;
      }

      // 2) Orden por pos_todos (NO por puntaje_ponderado)
      const ordenados = [...lista].sort((a, b) => {
        const posA = a.pos_todos ?? 999999;
        const posB = b.pos_todos ?? 999999;
        return sortOrder === 'asc' ? posB - posA : posA - posB; // asc = peor a mejor, desc = mejor a peor
      });

      // 3) Traer nombres de profesores_derecho
      const { data: profesores, error: profesoresError } = await supabase
        .from('profesores_derecho')
        .select('id, nombre_apellido');

      if (profesoresError) throw profesoresError;

      // 4) Conteo de ratings desde calificaciones_derecho
      const ids = ordenados.map(p => p.id_profesor);
      const { data: calificaciones, error: calificacionesError } = await supabase
        .from('calificaciones_derecho')
        .select('profesor_id')
        .in('profesor_id', ids);

      if (calificacionesError) {
        console.error('Error al obtener calificaciones derecho:', calificacionesError);
      }

      const conteoRatings = {};
      (calificaciones ?? []).forEach(c => {
        conteoRatings[c.profesor_id] = (conteoRatings[c.profesor_id] || 0) + 1;
      });

      // 5) Normalizar usando pos_todos como posición de ranking
      const profMap = new Map((profesores ?? []).map(p => [String(p.id), p]));
      const normalizados = ordenados.map((row, idx) => {
        const info = profMap.get(String(row.id_profesor));
        const pos = row.pos_todos ?? (idx + 1); // usar pos_todos
        return {
          profesor_id: row.id_profesor,
          pos_ranking: pos,
          prom_personalidad: row.prom_personalidad,
          prom_metodo_ensenanza: row.prom_metodo_ensenanza,
          prom_responsabilidad: row.prom_responsabilidad,
          puntaje_ponderado: row.puntaje_ponderado,
          total_ratings: conteoRatings[row.id_profesor] || 0,
          profesores: info
            ? { nombre_apellido: info.nombre_apellido, departamento: null }
            : { nombre_apellido: 'Profesor no encontrado', departamento: null },
        };
      });

      // 6) Filtro por búsqueda
      const q = (searchRanking ?? '').trim().toLowerCase();
      const filtrados =
        q === ''
          ? normalizados
          : normalizados.filter(p =>
              (p.profesores?.nombre_apellido ?? '').toLowerCase().includes(q)
            );

      setProfesoresUI(filtrados);
      setTotalProfesores(normalizados.length);
    } catch (error) {
      console.error('Error en modo "Todos" (Derecho):', error);
      setProfesoresUI([]);
      setTotalProfesores(0);
    } finally {
      setIsLoading(false);
    }
  };

  // ====== Carga: modo "Los más calificados" para DERECHO ======
  const loadDerechoRanked = async () => {
    setIsLoading(true);
    try {
      // 1) Traer todos los promedios de derecho
      const { data: promedios, error: promediosError } = await supabase
        .from('profesores_promedios_derecho')
        .select('*');

      if (promediosError) throw promediosError;

      const lista = promedios ?? [];
      if (lista.length === 0) {
        setProfesoresUI([]);
        setTotalProfesores(0);
        return;
      }

      // 2) Contar ratings para determinar quiénes tienen >= 5
      const ids = lista.map(p => p.id_profesor);
      const { data: calificaciones, error: calificacionesError } = await supabase
        .from('calificaciones_derecho')
        .select('profesor_id')
        .in('profesor_id', ids);

      if (calificacionesError) {
        console.error('Error al obtener calificaciones derecho (ranked):', calificacionesError);
      }

      const conteoRatings = {};
      (calificaciones ?? []).forEach(c => {
        conteoRatings[c.profesor_id] = (conteoRatings[c.profesor_id] || 0) + 1;
      });

      // 3) Filtrar solo los que tienen >= 5 ratings (aptos para ranked)
      const aptosParaRanked = lista.filter(row => 
        (conteoRatings[row.id_profesor] || 0) >= 5
      );

      if (aptosParaRanked.length === 0) {
        setProfesoresUI([]);
        setTotalProfesores(0);
        return;
      }

      // 4) Ordenar por pos_ranked (NO por puntaje_ponderado)
      const ordenados = [...aptosParaRanked].sort((a, b) => {
        const posA = a.pos_ranked ?? 999999;
        const posB = b.pos_ranked ?? 999999;
        return sortOrder === 'asc' ? posB - posA : posA - posB; // asc = peor a mejor, desc = mejor a peor
      });

      // 5) Traer nombres de profesores_derecho
      const { data: profesores, error: profesoresError } = await supabase
        .from('profesores_derecho')
        .select('id, nombre_apellido');

      if (profesoresError) throw profesoresError;

      const profMap = new Map((profesores ?? []).map(p => [String(p.id), p]));

      // 6) Normalizar usando pos_ranked como posición
      const normalizados = ordenados.map(row => {
        const info = profMap.get(String(row.profesor_id));
        return {
          profesor_id: row.profesor_id,
          pos_ranking: row.pos_ranked, // usar pos_ranked
          prom_personalidad: row.prom_personalidad,
          prom_metodo_ensenanza: row.prom_metodo_ensenanza,
          prom_responsabilidad: row.prom_responsabilidad,
          puntaje_ponderado: row.puntaje_ponderado,
          total_ratings: conteoRatings[row.profesor_id] || 0,
          profesores: info
            ? { nombre_apellido: info.nombre_apellido, departamento: null }
            : { nombre_apellido: 'Profesor no encontrado', departamento: null },
        };
      });

      // 7) Filtro por búsqueda - primero en ranked, luego en todos si no hay match
      const q = (searchRanking ?? '').trim().toLowerCase();
      let filtrados;
      
      if (q === '') {
        filtrados = normalizados;
      } else {
        // Buscar primero en los ranked
        filtrados = normalizados.filter(p =>
          (p.profesores?.nombre_apellido ?? '').toLowerCase().includes(q)
        );

        // Si no hay coincidencias en ranked, buscar en todos los promedios
        if (filtrados.length === 0) {
          const todosLosPromedios = lista.filter(row =>
            profMap.has(String(row.id_profesor)) &&
            profMap.get(String(row.id_profesor)).nombre_apellido.toLowerCase().includes(q)
          );

          filtrados = todosLosPromedios.map(row => {
            const info = profMap.get(String(row.id_profesor));
            return {
              profesor_id: row.profesor_id,
              pos_ranking: null, // sin posición porque no está en ranked
              prom_personalidad: row.prom_personalidad,
              prom_metodo_ensenanza: row.prom_metodo_ensenanza,
              prom_responsabilidad: row.prom_responsabilidad,
              puntaje_ponderado: row.puntaje_ponderado,
              total_ratings: conteoRatings[row.id_profesor] || 0,
              profesores: info
                ? { nombre_apellido: info.nombre_apellido, departamento: null }
                : { nombre_apellido: 'Profesor no encontrado', departamento: null },
            };
          });
        }
      }

      setProfesoresUI(filtrados);
      setTotalProfesores(normalizados.length);
    } catch (error) {
      console.error('Error en modo "Los más calificados" (Derecho):', error);
      setProfesoresUI([]);
      setTotalProfesores(0);
    } finally {
      setIsLoading(false);
    }
  };

  // ====== Carga: modo "Todos" para COMERCIAL ======
  const loadComercialTodos = async () => {
    setIsLoading(true);
    try {
      // 1) Traer promedios de comercial
      const { data: promedios, error: promediosError } = await supabase
        .from('profesores_promedios_comercial')
        .select('*');

      if (promediosError) throw promediosError;

      const lista = promedios ?? [];
      if (lista.length === 0) {
        setProfesoresUI([]);
        setTotalProfesores(0);
        return;
      }

      // 2) Orden por pos_todos (NO por puntaje_ponderado)
      const ordenados = [...lista].sort((a, b) => {
        const posA = a.pos_todos ?? 999999;
        const posB = b.pos_todos ?? 999999;
        return sortOrder === 'asc' ? posB - posA : posA - posB; // asc = peor a mejor, desc = mejor a peor
      });

      // 3) Traer nombres de profesores_comercial
      const { data: profesores, error: profesoresError } = await supabase
        .from('profesores_comercial')
        .select('id, nombre_apellido');

      if (profesoresError) throw profesoresError;

      const profMap = new Map((profesores ?? []).map(p => [String(p.id), p]));

      // 4) Contar ratings de cada profesor en calificaciones_comercial
      const ids = lista.map(p => p.id_profesor);
      const { data: calificaciones, error: calificacionesError } = await supabase
        .from('calificaciones_comercial')
        .select('profesor_id')
        .in('profesor_id', ids);

      if (calificacionesError) {
        console.error('Error al obtener calificaciones comercial:', calificacionesError);
      }

      const conteoRatings = {};
      (calificaciones ?? []).forEach(c => {
        conteoRatings[c.profesor_id] = (conteoRatings[c.profesor_id] || 0) + 1;
      });

      // 5) Normalizar usando pos_todos como posición
      const normalizados = ordenados.map(row => {
        const info = profMap.get(String(row.id_profesor));
        return {
          profesor_id: row.id_profesor,
          pos_ranking: row.pos_todos, // usar pos_todos
          prom_personalidad: row.prom_personalidad,
          prom_metodo_ensenanza: row.prom_metodo_ensenanza,
          prom_responsabilidad: row.prom_responsabilidad,
          puntaje_ponderado: row.puntaje_ponderado,
          total_ratings: conteoRatings[row.id_profesor] || 0,
          profesores: info
            ? { nombre_apellido: info.nombre_apellido, departamento: null }
            : { nombre_apellido: 'Profesor no encontrado', departamento: null },
        };
      });

      // 6) Filtro por búsqueda
      const q = (searchRanking ?? '').trim().toLowerCase();
      const filtrados =
        q === ''
          ? normalizados
          : normalizados.filter(p =>
              (p.profesores?.nombre_apellido ?? '').toLowerCase().includes(q)
            );

      setProfesoresUI(filtrados);
      setTotalProfesores(normalizados.length);
    } catch (error) {
      console.error('Error en modo "Todos" (Comercial):', error);
      setProfesoresUI([]);
      setTotalProfesores(0);
    } finally {
      setIsLoading(false);
    }
  };

  // ====== Carga: modo "Los más calificados" para COMERCIAL ======
  const loadComercialRanked = async () => {
    setIsLoading(true);
    try {
      // 1) Traer todos los promedios de comercial
      const { data: promedios, error: promediosError } = await supabase
        .from('profesores_promedios_comercial')
        .select('*');

      if (promediosError) throw promediosError;

      const lista = promedios ?? [];
      if (lista.length === 0) {
        setProfesoresUI([]);
        setTotalProfesores(0);
        return;
      }

      // 2) Contar ratings para determinar quiénes tienen >= 5
      const ids = lista.map(p => p.id_profesor);
      const { data: calificaciones, error: calificacionesError } = await supabase
        .from('calificaciones_comercial')
        .select('profesor_id')
        .in('profesor_id', ids);

      if (calificacionesError) {
        console.error('Error al obtener calificaciones comercial (ranked):', calificacionesError);
      }

      const conteoRatings = {};
      (calificaciones ?? []).forEach(c => {
        conteoRatings[c.profesor_id] = (conteoRatings[c.profesor_id] || 0) + 1;
      });

      // 3) Filtrar solo los que tienen >= 5 ratings (aptos para ranked)
      const aptosParaRanked = lista.filter(row => 
        (conteoRatings[row.id_profesor] || 0) >= 5
      );

      if (aptosParaRanked.length === 0) {
        setProfesoresUI([]);
        setTotalProfesores(0);
        return;
      }

      // 4) Ordenar por pos_ranked (NO por puntaje_ponderado)
      const ordenados = [...aptosParaRanked].sort((a, b) => {
        const posA = a.pos_ranked ?? 999999;
        const posB = b.pos_ranked ?? 999999;
        return sortOrder === 'asc' ? posB - posA : posA - posB; // asc = peor a mejor, desc = mejor a peor
      });

      // 5) Traer nombres de profesores_comercial
      const { data: profesores, error: profesoresError } = await supabase
        .from('profesores_comercial')
        .select('id, nombre_apellido');

      if (profesoresError) throw profesoresError;

      const profMap = new Map((profesores ?? []).map(p => [String(p.id), p]));

      // 6) Normalizar usando pos_ranked como posición
      const normalizados = ordenados.map(row => {
        const info = profMap.get(String(row.id_profesor));
        return {
          profesor_id: row.id_profesor,
          pos_ranking: row.pos_ranked, // usar pos_ranked
          prom_personalidad: row.prom_personalidad,
          prom_metodo_ensenanza: row.prom_metodo_ensenanza,
          prom_responsabilidad: row.prom_responsabilidad,
          puntaje_ponderado: row.puntaje_ponderado,
          total_ratings: conteoRatings[row.id_profesor] || 0,
          profesores: info
            ? { nombre_apellido: info.nombre_apellido, departamento: null }
            : { nombre_apellido: 'Profesor no encontrado', departamento: null },
        };
      });

      // 7) Filtro por búsqueda - primero en ranked, luego en todos si no hay match
      const q = (searchRanking ?? '').trim().toLowerCase();
      let filtrados;
      
      if (q === '') {
        filtrados = normalizados;
      } else {
        // Buscar primero en los ranked
        filtrados = normalizados.filter(p =>
          (p.profesores?.nombre_apellido ?? '').toLowerCase().includes(q)
        );

        // Si no hay coincidencias en ranked, buscar en todos los promedios
        if (filtrados.length === 0) {
          const todosLosPromedios = lista.filter(row =>
            profMap.has(String(row.id_profesor)) &&
            profMap.get(String(row.id_profesor)).nombre_apellido.toLowerCase().includes(q)
          );

          filtrados = todosLosPromedios.map(row => {
            const info = profMap.get(String(row.id_profesor));
            return {
              profesor_id: row.id_profesor,
              pos_ranking: null, // sin posición porque no está en ranked
              prom_personalidad: row.prom_personalidad,
              prom_metodo_ensenanza: row.prom_metodo_ensenanza,
              prom_responsabilidad: row.prom_responsabilidad,
              puntaje_ponderado: row.puntaje_ponderado,
              total_ratings: conteoRatings[row.id_profesor] || 0,
              profesores: info
                ? { nombre_apellido: info.nombre_apellido, departamento: null }
                : { nombre_apellido: 'Profesor no encontrado', departamento: null },
            };
          });
        }
      }

      setProfesoresUI(filtrados);
      setTotalProfesores(normalizados.length);
    } catch (error) {
      console.error('Error en modo "Los más calificados" (Comercial):', error);
      setProfesoresUI([]);
      setTotalProfesores(0);
    } finally {
      setIsLoading(false);
    }
  };

  // ====== Carga: modo "Todos" para MEDICINA ======
  const loadMedicinaTodos = async () => {
    setIsLoading(true);
    try {
      // 1) Traer promedios de medicina
      const { data: promedios, error: promediosError } = await supabase
        .from('profesores_med_promedios')
        .select('*');

      if (promediosError) throw promediosError;

      const lista = promedios ?? [];
      if (lista.length === 0) {
        setProfesoresUI([]);
        setTotalProfesores(0);
        return;
      }

      // 2) Orden por pos_todos (NO por puntaje_ponderado)
      const ordenados = [...lista].sort((a, b) => {
        const posA = a.pos_todos ?? 999999;
        const posB = b.pos_todos ?? 999999;
        return sortOrder === 'asc' ? posB - posA : posA - posB; // asc = peor a mejor, desc = mejor a peor
      });

      // 3) Traer nombres de profesores_med
      const { data: profesores, error: profesoresError } = await supabase
        .from('profesores_med')
        .select('id, nombre_apellido');

      if (profesoresError) throw profesoresError;

      const profMap = new Map((profesores ?? []).map(p => [String(p.id), p]));

      // 4) Contar ratings de cada profesor en calificaciones_med
      const ids = lista.map(p => p.profesor_id);
      const { data: calificaciones, error: calificacionesError } = await supabase
        .from('calificaciones_med')
        .select('profesor_id')
        .in('profesor_id', ids);

      if (calificacionesError) {
        console.error('Error al obtener calificaciones medicina:', calificacionesError);
      }

      const conteoRatings = {};
      (calificaciones ?? []).forEach(c => {
        conteoRatings[c.profesor_id] = (conteoRatings[c.profesor_id] || 0) + 1;
      });

      // 5) Normalizar usando pos_todos como posición
      const normalizados = ordenados.map(row => {
        const info = profMap.get(String(row.profesor_id));
        return {
          profesor_id: row.profesor_id,
          pos_ranking: row.pos_todos, // usar pos_todos
          prom_personalidad: row.prom_personalidad,
          prom_metodo_ensenanza: row.prom_metodo,
          prom_responsabilidad: row.prom_responsabilidad,
          puntaje_ponderado: row.puntaje_ponderado,
          total_ratings: conteoRatings[row.profesor_id] || 0,
          profesores: info
            ? { nombre_apellido: info.nombre_apellido, departamento: null }
            : { nombre_apellido: 'Profesor no encontrado', departamento: null },
        };
      });

      // 6) Filtro por búsqueda
      const q = (searchRanking ?? '').trim().toLowerCase();
      const filtrados =
        q === ''
          ? normalizados
          : normalizados.filter(p =>
              (p.profesores?.nombre_apellido ?? '').toLowerCase().includes(q)
            );

      setProfesoresUI(filtrados);
      setTotalProfesores(normalizados.length);
    } catch (error) {
      console.error('Error en modo "Todos" (Medicina):', error);
      setProfesoresUI([]);
      setTotalProfesores(0);
    } finally {
      setIsLoading(false);
    }
  };

  // ====== Carga: modo "Los más calificados" para MEDICINA ======
  const loadMedicinaRanked = async () => {
    setIsLoading(true);
    try {
      // 1) Traer todos los promedios de medicina
      const { data: promedios, error: promediosError } = await supabase
        .from('profesores_med_promedios')
        .select('*');

      if (promediosError) throw promediosError;

      const lista = promedios ?? [];
      if (lista.length === 0) {
        setProfesoresUI([]);
        setTotalProfesores(0);
        return;
      }

      // 2) Contar ratings para determinar quiénes tienen >= 5
      const ids = lista.map(p => p.profesor_id);
      const { data: calificaciones, error: calificacionesError } = await supabase
        .from('calificaciones_med')
        .select('profesor_id')
        .in('profesor_id', ids);

      if (calificacionesError) {
        console.error('Error al obtener calificaciones medicina (ranked):', calificacionesError);
      }

      const conteoRatings = {};
      (calificaciones ?? []).forEach(c => {
        conteoRatings[c.profesor_id] = (conteoRatings[c.profesor_id] || 0) + 1;
      });

      // 3) Filtrar solo los que tienen >= 5 ratings (aptos para ranked)
      const aptosParaRanked = lista.filter(row => 
        (conteoRatings[row.profesor_id] || 0) >= 5
      );

      if (aptosParaRanked.length === 0) {
        setProfesoresUI([]);
        setTotalProfesores(0);
        return;
      }

      // 4) Ordenar por pos_ranked (NO por puntaje_ponderado)
      const ordenados = [...aptosParaRanked].sort((a, b) => {
        const posA = a.pos_ranked ?? 999999;
        const posB = b.pos_ranked ?? 999999;
        return sortOrder === 'asc' ? posB - posA : posA - posB; // asc = peor a mejor, desc = mejor a peor
      });

      // 5) Traer nombres de profesores_med
      const { data: profesores, error: profesoresError } = await supabase
        .from('profesores_med')
        .select('id, nombre_apellido');

      if (profesoresError) throw profesoresError;

      const profMap = new Map((profesores ?? []).map(p => [String(p.id), p]));

      // 6) Normalizar usando pos_ranked como posición
      const normalizados = ordenados.map(row => {
        const info = profMap.get(String(row.profesor_id));
        return {
          profesor_id: row.profesor_id,
          pos_ranking: row.pos_ranked, // usar pos_ranked
          prom_personalidad: row.prom_personalidad,
          prom_metodo_ensenanza: row.prom_metodo,
          prom_responsabilidad: row.prom_responsabilidad,
          puntaje_ponderado: row.puntaje_ponderado,
          total_ratings: conteoRatings[row.profesor_id] || 0,
          profesores: info
            ? { nombre_apellido: info.nombre_apellido, departamento: null }
            : { nombre_apellido: 'Profesor no encontrado', departamento: null },
        };
      });

      // 7) Filtro por búsqueda - primero en ranked, luego en todos si no hay match
      const q = (searchRanking ?? '').trim().toLowerCase();
      let filtrados;
      
      if (q === '') {
        filtrados = normalizados;
      } else {
        // Buscar primero en los ranked
        filtrados = normalizados.filter(p =>
          (p.profesores?.nombre_apellido ?? '').toLowerCase().includes(q)
        );

        // Si no hay coincidencias en ranked, buscar en todos los promedios
        if (filtrados.length === 0) {
          const todosLosPromedios = lista.filter(row =>
            profMap.has(String(row.profesor_id)) &&
            profMap.get(String(row.profesor_id)).nombre_apellido.toLowerCase().includes(q)
          );

          filtrados = todosLosPromedios.map(row => {
            const info = profMap.get(String(row.profesor_id));
            return {
              profesor_id: row.profesor_id,
              pos_ranking: null, // sin posición porque no está en ranked
              prom_personalidad: row.prom_personalidad,
              prom_metodo_ensenanza: row.prom_metodo,
              prom_responsabilidad: row.prom_responsabilidad,
              puntaje_ponderado: row.puntaje_ponderado,
              total_ratings: conteoRatings[row.profesor_id] || 0,
              profesores: info
                ? { nombre_apellido: info.nombre_apellido, departamento: null }
                : { nombre_apellido: 'Profesor no encontrado', departamento: null },
            };
          });
        }
      }

      setProfesoresUI(filtrados);
      setTotalProfesores(normalizados.length);
    } catch (error) {
      console.error('Error en modo "Los más calificados" (Medicina):', error);
      setProfesoresUI([]);
      setTotalProfesores(0);
    } finally {
      setIsLoading(false);
    }
  };

  // ====== Otros handlers ======
  const handleSortChange = (e) => {
    setSortOrder(e.target.checked ? 'asc' : 'desc');
  };

  const handleSignOut = async (e) => {
    e.preventDefault();
    try {
      await signOut();
      navigate('/signin');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  // ==== POPUP: guardar facultad ====
  const handleSaveFaculty = async () => {
    setFacultyError('');

    if (!facultyChoice) {
      setFacultyError('Por favor selecciona una opción.');
      return;
    }

    try {
      setSavingFaculty(true);

      const payload = {
        id: session.user.id,       // FK a auth.users.id
        facultad: facultyChoice,   // 'ingenieria' o 'derecho'
      };

      const { error } = await supabase
        .from('profiles')
        .upsert([payload], { onConflict: 'id' });

      if (error) {
        console.error('Error guardando facultad:', error);
        setFacultyError('No se pudo guardar. Intenta nuevamente.');
        return;
      }

      // Actualizar estado local
      setUserFacultad(facultyChoice);
      setShowFacultyModal(false);
    } catch (e) {
      console.error('Error general guardando facultad:', e);
      setFacultyError('Ocurrió un error. Intenta nuevamente.');
    } finally {
      setSavingFaculty(false);
    }
  };


  const handleSendRanking = () => {
    navigate('/search-ranking');
  };

  const handleLogoClick = () => {
    navigate('/dashboard');
  };

  const handleCommentClick = (profesorId) => {
    navigate('/prof-comments/' + profesorId);
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
            className='flex flex-col justify-center items-center w-10 h-10 space-y-1 focus:outline-none hover:bg-gray-700 rounded-md p-2 transition-colors duración-200'
          >
            <div className='w-6 h-1 bg-white rounded-full'></div>
            <div className='w-6 h-1 bg-white rounded-full'></div>
            <div className='w-6 h-1 bg-white rounded-full'></div>
          </button>
          {/* Overlay para cerrar menú al hacer clic fuera */}
          {isMenuOpen && (
            <>
              <div
                className='fixed inset-0 z-10'
                onClick={() => setIsMenuOpen(false)}
                style={{ touchAction: 'manipulation' }}
              />
              <div className='absolute right-0 mt-2 w-64 bg-gray-800 rounded-lg shadow-lg z-20 border border-gray-700'>
                <div className='p-4'>
                  {/* Saludo al usuario */}
                  <div className='mb-4 pb-4 border-b border-gray-600'>
                    <p className='text-sm text-gray-300 mb-1'>Bienvenido</p>
                    <p className='text-white font-medium text-sm break-all'>{session?.user?.email}</p>
                  </div>
                  {/* Opción cerrar sesión */}
                  <button 
                    onClick={handleSignOut}
                    className='w-full bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transición-colors duración-200 text-sm'
                  >
                    Cerrar sesión
                  </button>
                </div>
              </div>
            </>
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
              Enviar ranking
            </button>
          </div>
          <h2 className='text-2xl font-thin mb-4 mt-6'>Tabla de rankings</h2>

          {/* Filtros y badges */}
          <div className='flex items-center justify-center gap-4 mb-6'>
            {/* Icono de filtro */}
            <span className='text-gray-400 text-2xl'>
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2a1 1 0 01-.293.707l-6.414 6.414A1 1 0 0013 13.414V19a1 1 0 01-1.447.894l-4-2A1 1 0 017 17v-3.586a1 1 0 00-.293-.707L3.293 6.707A1 1 0 013 6V4z" />
              </svg>
            </span>
            {/* Badges */}
            <button
              onClick={() => setActiveFilter('top')}
              className={`px-3 py-1 rounded-full font-semibold text-sm shadow transition-colors duration-200 focus:outline-none ${
                activeFilter === 'top' ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-gray-700 text-white hover:bg-gray-800'
              }`}
            >
              Los más calificados
            </button>
            <button
              onClick={() => setActiveFilter('todos')}
              className={`px-3 py-1 rounded-full font-semibold text-sm shadow transition-colors duration-200 focus:outline-none ${
                activeFilter === 'todos' ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-gray-700 text-white hover:bg-gray-800'
              }`}
            >
              Todos
            </button>
          </div>

          {/* Switch Toggle Component */}
          <div className='flex justify-center mb-6'>
            <label htmlFor="filter" className="switch" aria-label="Toggle Filter">
              <input 
                type="checkbox" 
                id="filter" 
                checked={sortOrder === 'asc'}
                onChange={e => setSortOrder(e.target.checked ? 'asc' : 'desc')}
              />
              <span>De alto a bajo</span>
              <span>De bajo a alto</span>
            </label>
          </div>

          {/* Barra de búsqueda */}
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

        {/* Lista de profesores */}
        {userFacultad && userFacultad !== 'ingenieria' && userFacultad !== 'derecho' && userFacultad !== 'comercial' && userFacultad !== 'medicina' ? (
          <div className='text-center py-8'>
            <p className='text-gray-400 text-lg'>Los rankings están disponibles solo para estudiantes de la Escuela de ingeniería, derecho, Cs. Empresariales y medicina.</p>
          </div>
        ) : isLoading ? (
          <div className='text-center py-4'>
            <p className='text-gray-400'>Cargando rankings...</p>
          </div>
        ) : (
          <div ref={scrollContainerRef} className='w-full h-full flex-1 overflow-y-auto flex flex-col gap-6 scrollbar-hide px-4 py-6' style={{scrollSnapType: 'y mandatory', msOverflowStyle: 'none', scrollbarWidth: 'none'}}>
            {profesoresUI.length === 0 ? (
              // Mensaje cuando no hay profesores
              <div className='text-center py-8'>
                <div className='bg-gray-800 rounded-lg p-6 border border-gray-600 max-w-md mx-auto'>
                  <div className='mb-4'>
                    <svg className='w-16 h-16 text-gray-500 mx-auto mb-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                      <path strokeLinecap='round' strokeLinejoin='round' strokeWidth='2' d='M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z'></path>
                    </svg>
                    <h3 className='text-lg font-medium text-white mb-2'>
                      {activeFilter === 'top' 
                        ? `No hay profesores ${userFacultad === 'derecho' ? 'de Derecho' 
                                             : userFacultad === 'comercial' ? 'de Ciencias Empresariales'
                                             : userFacultad === 'medicina' ? 'de FAMED'
                                             : 'de Ingeniería'} con más de 5 calificaciones`
                        : `No hay profesores ${userFacultad === 'derecho' ? 'de Derecho' 
                                             : userFacultad === 'comercial' ? 'de Ciencias Empresariales'
                                             : userFacultad === 'medicina' ? 'de FAMED'
                                             : 'de Ingeniería'} disponibles`
                      }
                    </h3>
                    {activeFilter === 'top' ? (
                      <div className='space-y-3'>
                        <p className='text-gray-400 mb-4'>
                          Para aparecer en "Los más calificados", un profesor necesita al menos 5 calificaciones.
                        </p>
                        <div className='space-y-2'>
                          <button
                            onClick={() => setActiveFilter('todos')}
                            className='w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg transition-colors duration-200 font-medium'
                          >
                            Ver todos los profesores
                          </button>
                          <p className='text-gray-300 text-sm'>
                            O puedes calificar/agregar profesores en
                          </p>
                          <button
                            onClick={() => navigate('/search-ranking')}
                            className='w-full bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-lg transition-colors duration-200 font-medium'
                          >
                            Enviar ranking
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className='space-y-3'>
                        <p className='text-gray-400 mb-4'>
                          No hay profesores {userFacultad === 'derecho' ? 'de Derecho' 
                                           : userFacultad === 'comercial' ? 'de Ciencias Empresariales'
                                           : userFacultad === 'medicina' ? 'de salud'
                                           : 'de Ingeniería'} disponibles aún.
                        </p>
                        <button
                          onClick={() => navigate('/search-ranking')}
                          className='w-full bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-lg transition-colors duration-200 font-medium'
                        >
                          Agregar y calificar profesores
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              profesoresUI.map((profesor) => (
              <div 
                key={profesor.profesor_id} 
                className='bg-zinc-800 rounded-lg p-4 border border-zinc-600' style={{ scrollSnapAlign: 'start' }}
              >
                {/* Header con ranking y nombre */}
                <div className='flex items-center justify-between mb-3'>
                  <div className='flex items-center space-x-3'>
                    <div
                      className={
                        profesor.pos_ranking === 1
                        ? "w-10 h-10 rounded-full bg-gradient-to-r from-yellow-400 to-yellow-700 flex items-center justify-center"
                        : profesor.pos_ranking === 2
                        ? "w-10 h-10 rounded-full  bg-gradient-to-r from-gray-400 to-gray-700 flex items-center justify-center"
                        : profesor.pos_ranking === 3
                        ? "w-10 h-10 rounded-full  bg-gradient-to-r from-amber-600 to-yellow-900 flex items-center justify-center"
                        : profesor.pos_ranking === totalProfesores
                        ? "w-10 h-10 rounded-full  bg-gradient-to-r from-red-600 to-red-900 flex items-center justify-center"
                        : profesor.pos_ranking === totalProfesores - 1
                        ? "w-10 h-10 rounded-full  bg-gradient-to-r from-red-600 to-red-800 flex items-center justify-center"
                        : profesor.pos_ranking === totalProfesores - 2
                        ? "w-10 h-10 rounded-full  bg-gradient-to-r from-red-600 to-red-800 flex items-center justify-center" 
                        : "w-10 h-10 rounded-full  bg-gray-600 flex items-center justify-center"
                      }
                    >
                      {profesor.pos_ranking ?? '—'}
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
                <div className='grid grid-cols-3 gap-2 mb-3'>
                  <div className='text-center rounded-lg p-3'>
                    <div className='text-white font-semibold'>
                      {profesor.prom_personalidad?.toFixed(1) || 'N/A'}
                    </div>
                    <p className='text-gray-400 text-xs mt-1'>Personalidad</p>
                  </div>
                  <div className='text-center rounded-lg p-3'>
                    <div className='text-white font-semibold'>
                      {profesor.prom_metodo_ensenanza?.toFixed(1) || 'N/A'}
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

                {/* Botón de reseñas en la parte baja */}
                <div className='mt-4'>
                  <CustomButton onClick={() => handleCommentClick(profesor.profesor_id)}>
                    💬 Reseñas
                  </CustomButton>
                </div>
              </div>
              ))
            )}
          </div>
        )}
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
        ⚠️ Ingresa tu facultad correctamente. No podrás editarla más adelante.
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
          <span className="text-white">Ciencias empresariales</span>
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
          <span className="text-white">FAMED</span>
        </label>
      </div>

      {facultyError && (
        <p className="text-red-400 text-sm mt-3">{facultyError}</p>
      )}

      <div className="mt-5 flex justify-end gap-3">
          <button
            type="button"
            className="px-4 py-2 rounded-md  text-white disabled:opacity-60"
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

export default Dashboard
