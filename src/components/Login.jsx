import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button.jsx'
import { Input } from '@/components/ui/input.jsx'
import { Label } from '@/components/ui/label.jsx'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card.jsx'
import { Camera, Eye, EyeOff, Loader2 } from 'lucide-react'

function Login() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const navigate = useNavigate()

  // Função para fazer login na API
  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    try {
      // Chamada real para sua API
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username,
          password,
        }),
      })

      const data = await response.json()

      if (response.ok && data.success) {
        // Login bem-sucedido
        
        // Salvar token JWT no localStorage
        localStorage.setItem('adminToken', data.token)
        
        // Salvar dados do usuário (opcional)
        localStorage.setItem('adminUser', JSON.stringify(data.user))
        
        // Redirecionar para o painel
        navigate('/admin/dashboard')
      } else {
        // Erro de login - mostrar mensagem específica
        setError(data.error || 'Credenciais inválidas')
      }
    } catch (err) {
      console.error('Erro ao fazer login:', err)
      setError('Erro de conexão. Verifique se o servidor está funcionando.')
    } finally {
      setIsLoading(false)
    }
  }

  // Função para verificar se já está logado
  const checkExistingLogin = async () => {
    const token = localStorage.getItem('adminToken')
    if (token) {
      try {
        const response = await fetch('/api/auth/verify', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })
        
        if (response.ok) {
          // Token válido, redirecionar
          navigate('/admin/dashboard')
        } else {
          // Token inválido, remover
          localStorage.removeItem('adminToken')
          localStorage.removeItem('adminUser')
        }
      } catch (err) {
        // Erro na verificação, remover token
        localStorage.removeItem('adminToken')
        localStorage.removeItem('adminUser')
      }
    }
  }

  // Verificar login existente ao carregar o componente
  useState(() => {
    checkExistingLogin()
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Logo/Header */}
        <div className="text-center">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <Camera className="h-10 w-10 text-white" />
            <span className="text-2xl font-bold text-white">Admin Panel</span>
          </div>
          <h2 className="text-3xl font-bold text-white">
            Acesso Administrativo
          </h2>
          <p className="mt-2 text-sm text-gray-300">
            Faça login para gerenciar seu portfólio
          </p>
        </div>

        {/* Login Form */}
        <Card className="bg-gray-800/80 backdrop-blur-sm border-gray-700">
          <CardHeader>
            <CardTitle className="text-white">Login</CardTitle>
            <CardDescription className="text-gray-300">
              Entre com suas credenciais para acessar o painel
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="bg-red-900/50 border border-red-500 text-red-200 px-4 py-3 rounded animate-pulse">
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-red-400 rounded-full"></div>
                    <span>{error}</span>
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="username" className="text-white">Usuário</Label>
                <Input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Digite seu usuário"
                  className="bg-gray-700/50 border-gray-600 text-white placeholder-gray-400 focus:border-blue-500"
                  required
                  disabled={isLoading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-white">Senha</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Digite sua senha"
                    className="bg-gray-700/50 border-gray-600 text-white placeholder-gray-400 focus:border-blue-500 pr-12"
                    required
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                    disabled={isLoading}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold transition-all duration-200 transform hover:scale-[1.02]"
                disabled={isLoading}
              >
                {isLoading ? (
                  <div className="flex items-center space-x-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Entrando...</span>
                  </div>
                ) : (
                  'Entrar'
                )}
              </Button>
            </form>

            {/* Informações de desenvolvimento */}
            {process.env.NODE_ENV === 'development' && (
              <div className="mt-6 p-4 bg-blue-900/20 border border-blue-500/30 rounded">
                <p className="text-sm text-blue-300 font-medium mb-2">💡 Desenvolvimento:</p>
                <p className="text-xs text-blue-200">Verifique se o servidor backend está rodando</p>
                <p className="text-xs text-blue-200">URL da API: /api/auth/login</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Link para voltar ao portfólio */}
        <div className="text-center">
          <button
            onClick={() => navigate('/')}
            className="text-sm text-gray-400 hover:text-white transition-colors duration-200 flex items-center justify-center space-x-1"
            disabled={isLoading}
          >
            <span>←</span>
            <span>Voltar ao Portfólio</span>
          </button>
        </div>
      </div>
    </div>
  )
}

export default Login