import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './global.css';
import { RouterProvider } from 'react-router-dom'
import {router} from './routes'
import { ThemeProvider } from './contexts/ThemeContext'



createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider>
      <RouterProvider router={router} />
    </ThemeProvider>
  </StrictMode>,
)
