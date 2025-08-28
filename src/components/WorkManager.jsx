import { API_CONFIG, apiRequest } from '../config/api'
import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Folder, 
  Edit, 
  Trash2, 
  Star, 
  Eye, 
  Plus, 
  Image, 
  Loader2, 
  ChevronDown, 
  ChevronRight,
  LayoutGrid,
  List,
  AlertTriangle,
  RefreshCw
} from 'lucide-react'

function WorkManager({ refreshTrigger }) {
  const [works, setWorks] = useState([])
  const [photos, setPhotos] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [expandedWorks, setExpandedWorks] = useState(new Set())
  const [viewMode, setViewMode] = useState('list')
  const [deletingWork, setDeletingWork] = useState(null)
  const [categories, setCategories] = useState([])

  const loadCategories = async () => {
    try {
      setError(null)
      const response = await apiRequest(API_CONFIG.ENDPOINTS.CATEGORIES)
      if (response.ok) {
        const categoriesData = await response.json()
        setCategories(categoriesData)
      } else {
        throw new Error(`Erro ${response.status}: ${response.statusText}`)
      }
    } catch (error) {
      console.error('Erro ao carregar categorias:', error)
      setError('Erro ao carregar categorias: ' + error.message)
      // Fallback para categorias padrão se não conseguir carregar
      setCategories([
        { id: 1, name: 'Ensaios' },
        { id: 2, name: 'Shows e Espetáculos' },
        { id: 3, name: 'Eventos' }
      ])
    }
  }

  const loadWorks = async () => {
    try {
      setError(null)
      const response = await apiRequest(API_CONFIG.ENDPOINTS.WORKS)
      if (response.ok) {
        const worksData = await response.json()
        setWorks(worksData)
      } else {
        throw new Error(`Erro ${response.status}: ${response.statusText}`)
      }
    } catch (error) {
      console.error('Erro ao carregar trabalhos:', error)
      setError('Erro ao carregar trabalhos: ' + error.message)
    }
  }

  const loadPhotos = async () => {
    try {
      const response = await apiRequest(API_CONFIG.ENDPOINTS.PHOTOS)
      if (response.ok) {
        const photosData = await response.json()
        setPhotos(photosData)
      } else {
        throw new Error(`Erro ${response.status}: ${response.statusText}`)
      }
    } catch (error) {
      console.error('Erro ao carregar fotos:', error)
      setError('Erro ao carregar fotos: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const refreshData = async () => {
    setLoading(true)
    await Promise.all([loadCategories(), loadWorks(), loadPhotos()])
  }

  useEffect(() => {
    refreshData()
  }, [refreshTrigger])

  const handleCreateWork = async (workData) => {
    try {
      setError(null)
      const response = await apiRequest(API_CONFIG.ENDPOINTS.WORKS, {
        method: 'POST',
        body: JSON.stringify(workData)
      })

      if (response.ok) {
        await loadWorks()
      } else {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(`Erro ${response.status}: ${errorData.message || response.statusText}`)
      }
    } catch (error) {
      console.error('Erro ao criar trabalho:', error)
      setError('Erro ao criar trabalho: ' + error.message)
    }
  }

  const handleDeleteWork = async (workId) => {
    // Verificar se o trabalho existe na lista atual
    const workExists = works.find(work => work.id === workId)
    if (!workExists) {
      setError('Trabalho não encontrado na lista atual. Atualizando dados...')
      await refreshData()
      return
    }

    const workTitle = workExists.title
    const photosCount = getPhotosForWork(workId).length

    if (!confirm(`Tem certeza que deseja deletar o trabalho "${workTitle}"? ${photosCount > 0 ? `As ${photosCount} fotos serão mantidas mas ficarão sem trabalho associado.` : ''}`)) {
      return
    }

    setDeletingWork(workId)
    setError(null)

    try {
      const response = await apiRequest(`${API_CONFIG.ENDPOINTS.WORKS}/${workId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        // Remover trabalho da lista local
        setWorks(prevWorks => prevWorks.filter(work => work.id !== workId))
        // Recarregar fotos para atualizar work_id
        await loadPhotos()
      } else if (response.status === 404) {
        // Trabalho não encontrado no servidor
        setError(`O trabalho "${workTitle}" não foi encontrado no servidor. Pode ter sido deletado por outro usuário.`)
        // Remover da lista local já que não existe no servidor
        setWorks(prevWorks => prevWorks.filter(work => work.id !== workId))
        await loadPhotos()
      } else {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(`Erro ${response.status}: ${errorData.message || response.statusText}`)
      }
    } catch (error) {
      console.error('❌ Erro na requisição para ' + `${API_CONFIG.ENDPOINTS.WORKS}/${workId}:`, error)
      
      if (error.message.includes('404')) {
        setError(`O trabalho "${workTitle}" não foi encontrado no servidor. Pode ter sido deletado anteriormente.`)
        // Remover da lista local
        setWorks(prevWorks => prevWorks.filter(work => work.id !== workId))
        await loadPhotos()
      } else if (error.message.includes('Network')) {
        setError('Erro de conexão. Verifique sua internet e tente novamente.')
      } else {
        setError('Erro ao deletar trabalho: ' + error.message)
      }
    } finally {
      setDeletingWork(null)
    }
  }

  const handleUpdatePhoto = async (photoData) => {
    try {
      setError(null)
      const response = await apiRequest(`${API_CONFIG.ENDPOINTS.PHOTOS}/${photoData.id}`, {
        method: 'PUT',
        body: JSON.stringify(photoData)
      })

      if (response.ok) {
        setPhotos(prevPhotos => prevPhotos.map(photo => 
          photo.id === photoData.id ? { ...photo, ...photoData } : photo
        ))
      } else {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(`Erro ${response.status}: ${errorData.message || response.statusText}`)
      }
    } catch (error) {
      console.error('Erro ao atualizar foto:', error)
      setError('Erro ao atualizar foto: ' + error.message)
    }
  }

  const handleDeletePhoto = async (photoId) => {
    if (!confirm('Tem certeza que deseja deletar esta foto?')) return

    try {
      setError(null)
      const response = await apiRequest(`${API_CONFIG.ENDPOINTS.PHOTOS}/${photoId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        setPhotos(prevPhotos => prevPhotos.filter(photo => photo.id !== photoId))
      } else if (response.status === 404) {
        setError('Foto não encontrada no servidor. Pode ter sido deletada anteriormente.')
        setPhotos(prevPhotos => prevPhotos.filter(photo => photo.id !== photoId))
      } else {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(`Erro ${response.status}: ${errorData.message || response.statusText}`)
      }
    } catch (error) {
      console.error('Erro ao deletar foto:', error)
      if (error.message.includes('404')) {
        setError('Foto não encontrada. Pode ter sido deletada anteriormente.')
        setPhotos(prevPhotos => prevPhotos.filter(photo => photo.id !== photoId))
      } else {
        setError('Erro ao deletar foto: ' + error.message)
      }
    }
  }

  const getPhotosWithoutWork = () => {
    return photos.filter(photo => !photo.work_id)
  }

  const getPhotosForWork = (workId) => {
    return photos.filter(photo => photo.work_id === workId)
  }

  const toggleWorkExpansion = (workId) => {
    const newExpanded = new Set(expandedWorks)
    if (newExpanded.has(workId)) {
      newExpanded.delete(workId)
    } else {
      newExpanded.add(workId)
    }
    setExpandedWorks(newExpanded)
  }

  if (loading) {
    return (
      <div className="min-h-screen p-6">
        <Card className="w-full bg-gray-800/80 backdrop-blur-sm border-gray-700">
          <CardContent className="p-6">
            <div className="flex items-center justify-center space-x-3 text-white">
              <Loader2 className="h-5 w-5 animate-spin" />
              <span>Carregando trabalhos...</span>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Exibir erros */}
      {error && (
        <Alert className="bg-red-900/50 border-red-600 text-red-100">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription className="flex items-center justify-between">
            <span>{error}</span>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setError(null)}
              className="ml-4 h-6 px-2 border-red-500 text-red-300 hover:bg-red-600"
            >
              Fechar
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Criar Novo Trabalho */}
      <Card className="w-full bg-gray-800/80 backdrop-blur-sm border-gray-700">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 text-white">
            <Plus className="h-5 w-5" />
            <span>Criar Novo Trabalho</span>
          </CardTitle>
          <CardDescription className="text-gray-300">
            Agrupe suas fotos em trabalhos temáticos
          </CardDescription>
        </CardHeader>
        <CardContent>
          <CreateWorkForm categories={categories} onSubmit={handleCreateWork} />
        </CardContent>
      </Card>

      {/* Controles de Visualização */}
      <Card className="w-full bg-gray-800/80 backdrop-blur-sm border-gray-700">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center space-x-2 text-white">
                <Folder className="h-5 w-5" />
                <span>Gerenciar Trabalhos e Fotos ({works.length} trabalhos)</span>
              </CardTitle>
              <CardDescription className="text-gray-300">
                Visualize e organize seus trabalhos com suas respectivas fotos
              </CardDescription>
            </div>
            
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={refreshData}
                disabled={loading}
                className="border-gray-600 text-gray-300 hover:bg-gray-700"
              >
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setViewMode(viewMode === 'list' ? 'grid' : 'list')}
                className="border-gray-600 text-gray-300 hover:bg-gray-700"
              >
                {viewMode === 'list' ? <LayoutGrid className="h-4 w-4" /> : <List className="h-4 w-4" />}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setExpandedWorks(new Set(works.map(w => w.id)))}
                className="border-gray-600 text-gray-300 hover:bg-gray-700"
              >
                Expandir Todos
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setExpandedWorks(new Set())}
                className="border-gray-600 text-gray-300 hover:bg-gray-700"
              >
                Recolher Todos
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {works.length === 0 ? (
            <div className="text-center py-12">
              <Folder className="h-16 w-16 mx-auto mb-4 text-gray-500" />
              <p className="text-gray-400 text-lg mb-2">Nenhum trabalho encontrado</p>
              <p className="text-gray-500 text-sm">Crie seu primeiro trabalho para começar</p>
            </div>
          ) : (
            <div className="space-y-4">
              {works.map((work) => (
                <WorkWithPhotos
                  key={work.id}
                  work={work}
                  photos={getPhotosForWork(work.id)}
                  categories={categories}
                  works={works}
                  expanded={expandedWorks.has(work.id)}
                  onToggleExpansion={() => toggleWorkExpansion(work.id)}
                  onDeleteWork={handleDeleteWork}
                  onUpdatePhoto={handleUpdatePhoto}
                  onDeletePhoto={handleDeletePhoto}
                  viewMode={viewMode}
                  isDeleting={deletingWork === work.id}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Fotos sem Trabalho */}
      {getPhotosWithoutWork().length > 0 && (
        <Card className="w-full bg-gray-800/80 backdrop-blur-sm border-gray-700">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-white">
              <Image className="h-5 w-5" />
              <span>Fotos sem Trabalho ({getPhotosWithoutWork().length})</span>
            </CardTitle>
            <CardDescription className="text-gray-300">
              Fotos que ainda não foram associadas a nenhum trabalho
            </CardDescription>
          </CardHeader>
          <CardContent>
            <PhotoGrid
              photos={getPhotosWithoutWork()}
              categories={categories}
              works={works}
              onUpdatePhoto={handleUpdatePhoto}
              onDeletePhoto={handleDeletePhoto}
              showWorkSelector={true}
            />
          </CardContent>
        </Card>
      )}
    </div>
  )
}

function WorkWithPhotos({ 
  work, 
  photos, 
  categories, 
  works, 
  expanded, 
  onToggleExpansion, 
  onDeleteWork, 
  onUpdatePhoto, 
  onDeletePhoto,
  viewMode,
  isDeleting = false
}) {
  return (
    <Card className="bg-gray-700/50 backdrop-blur-sm border border-gray-600">
      <Collapsible open={expanded} onOpenChange={onToggleExpansion}>
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer hover:bg-gray-700/30 transition-colors">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                {expanded ? (
                  <ChevronDown className="h-5 w-5 text-gray-400" />
                ) : (
                  <ChevronRight className="h-5 w-5 text-gray-400" />
                )}
                
                <div className="flex items-center space-x-2">
                  {work.cover_photo_url ? (
                    <img
                      src={work.cover_photo_url}
                      alt={work.title}
                      className="w-12 h-12 object-cover rounded border border-gray-600"
                    />
                  ) : (
                    <div className="w-12 h-12 bg-gray-600/50 rounded flex items-center justify-center">
                      <Folder className="h-6 w-6 text-gray-400" />
                    </div>
                  )}
                  
                  <div>
                    <div className="flex items-center space-x-2">
                      <h3 className="font-semibold text-white">{work.title}</h3>
                      {work.is_featured && (
                        <Badge className="bg-gradient-to-r from-yellow-500 to-amber-500 text-black text-xs">
                          <Star className="h-3 w-3 mr-1" />
                          Destaque
                        </Badge>
                      )}
                    </div>
                    {work.description && (
                      <p className="text-sm text-gray-400 line-clamp-1">{work.description}</p>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <Badge variant="outline" className="border-gray-500 text-gray-300 bg-gray-600/30">
                  {work.category_name || 'Sem categoria'}
                </Badge>
                <Badge variant="outline" className="border-blue-500 text-blue-300 bg-blue-600/30">
                  {photos.length} fotos
                </Badge>
                
                <Button
                  size="sm"
                  variant="outline"
                  onClick={(e) => {
                    e.stopPropagation()
                    onDeleteWork(work.id)
                  }}
                  disabled={isDeleting}
                  className="h-8 w-8 p-0 border-red-600 text-red-400 hover:bg-red-600 hover:text-white disabled:opacity-50"
                >
                  {isDeleting ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <Trash2 className="h-3 w-3" />
                  )}
                </Button>
              </div>
            </div>
          </CardHeader>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <CardContent className="pt-0">
            {photos.length > 0 ? (
              <PhotoGrid
                photos={photos}
                categories={categories}
                works={works}
                onUpdatePhoto={onUpdatePhoto}
                onDeletePhoto={onDeletePhoto}
                showWorkSelector={true}
                currentWorkId={work.id}
              />
            ) : (
              <div className="text-center py-8 bg-gray-800/30 rounded-lg border border-gray-600">
                <Image className="h-12 w-12 mx-auto mb-2 text-gray-500" />
                <p className="text-gray-400">Nenhuma foto neste trabalho</p>
                <p className="text-gray-500 text-sm mt-1">
                  Faça upload de fotos e associe-as a este trabalho
                </p>
              </div>
            )}
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  )
}

function PhotoGrid({ 
  photos, 
  categories, 
  works, 
  onUpdatePhoto, 
  onDeletePhoto, 
  showWorkSelector = false, 
  currentWorkId = null 
}) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {photos.map((photo) => (
        <PhotoCard
          key={photo.id}
          photo={photo}
          categories={categories}
          works={works}
          onUpdate={onUpdatePhoto}
          onDelete={onDeletePhoto}
          showWorkSelector={showWorkSelector}
          currentWorkId={currentWorkId}
        />
      ))}
    </div>
  )
}

function PhotoCard({ 
  photo, 
  categories, 
  works, 
  onUpdate, 
  onDelete, 
  showWorkSelector, 
  currentWorkId 
}) {
  return (
    <div className="bg-gray-700/50 backdrop-blur-sm border border-gray-600 rounded-lg overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 group">
      <div className="relative overflow-hidden">
        <img
          src={photo.url}
          alt={photo.title || 'Foto'}
          className="w-full h-32 object-cover transition-transform duration-300 group-hover:scale-105"
          onError={(e) => {
            e.target.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100"><rect width="100" height="100" fill="%23374151"/><text x="50" y="50" text-anchor="middle" dy=".3em" fill="%239CA3AF">Erro</text></svg>'
          }}
        />
        {photo.is_featured && (
          <Badge className="absolute top-2 left-2 bg-gradient-to-r from-yellow-500 to-amber-500 text-black text-xs">
            <Star className="h-3 w-3 mr-1" />
            Destaque
          </Badge>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      </div>

      <div className="p-3">
        <h4 className="font-medium text-white truncate mb-1 text-sm">
          {photo.title || 'Sem título'}
        </h4>
        
        <div className="flex items-center justify-between mb-2">
          <Badge variant="outline" className="text-xs border-gray-500 text-gray-300 bg-gray-600/30">
            {photo.category_name || 'Sem categoria'}
          </Badge>
        </div>

        <div className="flex space-x-1">
          <Dialog>
            <DialogTrigger asChild>
              <Button size="sm" variant="outline" className="h-7 flex-1 text-xs border-gray-600 text-gray-300 hover:bg-gray-600 hover:text-white">
                <Eye className="h-3 w-3 mr-1" />
                Ver
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl bg-gray-800 border-gray-700">
              <DialogHeader>
                <DialogTitle className="text-white">{photo.title || 'Foto'}</DialogTitle>
              </DialogHeader>
              <div className="flex justify-center bg-gray-900 rounded-lg p-4">
                <img
                  src={photo.url}
                  alt={photo.title || 'Foto'}
                  className="max-w-full max-h-96 object-contain rounded"
                />
              </div>
              {photo.description && (
                <p className="text-gray-300 mt-4 bg-gray-700/30 p-3 rounded">{photo.description}</p>
              )}
            </DialogContent>
          </Dialog>

          <Dialog>
            <DialogTrigger asChild>
              <Button size="sm" variant="outline" className="h-7 w-7 p-0 border-gray-600 text-blue-400 hover:bg-blue-600 hover:text-white">
                <Edit className="h-3 w-3" />
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md bg-gray-800 border-gray-700">
              <DialogHeader>
                <DialogTitle className="text-white">Editar Foto</DialogTitle>
              </DialogHeader>
              <EditPhotoForm 
                photo={photo} 
                categories={categories} 
                works={works}
                onSave={onUpdate}
                showWorkSelector={showWorkSelector}
                currentWorkId={currentWorkId}
              />
            </DialogContent>
          </Dialog>

          <Button
            size="sm"
            variant="outline"
            onClick={() => onDelete(photo.id)}
            className="h-7 w-7 p-0 border-red-600 text-red-400 hover:bg-red-600 hover:text-white"
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      </div>
    </div>
  )
}

function CreateWorkForm({ categories, onSubmit }) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [isFeatured, setIsFeatured] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async () => {
    if (!title.trim()) return

    setIsSubmitting(true)

    try {
      await onSubmit({
        title,
        description,
        category_id: categoryId && categoryId !== 'none' ? parseInt(categoryId) : null,
        is_featured: isFeatured
      })

      setTitle('')
      setDescription('')
      setCategoryId('')
      setIsFeatured(false)
    } catch (error) {
      console.error('Erro ao criar trabalho:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="work-title" className="text-white">Título do Trabalho</Label>
          <Input
            id="work-title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Ex: Ensaio Primavera 2024"
            required
            disabled={isSubmitting}
            className="bg-gray-700/50 border-gray-600 text-white placeholder-gray-400 focus:border-blue-500 focus:ring-blue-500"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="work-category" className="text-white">Categoria</Label>
          <Select value={categoryId} onValueChange={setCategoryId} disabled={isSubmitting}>
            <SelectTrigger className="bg-gray-700/50 border-gray-600 text-white focus:border-blue-500 focus:ring-blue-500">
              <SelectValue placeholder="Selecione uma categoria" />
            </SelectTrigger>
            <SelectContent className="bg-gray-700 border-gray-600">
              <SelectItem value="" className="text-white hover:bg-gray-600">Sem categoria</SelectItem>
              {categories.map((category) => (
                <SelectItem key={category.id} value={category.id.toString()} className="text-white hover:bg-gray-600">
                  {category.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="work-description" className="text-white">Descrição</Label>
        <Textarea
          id="work-description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Descreva o trabalho..."
          disabled={isSubmitting}
          className="bg-gray-700/50 border-gray-600 text-white placeholder-gray-400 focus:border-blue-500 focus:ring-blue-500 min-h-20"
        />
      </div>

      <div className="flex items-center space-x-2 p-3 bg-gray-700/30 rounded-lg">
        <input
          type="checkbox"
          id="work-featured"
          checked={isFeatured}
          onChange={(e) => setIsFeatured(e.target.checked)}
          disabled={isSubmitting}
          className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500"
        />
        <Label htmlFor="work-featured" className="text-white font-medium">Trabalho em destaque</Label>
      </div>

      <Button
        onClick={handleSubmit}
        disabled={isSubmitting || !title.trim()}
        className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 disabled:from-gray-600 disabled:to-gray-700 text-white font-semibold"
      >
        {isSubmitting ? (
          <div className="flex items-center space-x-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Criando...</span>
          </div>
        ) : (
          <div className="flex items-center space-x-2">
            <Plus className="h-4 w-4" />
            <span>Criar Trabalho</span>
          </div>
        )}
      </Button>
    </div>
  )
}

function EditPhotoForm({ photo, categories, works, onSave, showWorkSelector = false, currentWorkId = null }) {
  const [title, setTitle] = useState(photo?.title || '')
  const [description, setDescription] = useState(photo?.description || '')
  const [categoryId, setCategoryId] = useState(photo?.category_id?.toString() || '')
  const [workId, setWorkId] = useState(photo?.work_id?.toString() || '')
  const [isFeatured, setIsFeatured] = useState(photo?.is_featured || false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async () => {
    if (!title.trim()) return

    setIsSubmitting(true)

    try {
      await onSave({
        id: photo.id,
        title,
        description,
        category_id: categoryId && categoryId !== 'none' ? parseInt(categoryId) : null,
        work_id: workId && workId !== 'none' ? parseInt(workId) : null,
        is_featured: isFeatured
      })
    } catch (error) {
      console.error('Erro ao salvar:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="edit-title" className="text-white">Título</Label>
        <Input
          id="edit-title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          disabled={isSubmitting}
          className="bg-gray-700/50 border-gray-600 text-white placeholder-gray-400 focus:border-blue-500 focus:ring-blue-500"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="edit-description" className="text-white">Descrição</Label>
        <Textarea
          id="edit-description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          disabled={isSubmitting}
          className="bg-gray-700/50 border-gray-600 text-white placeholder-gray-400 focus:border-blue-500 focus:ring-blue-500 min-h-20"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="edit-category" className="text-white">Categoria</Label>
          <Select value={categoryId} onValueChange={setCategoryId} disabled={isSubmitting}>
            <SelectTrigger className="bg-gray-700/50 border-gray-600 text-white focus:border-blue-500 focus:ring-blue-500">
              <SelectValue placeholder="Selecione uma categoria" />
            </SelectTrigger>
            <SelectContent className="bg-gray-700 border-gray-600">
              <SelectItem value="none" className="text-white hover:bg-gray-600">Sem categoria</SelectItem>
              {categories.map((category) => (
                <SelectItem key={category.id} value={category.id.toString()} className="text-white hover:bg-gray-600">
                  {category.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {showWorkSelector && (
          <div className="space-y-2">
            <Label htmlFor="edit-work" className="text-white">Trabalho</Label>
            <Select value={workId} onValueChange={setWorkId} disabled={isSubmitting}>
              <SelectTrigger className="bg-gray-700/50 border-gray-600 text-white focus:border-blue-500 focus:ring-blue-500">
                <SelectValue placeholder="Selecione um trabalho" />
              </SelectTrigger>
              <SelectContent className="bg-gray-700 border-gray-600">
                <SelectItem value="none" className="text-white hover:bg-gray-600">Sem trabalho</SelectItem>
                {works.filter(work => work.id !== currentWorkId).map((work) => (
                  <SelectItem key={work.id} value={work.id.toString()} className="text-white hover:bg-gray-600">
                    {work.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      <div className="flex items-center space-x-2 p-3 bg-gray-700/30 rounded-lg">
        <input
          type="checkbox"
          id="edit-featured"
          checked={isFeatured}
          onChange={(e) => setIsFeatured(e.target.checked)}
          disabled={isSubmitting}
          className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500"
        />
        <Label htmlFor="edit-featured" className="text-white font-medium">
          Foto em destaque
        </Label>
      </div>

      <Button
        onClick={handleSubmit}
        className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 disabled:from-gray-600 disabled:to-gray-700 text-white font-semibold"
        disabled={isSubmitting || !title.trim()}
      >
        {isSubmitting ? (
          <div className="flex items-center space-x-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Salvando...</span>
          </div>
        ) : (
          'Salvar Alterações'
        )}
      </Button>
    </div>
  )
}

export default WorkManager