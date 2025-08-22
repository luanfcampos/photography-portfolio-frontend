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
import { Folder, Edit, Trash2, Star, Eye, Plus, Image, Loader2 } from 'lucide-react'

function WorkManager({ refreshTrigger }) {
  const [works, setWorks] = useState([])
  const [photos, setPhotos] = useState([])
  const [loading, setLoading] = useState(true)
  const [categories] = useState([
    { id: 1, name: 'Ensaios' },
    { id: 2, name: 'Shows e Espetáculos' },
    { id: 3, name: 'Eventos' }
  ])

  const loadWorks = async () => {
    try {
      const response = await apiRequest(API_CONFIG.ENDPOINTS.WORKS)
      if (response.ok) {
        const worksData = await response.json()
        setWorks(worksData)
      }
    } catch (error) {
      console.error('Erro ao carregar trabalhos:', error)
    }
  }

  const loadPhotos = async () => {
    try {
      const response = await apiRequest(API_CONFIG.ENDPOINTS.PHOTOS)
      if (response.ok) {
        const photosData = await response.json()
        setPhotos(photosData)
      }
    } catch (error) {
      console.error('Erro ao carregar fotos:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadWorks()
    loadPhotos()
  }, [refreshTrigger])

  const handleCreateWork = async (workData) => {
    try {
      const response = await apiRequest(API_CONFIG.ENDPOINTS.WORKS, {
        method: 'POST',
        body: JSON.stringify(workData)
      })

      if (response.ok) {
        await loadWorks()
      } else {
        alert('Erro ao criar trabalho')
      }
    } catch (error) {
      console.error('Erro ao criar trabalho:', error)
      alert('Erro de conexão')
    }
  }

  const handleDeleteWork = async (workId) => {
    if (!confirm('Tem certeza que deseja deletar este trabalho?')) return

    try {
      const response = await apiRequest(`${API_CONFIG.ENDPOINTS.WORKS}/${workId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        setWorks(works.filter(work => work.id !== workId))
      } else {
        alert('Erro ao deletar trabalho')
      }
    } catch (error) {
      console.error('Erro ao deletar trabalho:', error)
      alert('Erro de conexão')
    }
  }

  const getPhotosWithoutWork = () => {
    return photos.filter(photo => !photo.work_id)
  }

  const getPhotosForWork = (workId) => {
    return photos.filter(photo => photo.work_id === workId)
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

      {/* Lista de Trabalhos */}
      <Card className="w-full bg-gray-800/80 backdrop-blur-sm border-gray-700">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 text-white">
            <Folder className="h-5 w-5" />
            <span>Gerenciar Trabalhos ({works.length})</span>
          </CardTitle>
          <CardDescription className="text-gray-300">
            Visualize e organize seus trabalhos
          </CardDescription>
        </CardHeader>
        <CardContent>
          {works.length === 0 ? (
            <div className="text-center py-12">
              <Folder className="h-16 w-16 mx-auto mb-4 text-gray-500" />
              <p className="text-gray-400 text-lg mb-2">Nenhum trabalho encontrado</p>
              <p className="text-gray-500 text-sm">Crie seu primeiro trabalho para começar</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {works.map((work) => (
                <WorkCard 
                  key={work.id} 
                  work={work} 
                  photos={getPhotosForWork(work.id)}
                  onDelete={handleDeleteWork}
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
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2">
              {getPhotosWithoutWork().map((photo) => (
                <div key={photo.id} className="relative group">
                  <img 
                    src={photo.url} 
                    alt={photo.title} 
                    className="w-full h-20 object-cover rounded border border-gray-600 transition-transform duration-300 group-hover:scale-105"
                    onError={(e) => {
                      e.target.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100"><rect width="100" height="100" fill="%23374151"/><text x="50" y="50" text-anchor="middle" dy=".3em" fill="%239CA3AF">Erro</text></svg>'
                    }}
                  />
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded flex items-center justify-center">
                    <span className="text-white text-xs text-center p-1">{photo.title}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
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

      // Limpar formulário
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

function WorkCard({ work, photos, onDelete }) {
  return (
    <div className="bg-gray-700/50 backdrop-blur-sm border border-gray-600 rounded-xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 group">
      <div className="relative overflow-hidden">
        {work.cover_photo_url ? (
          <img 
            src={work.cover_photo_url} 
            alt={work.title} 
            className="w-full h-48 object-cover transition-transform duration-300 group-hover:scale-105"
            onError={(e) => {
              e.target.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100"><rect width="100" height="100" fill="%23374151"/><text x="50" y="50" text-anchor="middle" dy=".3em" fill="%239CA3AF">Erro</text></svg>'
            }}
          />
        ) : (
          <div className="w-full h-48 bg-gray-600/50 flex items-center justify-center">
            <Folder className="h-16 w-16 text-gray-400" />
          </div>
        )}
        {work.is_featured && (
          <Badge className="absolute top-3 left-3 bg-gradient-to-r from-yellow-500 to-amber-500 hover:from-yellow-600 hover:to-amber-600 text-black font-semibold">
            <Star className="h-3 w-3 mr-1" />
            Destaque
          </Badge>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      </div>

      <div className="p-4">
        <h3 className="font-semibold text-white truncate mb-1">{work.title}</h3>
        {work.description && (
          <p className="text-sm text-gray-300 mb-3 line-clamp-2 leading-relaxed">{work.description}</p>
        )}

        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Badge variant="outline" className="text-xs border-gray-500 text-gray-300 bg-gray-600/30">
              {work.category_name || 'Sem categoria'}
            </Badge>
            <span className="text-xs text-gray-400">{photos.length} fotos</span>
          </div>

          <div className="flex space-x-2">
            <Dialog>
              <DialogTrigger asChild>
                <Button size="sm" variant="outline" className="h-8 w-8 p-0 border-gray-600 text-gray-300 hover:bg-gray-600 hover:text-white">
                  <Eye className="h-3 w-3" />
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl bg-gray-800 border-gray-700">
                <DialogHeader>
                  <DialogTitle className="text-white">{work.title}</DialogTitle>
                  <DialogDescription className="text-gray-300">{work.description}</DialogDescription>
                </DialogHeader>
                {photos.length > 0 ? (
                  <div className="grid grid-cols-3 gap-2 max-h-60 overflow-y-auto bg-gray-900/50 p-4 rounded-lg">
                    {photos.map((photo) => (
                      <img 
                        key={photo.id}
                        src={photo.url} 
                        alt={photo.title} 
                        className="w-full h-20 object-cover rounded border border-gray-600 hover:scale-105 transition-transform duration-200"
                        onError={(e) => {
                          e.target.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100"><rect width="100" height="100" fill="%23374151"/><text x="50" y="50" text-anchor="middle" dy=".3em" fill="%239CA3AF">Erro</text></svg>'
                        }}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 bg-gray-900/50 rounded-lg">
                    <Folder className="h-12 w-12 mx-auto mb-2 text-gray-500" />
                    <p className="text-gray-400">Nenhuma foto neste trabalho</p>
                  </div>
                )}
              </DialogContent>
            </Dialog>

            <Button 
              size="sm" 
              variant="outline" 
              onClick={() => onDelete(work.id)} 
              className="h-8 w-8 p-0 border-red-600 text-red-400 hover:bg-red-600 hover:text-white"
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default WorkManager