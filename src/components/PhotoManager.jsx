import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Image, Edit, Trash2, Star, Eye } from 'lucide-react'

function PhotoManager({ refreshTrigger }) {
  const [photos, setPhotos] = useState([])
  const [loading, setLoading] = useState(true)
  const [editingPhoto, setEditingPhoto] = useState(null)
  const [categories] = useState([
    { id: 1, name: 'Ensaios' },
    { id: 2, name: 'Produtos' },
    { id: 3, name: 'Eventos' }
  ])

  const loadPhotos = async () => {
    try {
      const token = localStorage.getItem('adminToken')
      const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001'
      const response = await fetch(`${API_URL}/api/photos`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
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
      const token = localStorage.getItem('adminToken')
      const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001'
      const response = await fetch(`${API_URL}/api/photos/${photoId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
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
      const token = localStorage.getItem('adminToken')
      const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001'
      const response = await fetch(`${API_URL}/api/photos/${photoData.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
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
      <Card className="w-full">
        <CardContent className="p-6">
          <div className="text-center">Carregando fotos...</div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Image className="h-5 w-5" />
          <span>Gerenciar Fotos ({photos.length})</span>
        </CardTitle>
        <CardDescription>
          Visualize, edite e organize suas fotos
        </CardDescription>
      </CardHeader>
      <CardContent>
        {photos.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Image className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p>Nenhuma foto encontrada</p>
            <p className="text-sm">Faça upload da primeira foto para começar</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {photos.map((photo) => (
              <div key={photo.id} className="border border-gray-200 rounded-lg overflow-hidden bg-white shadow-sm">
                <div className="relative">
                  <img 
                    src={photo.url} 
                    alt={photo.title || 'Foto'} 
                    className="w-full h-48 object-cover"
                    onError={(e) => {
                      e.target.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100"><rect width="100" height="100" fill="%23f3f4f6"/><text x="50" y="50" text-anchor="middle" dy=".3em" fill="%236b7280">Erro</text></svg>'
                    }}
                  />
                  {photo.is_featured && (
                    <Badge className="absolute top-2 left-2 bg-yellow-500 hover:bg-yellow-600">
                      <Star className="h-3 w-3 mr-1" />
                      Destaque
                    </Badge>
                  )}
                </div>

                <div className="p-4">
                  <h3 className="font-medium truncate text-gray-900">{photo.title || 'Sem título'}</h3>
                  {photo.description && (
                    <p className="text-sm text-gray-600 mt-1 line-clamp-2">{photo.description}</p>
                  )}

                  <div className="flex items-center justify-between mt-3">
                    <Badge variant="outline" className="text-xs">
                      {photo.category_name || 'Sem categoria'}
                    </Badge>

                    <div className="flex space-x-1">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button size="sm" variant="outline" className="h-8 w-8 p-0">
                            <Eye className="h-3 w-3" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl">
                          <DialogHeader>
                            <DialogTitle>{photo.title || 'Foto'}</DialogTitle>
                          </DialogHeader>
                          <div className="flex justify-center">
                            <img 
                              src={photo.url} 
                              alt={photo.title || 'Foto'} 
                              className="max-w-full max-h-96 object-contain rounded"
                              onError={(e) => {
                                e.target.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="300" height="200" viewBox="0 0 300 200"><rect width="300" height="200" fill="%23f3f4f6"/><text x="150" y="100" text-anchor="middle" dy=".3em" fill="%236b7280">Erro ao carregar</text></svg>'
                              }}
                            />
                          </div>
                          {photo.description && (
                            <p className="text-sm text-gray-600 mt-4">{photo.description}</p>
                          )}
                        </DialogContent>
                      </Dialog>

                      <Dialog>
                        <DialogTrigger asChild>
                          <Button size="sm" variant="outline" className="h-8 w-8 p-0">
                            <Edit className="h-3 w-3" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-md">
                          <DialogHeader>
                            <DialogTitle>Editar Foto</DialogTitle>
                            <DialogDescription>Atualize as informações da foto</DialogDescription>
                          </DialogHeader>
                          <EditPhotoForm photo={photo} categories={categories} onSave={handleUpdate} />
                        </DialogContent>
                      </Dialog>

                      <Button 
                        size="sm" 
                        variant="outline" 
                        onClick={() => handleDelete(photo.id)} 
                        className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
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
        <Label htmlFor="edit-title">Título</Label>
        <Input 
          id="edit-title" 
          value={title} 
          onChange={(e) => setTitle(e.target.value)} 
          required 
          disabled={isSubmitting}
          className="w-full"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="edit-description">Descrição</Label>
        <Textarea 
          id="edit-description" 
          value={description} 
          onChange={(e) => setDescription(e.target.value)}
          disabled={isSubmitting}
          className="w-full min-h-20"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="edit-category">Categoria</Label>
        <Select value={categoryId} onValueChange={setCategoryId} disabled={isSubmitting}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Selecione uma categoria" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">Sem categoria</SelectItem>
            {categories.map((category) => (
              <SelectItem key={category.id} value={category.id.toString()}>
                {category.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center space-x-2">
        <input 
          type="checkbox" 
          id="edit-featured" 
          checked={isFeatured} 
          onChange={(e) => setIsFeatured(e.target.checked)} 
          disabled={isSubmitting}
          className="rounded border-gray-300"
        />
        <Label htmlFor="edit-featured" className="text-sm font-medium">
          Foto em destaque
        </Label>
      </div>

      <Button 
        onClick={handleSubmit}
        className="w-full" 
        disabled={isSubmitting || !title.trim()}
      >
        {isSubmitting ? 'Salvando...' : 'Salvar Alterações'}
      </Button>
    </div>
  )
}

export default PhotoManager