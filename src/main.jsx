import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { RouterProvider } from 'react-router-dom'
import { router } from './router.jsx'

createRoot(document.getElementById('root')).render(
  <>
  <h1 className='text-center pt-4 text-3xl'>React supabase Auth & Context</h1>
  <StrictMode>
    <RouterProvider router={router}></RouterProvider>
  </StrictMode>
  </>
)
