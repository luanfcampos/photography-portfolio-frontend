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
import { Image, Edit, Trash2, Star, Eye, Loader2 } from 'lucide-react'

function PhotoManager({ refreshTrigger }) {
  const [photos, setPhotos] = useState([])
  const [loading, setLoading] = useState(true)
  const [editingPhoto, setEditingPhoto] = useState(null)
  const [categories] = useState([
    { id: 1, name: 'Ensaios' },
    { id: 2, name: 'Shows e Espetáculos' },
    { id: 3, name: 'Eventos' }
  ])

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
    loadPhotos()
  }, [refreshTrigger])

  const handleDelete = async (photoId) => {
    if (!confirm('Tem certeza que deseja deletar esta foto?')) return

    try {
      const response = await apiRequest(`${API_CONFIG.ENDPOINTS.PHOTOS}/${photoId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        setPhotos(photos.filter(photo => photo.id !== photoId))
      } else {
        alert('Erro ao deletar foto')
      }
    } catch (error) {
      console.error('Erro ao deletar foto:', error)
      alert('Erro de conexão')
    }
  }

  const handleUpdate = async (photoData) => {
    try {
       const response = await apiRequest(`${API_CONFIG.ENDPOINTS.PHOTOS}/${photoData.id}`, {
        method: 'PUT',
        body: JSON.stringify(photoData)
      })

      if (response.ok) {
        setPhotos(photos.map(photo => photo.id === photoData.id ? { ...photo, ...photoData } : photo))
        setEditingPhoto(null)
      } else {
        alert('Erro ao atualizar foto')
      }
    } catch (error) {
      console.error('Erro ao atualizar foto:', error)
      alert('Erro de conexão')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen p-6">
        <Card className="w-full bg-gray-800/80 backdrop-blur-sm border-gray-700">
          <CardContent className="p-6">
            <div className="flex items-center justify-center space-x-3 text-white">
              <Loader2 className="h-5 w-5 animate-spin" />
              <span>Carregando fotos...</span>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
      <Card className="w-full bg-gray-800/80 backdrop-blur-sm border-gray-700">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 text-white">
            <Image className="h-5 w-5" />
            <span>Gerenciar Fotos ({photos.length})</span>
          </CardTitle>
          <CardDescription className="text-gray-300">
            Visualize, edite e organize suas fotos
          </CardDescription>
        </CardHeader>
        <CardContent>
          {photos.length === 0 ? (
            <div className="text-center py-12">
              <Image className="h-16 w-16 mx-auto mb-4 text-gray-500" />
              <p className="text-gray-400 text-lg mb-2">Nenhuma foto encontrada</p>
              <p className="text-gray-500 text-sm">Faça upload da primeira foto para começar</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {photos.map((photo) => (
                <div key={photo.id} className="bg-gray-700/50 backdrop-blur-sm border border-gray-600 rounded-xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 group">
                  <div className="relative overflow-hidden">
                    <img 
                      src={photo.url} 
                      alt={photo.title || 'Foto'} 
                      className="w-full h-48 object-cover transition-transform duration-300 group-hover:scale-105"
                      onError={(e) => {
                        e.target.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100"><rect width="100" height="100" fill="%23374151"/><text x="50" y="50" text-anchor="middle" dy=".3em" fill="%239CA3AF">Erro</text></svg>'
                      }}
                    />
                    {photo.is_featured && (
                      <Badge className="absolute top-3 left-3 bg-gradient-to-r from-yellow-500 to-amber-500 hover:from-yellow-600 hover:to-amber-600 text-black font-semibold">
                        <Star className="h-3 w-3 mr-1" />
                        Destaque
                      </Badge>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  </div>

                  <div className="p-4">
                    <h3 className="font-semibold text-white truncate mb-1">
                      {photo.title || 'Sem título'}
                    </h3>
                    {photo.description && (
                      <p className="text-sm text-gray-300 mb-3 line-clamp-2 leading-relaxed">
                        {photo.description}
                      </p>
                    )}

                    <div className="flex items-center justify-between">
                      <Badge variant="outline" className="text-xs border-gray-500 text-gray-300 bg-gray-600/30">
                        {photo.category_name || 'Sem categoria'}
                      </Badge>

                      <div className="flex space-x-2">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button size="sm" variant="outline" className="h-8 w-8 p-0 border-gray-600 text-gray-300 hover:bg-gray-600 hover:text-white">
                              <Eye className="h-3 w-3" />
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
                                onError={(e) => {
                                  e.target.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="300" height="200" viewBox="0 0 300 200"><rect width="300" height="200" fill="%23374151"/><text x="150" y="100" text-anchor="middle" dy=".3em" fill="%239CA3AF">Erro ao carregar</text></svg>'
                                }}
                              />
                            </div>
                            {photo.description && (
                              <p className="text-gray-300 mt-4 bg-gray-700/30 p-3 rounded">{photo.description}</p>
                            )}
                          </DialogContent>
                        </Dialog>

                        <Dialog>
                          <DialogTrigger asChild>
                            <Button size="sm" variant="outline" className="h-8 w-8 p-0 border-gray-600 text-blue-400 hover:bg-blue-600 hover:text-white">
                              <Edit className="h-3 w-3" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-md bg-gray-800 border-gray-700">
                            <DialogHeader>
                              <DialogTitle className="text-white">Editar Foto</DialogTitle>
                              <DialogDescription className="text-gray-300">Atualize as informações da foto</DialogDescription>
                            </DialogHeader>
                            <EditPhotoForm photo={photo} categories={categories} onSave={handleUpdate} />
                          </DialogContent>
                        </Dialog>

                        <Button 
                          size="sm" 
                          variant="outline" 
                          onClick={() => handleDelete(photo.id)} 
                          className="h-8 w-8 p-0 border-red-600 text-red-400 hover:bg-red-600 hover:text-white"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
  )
}

function EditPhotoForm({ photo, categories, onSave }) {
  const [title, setTitle] = useState(photo?.title || '')
  const [description, setDescription] = useState(photo?.description || '')
  const [categoryId, setCategoryId] = useState(photo?.category_id?.toString() || '')
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

export default PhotoManager
