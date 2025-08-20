// hooks/useAuth.js
import { useState, useEffect, createContext, useContext } from 'react'
import { useNavigate } from 'react-router-dom'

// Context para compartilhar estado de autenticação
const AuthContext = createContext({})

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [token, setToken] = useState(localStorage.getItem('adminToken'))
  const [isLoading, setIsLoading] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  // Verificar token ao carregar a aplicação
  useEffect(() => {
    checkAuthStatus()
  }, [])

  const checkAuthStatus = async () => {
    const storedToken = localStorage.getItem('adminToken')
    const storedUser = localStorage.getItem('adminUser')

    if (!storedToken) {
      setIsLoading(false)
      return
    }

    try {
      const response = await fetch('/api/auth/verify', {
        headers: {
          'Authorization': `Bearer ${storedToken}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setUser(data.user)
        setToken(storedToken)
        setIsAuthenticated(true)
      } else {
        // Token inválido
        logout()
      }
    } catch (error) {
      console.error('Erro ao verificar autenticação:', error)
      logout()
    } finally {
      setIsLoading(false)
    }
  }

  const login = async (username, password) => {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      })

      const data = await response.json()

      if (response.ok && data.success) {
        // Salvar no localStorage
        localStorage.setItem('adminToken', data.token)
        localStorage.setItem('adminUser', JSON.stringify(data.user))
        
        // Atualizar estado
        setToken(data.token)
        setUser(data.user)
        setIsAuthenticated(true)
        
        return { success: true, user: data.user }
      } else {
        return { success: false, error: data.error || 'Erro ao fazer login' }
      }
    } catch (error) {
      console.error('Erro na requisição de login:', error)
      return { success: false, error: 'Erro de conexão com o servidor' }
    }
  }

  const logout = () => {
    localStorage.removeItem('adminToken')
    localStorage.removeItem('adminUser')
    setToken(null)
    setUser(null)
    setIsAuthenticated(false)
  }

  const updateProfile = async (userData) => {
    if (!token) return { success: false, error: 'Não autenticado' }

    try {
      const response = await fetch('/api/auth/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(userData),
      })

      const data = await response.json()

      if (response.ok && data.success) {
        const updatedUser = { ...user, ...data.user }
        setUser(updatedUser)
        localStorage.setItem('adminUser', JSON.stringify(updatedUser))
        return { success: true, user: updatedUser }
      } else {
        return { success: false, error: data.error || 'Erro ao atualizar perfil' }
      }
    } catch (error) {
      return { success: false, error: 'Erro de conexão' }
    }
  }

  const changePassword = async (currentPassword, newPassword) => {
    if (!token) return { success: false, error: 'Não autenticado' }

    try {
      const response = await fetch('/api/auth/change-password', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ currentPassword, newPassword }),
      })

      const data = await response.json()
      return { success: response.ok && data.success, error: data.error }
    } catch (error) {
      return { success: false, error: 'Erro de conexão' }
    }
  }

  const value = {
    user,
    token,
    isAuthenticated,
    isLoading,
    login,
    logout,
    updateProfile,
    changePassword,
    checkAuthStatus
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

// Hook personalizado para usar o contexto de autenticação
export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider')
  }
  return context
}

// Componente para proteger rotas
export const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      navigate('/admin/login')
    }
  }, [isAuthenticated, isLoading, navigate])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white text-center">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p>Verificando autenticação...</p>
        </div>
      </div>
    )
  }

  return isAuthenticated ? children : null
}

export default useAuth