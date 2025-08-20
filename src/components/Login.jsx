import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button.jsx'
import { Input } from '@/components/ui/input.jsx'
import { Label } from '@/components/ui/label.jsx'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card.jsx'
import { Camera, Eye, EyeOff, Loader2, AlertCircle, CheckCircle } from 'lucide-react'

function Login() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [connectionStatus, setConnectionStatus] = useState('checking') // checking | online | offline
  const navigate = useNavigate()

  const isProd = (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.PROD) || process.env.NODE_ENV === 'production'

  const getApiUrl = () => {
    if (isProd) return 'https://photography-api-e6oq.onrender.com/api/auth/login'
    const base = import.meta?.env?.VITE_API_URL || process.env.REACT_APP_API_URL || 'http://localhost:3001'
    return `${base}/api/auth/login`
  }

  const getHealthUrl = () => {
    if (isProd) return 'https://photography-api-e6oq.onrender.com/api/health'
    const base = import.meta?.env?.VITE_API_URL || process.env.REACT_APP_API_URL || 'http://localhost:3001'
    return `${base}/api/health`
  }

  const testServerConnection = async () => {
    try {
      setConnectionStatus('checking')
      const response = await fetch(getHealthUrl(), { headers: { Accept: 'application/json' } })
      if (!response.ok) throw new Error('Server not ok')
      await response.json().catch(() => ({}))
      setConnectionStatus('online')
      return true
    } catch {
      setConnectionStatus('offline')
      return false
    }
  }

  useEffect(() => {
    testServerConnection()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    try {
      const serverOnline = await testServerConnection()
      if (!serverOnline) {
        setError('Servidor offline. Tente novamente em alguns segundos.')
        return
      }

      const response = await fetch(getApiUrl(), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          'Cache-Control': 'no-cache'
        },
        body: JSON.stringify({ username: username.trim(), password }),
        credentials: 'same-origin',
        mode: 'cors'
      })

      if (!response.ok) {
        const text = await response.text()
        try {
          const err = JSON.parse(text)
          setError(err.error || `Erro ${response.status}`)
        } catch {
          setError(`Erro ${response.status}: ${response.statusText || 'Falha na autenticação'}`)
        }
        return
      }

      const text = await response.text()
      if (!text.trim()) {
        setError('Resposta vazia do servidor')
        return
      }

      let data
      try {
        data = JSON.parse(text)
      } catch {
        setError('Resposta do servidor inválida')
        return
      }

      if (data?.success && data?.token) {
        localStorage.setItem('adminToken', data.token)
        if (data.user) localStorage.setItem('adminUser', JSON.stringify(data.user))
        navigate('/admin/dashboard')
      } else {
        setError(data?.error || 'Falha na autenticação')
      }
    } catch (err) {
      setError('Erro de conexão. Tente novamente.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <Camera className="h-10 w-10 text-white" />
            <span className="text-2xl font-bold text-white">Admin Panel</span>
          </div>
          <h2 className="text-3xl font-bold text-white">Acesso Administrativo</h2>
          <p className="mt-2 text-sm text-gray-300">Faça login para gerenciar seu portfólio</p>

          <div className="mt-2 flex items-center justify-center space-x-2 text-xs">
            <span className="text-gray-400">Env: {isProd ? 'production' : 'development'}</span>
            <span className="text-gray-500">|</span>
            <div className="flex items-center space-x-1">
              {connectionStatus === 'checking' && (
                <>
                  <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse"></div>
                  <span className="text-yellow-400">Verificando...</span>
                </>
              )}
              {connectionStatus === 'online' && (
                <>
                  <CheckCircle className="w-3 h-3 text-green-400" />
                  <span className="text-green-400">Online</span>
                </>
              )}
              {connectionStatus === 'offline' && (
                <>
                  <AlertCircle className="w-3 h-3 text-red-400" />
                  <span className="text-red-400">Offline</span>
                </>
              )}
            </div>
          </div>
        </div>

        <Card className="bg-gray-800/80 backdrop-blur-sm border-gray-700">
          <CardHeader>
            <CardTitle className="text-white">Login</CardTitle>
            <CardDescription className="text-gray-300">Entre com suas credenciais para acessar o painel</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="bg-red-900/50 border border-red-500 text-red-200 px-4 py-3 rounded">
                  <div className="flex items-center space-x-2">
                    <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
                    <span className="text-sm">{error}</span>
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="username" className="text-white">Usuário</Label>
                <Input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => { setUsername(e.target.value); if (error) setError('') }}
                  placeholder="Digite seu usuário"
                  className="bg-gray-700/50 border-gray-600 text-white placeholder-gray-400 focus:border-blue-500 focus:ring-blue-500"
                  required
                  disabled={isLoading}
                  autoComplete="username"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-white">Senha</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => { setPassword(e.target.value); if (error) setError('') }}
                    placeholder="Digite sua senha"
                    className="bg-gray-700/50 border-gray-600 text-white placeholder-gray-400 focus:border-blue-500 focus:ring-blue-500 pr-12"
                    required
                    disabled={isLoading}
                    autoComplete="current-password"
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
                className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 disabled:from-gray-600 disabled:to-gray-700 text-white font-semibold transition-all duration-200"
                disabled={isLoading || connectionStatus === 'offline'}
              >
                {isLoading ? (
                  <div className="flex items-center justify-center space-x-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Entrando...</span>
                  </div>
                ) : (
                  <div className="flex items-center justify-center space-x-2">
                    <span>Entrar</span>
                    {connectionStatus === 'online' && <CheckCircle className="w-4 h-4" />}
                  </div>
                )}
              </Button>

              {connectionStatus === 'offline' && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={testServerConnection}
                  className="w-full border-gray-600 text-gray-300 hover:bg-gray-700"
                  disabled={isLoading}
                >
                  🔄 Testar Conexão Novamente
                </Button>
              )}
            </form>
          </CardContent>
        </Card>

        <div className="text-center">
          <button
            onClick={() => navigate('/')}
            className="text-sm text-gray-400 hover:text-white transition-colors duration-200 flex items-center justify-center space-x-1"
            disabled={isLoading}
          >
            <span>← Voltar ao Portfólio</span>
          </button>
        </div>
      </div>
    </div>
  )
}

export default Login
