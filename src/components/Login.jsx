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
  const [debugInfo, setDebugInfo] = useState([])
  const navigate = useNavigate()

  const addDebugInfo = (message) => {
    setDebugInfo(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`])
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')
    setDebugInfo([]) // Limpar debug anterior

    try {
      addDebugInfo('🔄 Iniciando tentativa de login')
      addDebugInfo(`📡 URL: ${window.location.origin}/api/auth/login`)
      
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: username.trim(),
          password: password,
        }),
      })

      addDebugInfo(`📡 Status: ${response.status} ${response.statusText}`)
      addDebugInfo(`📡 Content-Type: ${response.headers.get('content-type') || 'null'}`)
      addDebugInfo(`📡 Content-Length: ${response.headers.get('content-length') || 'null'}`)

      if (!response.ok) {
        addDebugInfo(`❌ Resposta não OK (${response.status})`)
        
        let errorMessage = 'Erro desconhecido'
        const responseText = await response.text()
        addDebugInfo(`📄 Texto da resposta de erro: "${responseText}"`)
        
        try {
          const errorData = JSON.parse(responseText)
          errorMessage = errorData.error || `Erro ${response.status}`
        } catch (parseError) {
          addDebugInfo(`❌ Erro não é JSON: ${parseError.message}`)
          errorMessage = `Erro ${response.status}: ${response.statusText}`
        }
        
        setError(errorMessage)
        return
      }

      // Para resposta 200, vamos primeiro ler como texto para ver o que tem
      const responseText = await response.text()
      addDebugInfo(`📄 Resposta bruta (${responseText.length} chars): "${responseText.substring(0, 100)}${responseText.length > 100 ? '...' : ''}"`)
      
      if (!responseText || responseText.trim() === '') {
        addDebugInfo('❌ Resposta está vazia!')
        setError('Servidor retornou resposta vazia (possível erro interno)')
        return
      }

      // Tentar fazer parse do JSON
      let data
      try {
        data = JSON.parse(responseText)
        addDebugInfo('✅ JSON parse bem-sucedido')
      } catch (parseError) {
        addDebugInfo(`❌ Erro no JSON parse: ${parseError.message}`)
        addDebugInfo(`📄 Conteúdo que falhou: "${responseText}"`)
        
        // Se começar com HTML, provavelmente é uma página de erro
        if (responseText.trim().toLowerCase().startsWith('<')) {
          setError('Servidor retornou HTML ao invés de JSON (possível erro 500 não capturado)')
        } else {
          setError('Resposta do servidor não é um JSON válido')
        }
        return
      }

      addDebugInfo(`✅ Dados recebidos: ${JSON.stringify(data)}`)

      if (data.success && data.token) {
        addDebugInfo('✅ Login bem-sucedido!')
        
        localStorage.setItem('adminToken', data.token)
        
        if (data.user) {
          localStorage.setItem('adminUser', JSON.stringify(data.user))
        }
        
        navigate('/admin/dashboard')
      } else {
        addDebugInfo('❌ Login não bem-sucedido')
        setError(data.error || 'Falha na autenticação')
      }

    } catch (networkError) {
      addDebugInfo(`❌ Erro de rede: ${networkError.message}`)
      
      if (networkError.name === 'TypeError' && networkError.message.includes('fetch')) {
        setError('Erro de conexão. Servidor pode estar offline.')
      } else {
        setError('Erro inesperado: ' + networkError.message)
      }
    } finally {
      setIsLoading(false)
    }
  }

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
                <div className="bg-red-900/50 border border-red-500 text-red-200 px-4 py-3 rounded">
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-red-400 rounded-full"></div>
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
                className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold transition-all duration-200"
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

            {/* Debug info - SEMPRE VISÍVEL para diagnóstico em produção */}
            {debugInfo.length > 0 && (
              <div className="mt-6 p-3 bg-blue-900/20 border border-blue-500/30 rounded text-xs max-h-60 overflow-y-auto">
                <p className="text-blue-300 font-mono mb-2">🔍 Debug Log:</p>
                {debugInfo.map((info, index) => (
                  <p key={index} className="text-blue-200 font-mono text-xs mb-1">{info}</p>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Link para voltar */}
        <div className="text-center">
          <button
            onClick={() => navigate('/')}
            className="text-sm text-gray-400 hover:text-white transition-colors duration-200"
            disabled={isLoading}
          >
            ← Voltar ao Portfólio
          </button>
        </div>
      </div>
    </div>
  )
}

export default Login