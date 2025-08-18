import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import './index.css'
import App from './App.jsx'

// Importar os componentes principais
import Login from './components/ui/Login.jsx'
import AdminPanel from './components/ui/AdminPanel.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        {/* Site público */}
        <Route path="/" element={<App />} />

        {/* Rotas do admin */}
        <Route path="/admin" element={<Login />} />
        <Route path="/admin/panel" element={<AdminPanel />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>
)
