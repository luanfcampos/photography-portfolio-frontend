import { useState } from 'react'
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
  const [debugInfo, setDebugInfo] = useState([])
  const [connectionStatus, setConnectionStatus] = useState('checking') // checking, online, offline
  const navigate = useNavigate()

  const addDebugInfo = (message) => {
    const timestamp = new Date().toLocaleTimeString()
    setDebugInfo(prev => [...prev, `${timestamp}: ${message}`])
    console.log(`[LOGIN DEBUG] ${message}`)
  }

  // ✅ URL da API corrigida para produção
  const getApiUrl = () => {
    if (process.env.NODE_ENV === 'production') {
      return 'https://photography-api-e6oq.onrender.com/api/auth/login'
    }
    
    // Para desenvolvimento local
    return process.env.REACT_APP_API_URL ? 
      `${process.env.REACT_APP_API_URL}/api/auth/login` : 
      'http://localhost:3001/api/auth/login'
  }

  // ✅ Testar conectividade com o servidor
  const testServerConnection = async () => {
    try {
      setConnectionStatus('checking')
      addDebugInfo('🔍 Testando conectividade...')
      const healthUrl = process.env.NODE_ENV === 'production' ? 
        'https://photography-api-e6oq.onrender.com/api/health' : 
        'http://localhost:3001/api/health'
      
      const response = await fetch(healthUrl, {
        method: 'GET',
        headers: { 'Accept': 'application/json' }
      })
      
      if (response.ok) {
        const data = await response.json()
        setConnectionStatus('online')
        addDebugInfo(`✅ Servidor online: ${data.message}`)
        addDebugInfo(`📊 Status: JWT=${data.jwt_configured}, DB=${data.database_configured}`)
        return true
      } else {
        setConnectionStatus('offline')
        addDebugInfo(`❌ Servidor retornou ${response.status}`)
        return false
      }
    } catch (error) {
      setConnectionStatus('offline')
      addDebugInfo(`❌ Erro de conectividade: ${error.message}`)
      return false
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')
    setDebugInfo([])

    try {
      const apiUrl = getApiUrl()
      
      addDebugInfo('🔄 === INÍCIO DO LOGIN ===')
      addDebugInfo(`🌍 Ambiente: ${process.env.NODE_ENV || 'development'}`)
      addDebugInfo(`📡 URL da API: ${apiUrl}`)
      addDebugInfo(`🌐 Origin: ${window.location.origin}`)
      addDebugInfo(`👤 Username: ${username}`)
      
      // ✅ Testar conectividade primeiro
      const serverOnline = await testServerConnection()
      if (!serverOnline) {
        setError('❌ Servidor offline ou inacessível. Tente novamente em alguns segundos.')
        return
      }

      addDebugInfo('📤 Enviando requisição de login...')
      
      // ✅ Configuração de fetch melhorada para produção
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Cache-Control': 'no-cache',
        },
        body: JSON.stringify({
          username: username.trim(),
          password: password,
        }),
        // ✅ Configurações importantes para Render
        credentials: 'same-origin',
        mode: 'cors'
      })

      addDebugInfo(`📊 Status da resposta: ${response.status} ${response.statusText}`)
      addDebugInfo(`📋 Content-Type: ${response.headers.get('content-type') || 'não definido'}`)
      
      // ✅ Verificações específicas para problemas do Render
      if (!response.ok) {
        const responseText = await response.text()
        addDebugInfo(`📄 Tamanho da resposta de erro: ${responseText.length} chars`)
        
        // Detectar páginas de erro HTML do Render
        if (responseText.includes('Application Error') || 
            responseText.includes('<!DOCTYPE html>') ||
            responseText.includes('Internal Server Error')) {
          setError('🚨 Servidor temporariamente indisponível. Aguarde alguns segundos e tente novamente.')
          addDebugInfo('❌ Detectado erro interno do servidor (HTML)')
          return
        }

        // Detectar erro 502/503/504 do Render (cold start ou sobrecarga)
        if (response.status === 502) {
          setError('🔄 Servidor iniciando... Aguarde 30 segundos e tente novamente.')
          addDebugInfo('❌ Erro 502 - Cold start do Render')
          return
        }

        if (response.status === 503) {
          setError('⚠️ Servidor temporariamente sobrecarregado. Tente novamente.')
          addDebugInfo('❌ Erro 503 - Servidor sobrecarregado')
          return
        }

        if (response.status === 504) {
          setError('⏰ Timeout do servidor. Tente novamente.')
          addDebugInfo('❌ Erro 504 - Gateway timeout')
          return
        }

        // Tentar parsear erro JSON
        try {
          const errorData = JSON.parse(responseText)
          const errorMessage = errorData.error || `Erro ${response.status}`
          setError(errorMessage)
          addDebugInfo(`❌ Erro da API: ${errorMessage}`)
        } catch (parseError) {
          setError(`❌ Erro ${response.status}: ${response.statusText}`)
          addDebugInfo(`❌ Resposta não é JSON válido`)
          addDebugInfo(`📄 Conteúdo: ${responseText.substring(0, 200)}${responseText.length > 200 ? '...' : ''}`)
        }
        return
      }

      // ✅ Processar resposta de sucesso
      const responseText = await response.text()
      addDebugInfo(`📄 Tamanho da resposta: ${responseText.length} chars`)
      
      if (!responseText.trim()) {
        setError('❌ Servidor retornou resposta vazia')
        addDebugInfo('❌ Resposta vazia do servidor')
        return
      }

      let data
      try {
        data = JSON.parse(responseText)
        addDebugInfo('✅ JSON parseado com sucesso')
      } catch (parseError) {
        setError('❌ Resposta do servidor não é um JSON válido')
        addDebugInfo(`❌ Erro no parse JSON: ${parseError.message}`)
        addDebugInfo(`📄 Conteúdo: ${responseText.substring(0, 200)}`)
        return
      }

      addDebugInfo(`📊 Dados recebidos: success=${data.success}, token=${!!data.token}`)

      if (data.success && data.token) {
        try {
          // ✅ Salvar dados de autenticação
          localStorage.setItem('adminToken', data.token)
          
          if (data.user) {
            localStorage.setItem('adminUser', JSON.stringify(data.user))
            addDebugInfo(`👤 Usuário salvo: ${data.user.username}`)
          }
          
          addDebugInfo('✅ LOGIN BEM-SUCEDIDO!')
          addDebugInfo('🔄 Redirecionando para dashboard...')
          
          // ✅ Redirecionamento com delay para mostrar sucesso
          setTimeout(() => {
            navigate('/admin/dashboard')
          }, 1000)
          
        } catch (storageError) {
          addDebugInfo(`❌ Erro ao salvar no localStorage: ${storageError.message}`)
          setError('❌ Erro ao salvar dados de autenticação')
        }
      } else {
        const errorMsg = data.error || 'Falha na autenticação'
        setError(errorMsg)
        addDebugInfo(`❌ Login negado: ${errorMsg}`)
      }

    } catch (networkError) {
      addDebugInfo(`❌ === ERRO DE REDE ===`)
      addDebugInfo(`❌ Tipo: ${networkError.name}`)
      addDebugInfo(`❌ Mensagem: ${networkError.message}`)
      
      if (networkError.message.includes('fetch')) {
        setError('❌ Erro de conexão. Servidor pode estar offline ou reinicializando.')
        addDebugInfo('❌ Erro de fetch - possível problema de rede ou CORS')
      } else if (networkError.name === 'AbortError') {
        setError('⏰ Requisição cancelada por timeout.')
        addDebugInfo('❌ Timeout na requisição')
      } else {
        setError(`❌ Erro inesperado: ${networkError.message}`)
        addDebugInfo(`❌ Erro não categorizado: ${networkError.name}`)
      }
    } finally {
      setIsLoading(false)
      addDebugInfo('🔄 === FIM DO LOGIN ===')
    }
  }

  // ✅ Limpar debug ao digitar
  const handleUsernameChange = (e) => {
    setUsername(e.target.value)
    if (error) {
      setError('')
      setDebugInfo([])
    }
  }

  const handlePasswordChange = (e) => {
    setPassword(e.target.value)
    if (error) {
      setError('')
      setDebugInfo([])
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
          
          {/* ✅ Status de conexão */}
          <div className="mt-2 flex items-center justify-center space-x-2 text-xs">
            <span className="text-gray-400">
              Env: {process.env.NODE_ENV || 'development'}
            </span>
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
                  onChange={handleUsernameChange}
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
                    onChange={handlePasswordChange}
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

              {/* ✅ Dicas para produção */}
              <div className="text-xs text-gray-400 space-y-1">
                <p>💡 <strong>Padrão:</strong> usuário: <code className="bg-gray-700 px-1 rounded">admin</code>, senha: <code className="bg-gray-700 px-1 rounded">admin123</code></p>
                {connectionStatus === 'offline' && (
                  <p className="text-yellow-400">⚠️ Se servidor estiver offline, aguarde ~30s (cold start do Render)</p>
                )}
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

              {/* ✅ Botão para testar conexão */}
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

            {/* Debug info - Visível em produção para diagnóstico */}
            {debugInfo.length > 0 && (
              <div className="mt-6">
                <details className="group">
                  <summary className="cursor-pointer text-blue-300 text-sm font-mono mb-2 flex items-center space-x-2">
                    <span>🔍 Log de Debug ({debugInfo.length} entradas)</span>
                    <span className="text-xs text-gray-400 group-open:hidden">clique para expandir</span>
                    <span className="text-xs text-gray-400 hidden group-open:inline">clique para ocultar</span>
                  </summary>
                  <div className="p-3 bg-blue-900/20 border border-blue-500/30 rounded text-xs max-h-60 overflow-y-auto">
                    {debugInfo.map((info, index) => (
                      <p key={index} className="text-blue-200 font-mono text-xs mb-1 break-all">
                        {info}
                      </p>
                    ))}
                  </div>
                </details>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Link para voltar */}
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