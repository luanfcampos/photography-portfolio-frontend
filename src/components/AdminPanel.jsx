import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button.jsx'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card.jsx'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs.jsx'
import { Camera, LogOut, Home, Upload, Image, BarChart3, Folder, Loader2 } from 'lucide-react'
import PhotoUpload from './PhotoUpload'
import PhotoManager from './PhotoManager'
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
      navigate('/admin/login')
    }
  }, [navigate])

  const handleLogout = () => {
    localStorage.removeItem('adminToken')
    navigate('/admin/login')
  }

  const handleUploadSuccess = () => {
    // Trigger refresh da lista de fotos
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
    totalWorks: 0
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Carregar estatísticas
    const loadStats = async () => {
      try {
        // Estatísticas de fotos
        const photosResponse = await fetch(`${import.meta.env.VITE_API_URL}/api/photos`)
        let photosData = []
        if (photosResponse.ok) {
          photosData = await photosResponse.json()
        }

        // Estatísticas de trabalhos
        const worksResponse = await fetch(`${import.meta.env.VITE_API_URL}/api/works`)
        let worksData = []
        if (worksResponse.ok) {
          worksData = await worksResponse.json()
        }

        setStats({
          totalPhotos: photosData.length,
          featuredPhotos: photosData.filter(p => p.is_featured).length,
          categories: new Set(photosData.map(p => p.category_name).filter(Boolean)).size,
          totalWorks: worksData.length
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
      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="bg-gray-800/80 backdrop-blur-sm border-gray-700 hover:bg-gray-800/90 transition-colors">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-300">Total de Fotos</CardTitle>
            <Image className="h-4 w-4 text-blue-400" />
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
            <CardTitle className="text-sm font-medium text-gray-300">Categorias</CardTitle>
            <Camera className="h-4 w-4 text-purple-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">
              {loading ? (
                <div className="animate-pulse bg-gray-600 h-8 w-12 rounded"></div>
              ) : (
                stats.categories
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs principais */}
      <Tabs defaultValue="upload" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3 bg-gray-800/80 border-gray-700">
          <TabsTrigger 
            value="upload" 
            className="flex items-center space-x-2 text-gray-300 data-[state=active]:bg-blue-600 data-[state=active]:text-white"
          >
            <Upload className="h-4 w-4" />
            <span>Upload de Fotos</span>
          </TabsTrigger>
          <TabsTrigger 
            value="works" 
            className="flex items-center space-x-2 text-gray-300 data-[state=active]:bg-blue-600 data-[state=active]:text-white"
          >
            <Folder className="h-4 w-4" />
            <span>Trabalhos</span>
          </TabsTrigger>
          <TabsTrigger 
            value="manage" 
            className="flex items-center space-x-2 text-gray-300 data-[state=active]:bg-blue-600 data-[state=active]:text-white"
          >
            <Image className="h-4 w-4" />
            <span>Gerenciar Fotos</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="upload">
          <PhotoUpload onUploadSuccess={onUploadSuccess} />
        </TabsContent>

        <TabsContent value="works">
          <WorkManager refreshTrigger={refreshTrigger} />
        </TabsContent>

        <TabsContent value="manage">
          <PhotoManager refreshTrigger={refreshTrigger} />
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default AdminPanel