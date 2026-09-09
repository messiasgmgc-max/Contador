import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

const root = document.getElementById('root')!;
// Marca que o boot deu certo, para o aviso de falha do index.html não pintar
// por cima de um app que já está de pé.
root.setAttribute('data-booted', '1');

createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
