//src/config/api.js
const isDevelopment = () => {
  // Para Vite (desenvolvimento)
  if (typeof import.meta !== 'undefined' && import.meta.env) {
    return import.meta.env.MODE === 'development' || import.meta.env.DEV
  }
 
  // Para outras situações
  return process.env.NODE_ENV === 'development'
}

const getApiUrl = () => {
  // URLs de produção fixas
  const PRODUCTION_API_URL = 'https://photography-api-e6oq.onrender.com'
  const DEVELOPMENT_API_URL = 'http://localhost:3001'
 
  // Se estiver em desenvolvimento, usar localhost
  if (isDevelopment()) {
    console.log('🔧 Modo desenvolvimento detectado - usando localhost')
    return DEVELOPMENT_API_URL
  }
 
  // Em produção, sempre usar a URL do Render
  console.log('🚀 Modo produção detectado - usando Render')
  return PRODUCTION_API_URL
}

// Configuração da API
export const API_CONFIG = {
  BASE_URL: getApiUrl(),
  ENDPOINTS: {
    PHOTOS: '/api/photos',
    WORKS: '/api/works',
    LOGIN: '/api/login'
  }
}

// Função helper para fazer requisições autenticadas
export const apiRequest = async (endpoint, options = {}) => {
  const token = localStorage.getItem('adminToken')
  const url = `${API_CONFIG.BASE_URL}${endpoint}`
 
  const defaultHeaders = {
    'Accept': 'application/json',
    'Content-Type': 'application/json'
  }
 
  if (token) {
    defaultHeaders['Authorization'] = `Bearer ${token}`
  }
 
  const config = {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options.headers
    }
  }
 
  // Para FormData, remover Content-Type para deixar o browser definir
  if (options.body instanceof FormData) {
    delete config.headers['Content-Type']
  }
 
  console.log(`🌐 Fazendo requisição para: ${url}`)
 
  try {
    const response = await fetch(url, config)
   
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({
        error: `HTTP ${response.status} - ${response.statusText}`
      }))
      throw new Error(errorData.error || `Erro HTTP ${response.status}`)
    }
   
    return response
  } catch (error) {
    console.error(`❌ Erro na requisição para ${url}:`, error)
    throw error
  }
}

export default API_CONFIG