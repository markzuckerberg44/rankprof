# Rankprof - React + Supabase Auth

Aplicación de autenticación con React, Vite, Tailwind CSS y Supabase.

## Configuración del Proyecto

### 1. Instalación
```bash
npm install
```

### 2. Configuración de Variables de Entorno
1. Copia el archivo `.env.example` y renómbralo a `.env`
2. Reemplaza los valores con tus credenciales reales de Supabase:
   ```
   VITE_SUPABASE_URL=tu_url_de_supabase
   VITE_SUPABASE_ANON_KEY=tu_clave_anonima_de_supabase
   ```

### 3. Ejecutar el Proyecto
```bash
npm run dev
```

## Tecnologías Utilizadas

- **React 19** - Framework de frontend
- **Vite** - Build tool y servidor de desarrollo
- **Tailwind CSS** - Framework de CSS
- **Supabase** - Backend como servicio (autenticación y base de datos)
- **React Router** - Enrutamiento

## Estructura del Proyecto

- `/src/components/` - Componentes de React
- `/src/context/` - Context providers (AuthContext)
- `/src/router.jsx` - Configuración de rutas
- `/.env` - Variables de entorno (NO incluido en git)

## Seguridad

⚠️ **IMPORTANTE**: Nunca subas el archivo `.env` a GitHub. Las llaves de API deben mantenerse privadas.
