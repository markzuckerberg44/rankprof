import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { RouterProvider } from 'react-router-dom'
import { router } from './router.jsx'
import { AuthContextProvider } from './context/AuthContext.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <>
      <h1 className='text-center pt-4 text-3xl'>
        Ranking de Docentes UCN
      </h1>
      <AuthContextProvider>
        <RouterProvider router={router}></RouterProvider>
      </AuthContextProvider>
    </>
  </StrictMode>
  
)
