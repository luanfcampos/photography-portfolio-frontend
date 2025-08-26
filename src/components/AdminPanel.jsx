import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button.jsx'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card.jsx'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs.jsx'
import { Camera, LogOut, Home, Upload, BarChart3, Folder, Loader2 } from 'lucide-react'
import PhotoUpload from './PhotoUpload'
import WorkManager from './WorkManager'

function AdminPanel() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [refreshTrigger, setRefreshTrigger] = useState(0)
  const navigate = useNavigate()
 

  useEffect(() => {
    // Verificar se o usuário está autenticado
    const token = localStorage.getItem('adminToken')
    if (token) {
      setIsAuthenticated(true)
    } else {
      setIsAuthenticated(true)
    }
  }, [navigate])

  const handleLogout = () => {
    localStorage.removeItem('adminToken')
    navigate('/admin/login')
  }

  const handleUploadSuccess = () => {
    // Trigger refresh da lista de fotos e trabalhos
    setRefreshTrigger(prev => prev + 1)
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black flex items-center justify-center">
        <div className="flex items-center space-x-3 text-white">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="text-xl">Carregando...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black">
      {/* Header do Admin */}
      <header className="bg-gray-800/80 backdrop-blur-sm shadow-xl border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <Camera className="h-8 w-8 text-white" />
              <span className="text-xl font-bold text-white">Painel Administrativo</span>
            </div>
            
            <div className="flex items-center space-x-3">
              <Button
                variant="outline"
                onClick={() => navigate('/')}
                className="flex items-center space-x-2 border-gray-600 text-gray-300 hover:bg-gray-700 hover:text-white"
              >
                <Home className="h-4 w-4" />
                <span>Ver Portfólio</span>
              </Button>
              
              <Button
                variant="outline"
                onClick={handleLogout}
                className="flex items-center space-x-2 border-red-600 text-red-400 hover:bg-red-600 hover:text-white"
              >
                <LogOut className="h-4 w-4" />
                <span>Sair</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Conteúdo do Admin */}
      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <Dashboard 
          onUploadSuccess={handleUploadSuccess}
          refreshTrigger={refreshTrigger}
        />
      </main>
    </div>
  )
}

// Componente Dashboard atualizado
function Dashboard({ onUploadSuccess, refreshTrigger }) {
  const [stats, setStats] = useState({
    totalPhotos: 0,
    featuredPhotos: 0,
    categories: 0,
    totalWorks: 0,
    photosWithoutWork: 0
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Carregar estatísticas
    const loadStats = async () => {
      try {
        const isProd = import.meta.env.PROD || process.env.NODE_ENV === 'production'
        const API_URL = isProd 
          ? 'https://photography-api-e6oq.onrender.com' 
          : (import.meta.env.VITE_API_URL || 'http://localhost:3001')
        
        console.log('Carregando stats - ENV:', import.meta.env.MODE, 'URL:', API_URL)

        // Estatísticas de fotos
        const photosResponse = await fetch(`${API_URL}/api/photos`, {
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          }
        })
        let photosData = []
        if (photosResponse.ok) {
          photosData = await photosResponse.json()
        } else {
          console.error('Erro ao carregar fotos:', photosResponse.status)
        }

        // Estatísticas de trabalhos
        const worksResponse = await fetch(`${API_URL}/api/works`, {
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          }
        })
        let worksData = []
        if (worksResponse.ok) {
          worksData = await worksResponse.json()
        } else {
          console.error('Erro ao carregar works:', worksResponse.status)
        }

        const photosWithoutWork = photosData.filter(photo => !photo.work_id).length

        setStats({
          totalPhotos: photosData.length,
          featuredPhotos: photosData.filter(p => p.is_featured).length,
          categories: new Set(photosData.map(p => p.category_name).filter(Boolean)).size,
          totalWorks: worksData.length,
          photosWithoutWork: photosWithoutWork
        })
      } catch (error) {
        console.error('Erro ao carregar estatísticas:', error)
      } finally {
        setLoading(false)
      }
    }

    loadStats()
  }, [refreshTrigger])

  return (
    <div className="space-y-6">
      {/* Estatísticas Atualizadas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        <Card className="bg-gray-800/80 backdrop-blur-sm border-gray-700 hover:bg-gray-800/90 transition-colors">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-300">Total de Fotos</CardTitle>
            <Camera className="h-4 w-4 text-blue-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">
              {loading ? (
                <div className="animate-pulse bg-gray-600 h-8 w-12 rounded"></div>
              ) : (
                stats.totalPhotos
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-800/80 backdrop-blur-sm border-gray-700 hover:bg-gray-800/90 transition-colors">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-300">Trabalhos</CardTitle>
            <Folder className="h-4 w-4 text-green-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">
              {loading ? (
                <div className="animate-pulse bg-gray-600 h-8 w-12 rounded"></div>
              ) : (
                stats.totalWorks
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-800/80 backdrop-blur-sm border-gray-700 hover:bg-gray-800/90 transition-colors">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-300">Fotos em Destaque</CardTitle>
            <BarChart3 className="h-4 w-4 text-yellow-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">
              {loading ? (
                <div className="animate-pulse bg-gray-600 h-8 w-12 rounded"></div>
              ) : (
                stats.featuredPhotos
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-800/80 backdrop-blur-sm border-gray-700 hover:bg-gray-800/90 transition-colors">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-300">Sem Trabalho</CardTitle>
            <Camera className="h-4 w-4 text-orange-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">
              {loading ? (
                <div className="animate-pulse bg-gray-600 h-8 w-12 rounded"></div>
              ) : (
                stats.photosWithoutWork
              )}
            </div>
            <p className="text-xs text-gray-400 mt-1">fotos desorganizadas</p>
          </CardContent>
        </Card>

        <Card className="bg-gray-800/80 backdrop-blur-sm border-gray-700 hover:bg-gray-800/90 transition-colors">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-300">Categorias</CardTitle>
            <Folder className="h-4 w-4 text-purple-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">
              {loading ? (
                <div className="animate-pulse bg-gray-600 h-8 w-12 rounded"></div>
              ) : (
                stats.categories
              )}
            </div>
            <p className="text-xs text-gray-400 mt-1">categorias ativas</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs Simplificadas */}
      <Tabs defaultValue="upload" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 bg-gray-800/80 border-gray-700">
          <TabsTrigger 
            value="upload" 
            className="flex items-center space-x-2 text-gray-300 data-[state=active]:bg-blue-600 data-[state=active]:text-white"
          >
            <Upload className="h-4 w-4" />
            <span>Upload de Fotos</span>
          </TabsTrigger>
          <TabsTrigger 
            value="manage" 
            className="flex items-center space-x-2 text-gray-300 data-[state=active]:bg-blue-600 data-[state=active]:text-white"
          >
            <Folder className="h-4 w-4" />
            <span>Trabalhos e Fotos</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="upload">
          <div className="space-y-4">
            <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <Upload className="h-5 w-5 text-blue-400 mt-0.5 flex-shrink-0" />
                <div>
                  <h3 className="text-blue-200 font-medium mb-1">Dica de Upload Múltiplo</h3>
                  <p className="text-blue-200/80 text-sm">
                    Agora você pode selecionar múltiplas fotos de uma vez! Use as configurações globais 
                    para aplicar categoria e trabalho a todas as fotos, depois personalize individualmente 
                    se necessário.
                  </p>
                </div>
              </div>
            </div>
            <PhotoUpload onUploadSuccess={onUploadSuccess} />
          </div>
        </TabsContent>

        <TabsContent value="manage">
          <div className="space-y-4">
            <div className="bg-green-900/20 border border-green-500/30 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <Folder className="h-5 w-5 text-green-400 mt-0.5 flex-shrink-0" />
                <div>
                  <h3 className="text-green-200 font-medium mb-1">Gerenciamento</h3>
                  <p className="text-green-200/80 text-sm">
                    Visualize seus trabalhos com suas respectivas fotos. Expanda qualquer trabalho 
                    para ver e gerenciar suas fotos diretamente. Fotos sem trabalho aparecem em 
                    seção separada para organização.
                  </p>
                </div>
              </div>
            </div>
            <WorkManager refreshTrigger={refreshTrigger} />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default AdminPanel