import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Folder, Edit, Trash2, Star, Eye, Plus, Image } from 'lucide-react'

function WorkManager({ refreshTrigger }) {
  const [works, setWorks] = useState([])
  const [photos, setPhotos] = useState([])
  const [loading, setLoading] = useState(true)
  const [categories] = useState([
    { id: 1, name: 'Ensaios' },
    { id: 2, name: 'Produtos' },
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
      const token = localStorage.getItem('adminToken')
      const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001'
      const response = await fetch(`${API_URL}/api/works/${workId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
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
      <Card className="w-full">
        <CardContent className="p-6">
          <div className="text-center">Carregando trabalhos...</div>
        </CardContent>
      </Card>
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
          <CreateWorkForm className="text-gray-300" categories={categories} onSubmit={handleCreateWork} />
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
            <div className="text-center py-8 text-gray-500">
              <Folder className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>Nenhum trabalho encontrado</p>
              <p className="text-sm">Crie seu primeiro trabalho para começar</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
        <Card className="w-full">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Image className="h-5 w-5" />
              <span>Fotos sem Trabalho ({getPhotosWithoutWork().length})</span>
            </CardTitle>
            <CardDescription>
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
                    className="w-full h-20 object-cover rounded border"
                    onError={(e) => {
                      e.target.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100"><rect width="100" height="100" fill="%23f3f4f6"/><text x="50" y="50" text-anchor="middle" dy=".3em" fill="%236b7280">Erro</text></svg>'
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
          <Label className="text-gray-300" htmlFor="work-title">Título do Trabalho</Label>
          <Input
          className="text-gray-300 border-gray-300 "
            id="work-title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Ex: Ensaio Primavera 2024"
            required
            disabled={isSubmitting}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="work-category">Categoria</Label>
          <Select value={categoryId} onValueChange={setCategoryId} disabled={isSubmitting}>
            <SelectTrigger>
              <SelectValue placeholder="Selecione uma categoria" />
            </SelectTrigger>
            <SelectContent>
              {categories.map((category) => (
                <SelectItem key={category.id} value={category.id.toString()}>
                  {category.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="work-description">Descrição</Label>
        <Textarea
          id="work-description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Descreva o trabalho..."
          disabled={isSubmitting}
          className="min-h-20"
        />
      </div>

      <div className="flex items-center space-x-2">
        <input
          type="checkbox"
          id="work-featured"
          checked={isFeatured}
          onChange={(e) => setIsFeatured(e.target.checked)}
          disabled={isSubmitting}
          className="rounded border-gray-300"
        />
        <Label htmlFor="work-featured">Trabalho em destaque</Label>
      </div>

      <Button 
        onClick={handleSubmit}
        disabled={isSubmitting || !title.trim()}
        className="w-full"
      >
        {isSubmitting ? 'Criando...' : 'Criar Trabalho'}
      </Button>
    </div>
  )
}

function WorkCard({ work, photos, onDelete }) {
  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden bg-white shadow-sm">
      <div className="relative">
        {work.cover_photo_url ? (
          <img 
            src={work.cover_photo_url} 
            alt={work.title} 
            className="w-full h-32 object-cover"
            onError={(e) => {
              e.target.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100"><rect width="100" height="100" fill="%23f3f4f6"/><text x="50" y="50" text-anchor="middle" dy=".3em" fill="%236b7280">Erro</text></svg>'
            }}
          />
        ) : (
          <div className="w-full h-32 bg-gray-200 flex items-center justify-center">
            <Folder className="h-8 w-8 text-gray-400" />
          </div>
        )}
        {work.is_featured && (
          <Badge className="absolute top-2 left-2 bg-yellow-500 hover:bg-yellow-600">
            <Star className="h-3 w-3 mr-1" />
            Destaque
          </Badge>
        )}
      </div>

      <div className="p-4">
        <h3 className="font-medium truncate text-gray-900">{work.title}</h3>
        {work.description && (
          <p className="text-sm text-gray-600 mt-1 line-clamp-2">{work.description}</p>
        )}

        <div className="flex items-center justify-between mt-3">
          <div className="flex items-center space-x-2">
            <Badge variant="outline" className="text-xs">
              {work.category_name || 'Sem categoria'}
            </Badge>
            <span className="text-xs text-gray-500">{photos.length} fotos</span>
          </div>

          <div className="flex space-x-1">
            <Dialog>
              <DialogTrigger asChild>
                <Button size="sm" variant="outline" className="h-8 w-8 p-0">
                  <Eye className="h-3 w-3" />
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>{work.title}</DialogTitle>
                  <DialogDescription>{work.description}</DialogDescription>
                </DialogHeader>
                {photos.length > 0 ? (
                  <div className="grid grid-cols-3 gap-2 max-h-60 overflow-y-auto">
                    {photos.map((photo) => (
                      <img 
                        key={photo.id}
                        src={photo.url} 
                        alt={photo.title} 
                        className="w-full h-20 object-cover rounded"
                        onError={(e) => {
                          e.target.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100"><rect width="100" height="100" fill="%23f3f4f6"/><text x="50" y="50" text-anchor="middle" dy=".3em" fill="%236b7280">Erro</text></svg>'
                        }}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-4 text-gray-500">
                    <p>Nenhuma foto neste trabalho</p>
                  </div>
                )}
              </DialogContent>
            </Dialog>

            <Button 
              size="sm" 
              variant="outline" 
              onClick={() => onDelete(work.id)} 
              className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
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