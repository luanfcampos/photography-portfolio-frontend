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

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    try {
      console.log('🔄 Tentando fazer login...'); // Debug
      
      // Chamada para a API
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

      console.log('📡 Status da resposta:', response.status); // Debug
      console.log('📡 Headers:', response.headers.get('content-type')); // Debug

      // Verificar se a resposta é válida
      if (!response.ok) {
        // Se não for 2xx, tentar ler como texto primeiro
        const errorText = await response.text()
        console.error('❌ Erro da API:', errorText) // Debug
        
        // Tentar fazer parse do JSON se possível
        let errorData
        try {
          errorData = JSON.parse(errorText)
        } catch {
          // Se não for JSON válido, usar texto como erro
          setError(`Erro do servidor (${response.status}): ${errorText || 'Resposta inválida'}`)
          return
        }
        
        setError(errorData.error || `Erro ${response.status}`)
        return
      }

      // Tentar ler resposta como texto primeiro para debug
      const responseText = await response.text()
      console.log('📄 Resposta bruta:', responseText); // Debug

      // Verificar se não está vazio
      if (!responseText || responseText.trim() === '') {
        setError('Servidor retornou resposta vazia')
        return
      }

      // Tentar fazer parse do JSON
      let data
      try {
        data = JSON.parse(responseText)
      } catch (parseError) {
        console.error('❌ Erro ao fazer parse JSON:', parseError); // Debug
        console.error('📄 Conteúdo que falhou:', responseText); // Debug
        setError('Resposta do servidor não é um JSON válido')
        return
      }

      console.log('✅ Dados recebidos:', data); // Debug

      // Verificar se o login foi bem-sucedido
      if (data.success && data.token) {
        console.log('✅ Login bem-sucedido!'); // Debug
        
        // Salvar token
        localStorage.setItem('adminToken', data.token)
        
        // Salvar dados do usuário se existirem
        if (data.user) {
          localStorage.setItem('adminUser', JSON.stringify(data.user))
        }
        
        // Redirecionar
        navigate('/admin/dashboard')
      } else {
        setError(data.error || 'Erro desconhecido no login')
      }

    } catch (networkError) {
      console.error('❌ Erro de rede/conexão:', networkError); // Debug
      
      if (networkError.name === 'TypeError' && networkError.message.includes('fetch')) {
        setError('Erro de conexão. Verifique se o servidor está funcionando.')
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

            {/* Debug info em desenvolvimento */}
            {process.env.NODE_ENV === 'development' && (
              <div className="mt-6 p-3 bg-yellow-900/20 border border-yellow-500/30 rounded text-xs">
                <p className="text-yellow-300 font-mono">🐛 Debug Info:</p>
                <p className="text-yellow-200">URL: {window.location.origin}/api/auth/login</p>
                <p className="text-yellow-200">Check Network tab for request details</p>
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