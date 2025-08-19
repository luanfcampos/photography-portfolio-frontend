import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button.jsx'
import { Input } from '@/components/ui/input.jsx'
import { Label } from '@/components/ui/label.jsx'
import { Textarea } from '@/components/ui/textarea.jsx'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select.jsx'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card.jsx'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog.jsx'
import { Badge } from '@/components/ui/badge.jsx'
import { Images, Edit, Trash2, Star, Eye } from 'lucide-react'

function PhotoManager({ refreshTrigger }) {
  const [photos, setPhotos] = useState([])
  const [loading, setLoading] = useState(true)
  const [editingPhoto, setEditingPhoto] = useState(null)
  const [categories, setCategories] = useState([
    { id: 1, name: 'Retratos' },
    { id: 2, name: 'eventos' },
    { id: 3, name: 'Eventos' }
  ])
 

 const loadPhotos = async () => {
  try {
    const token = localStorage.getItem('adminToken')
    const response = await fetch(`${import.meta.env.VITE_API_URL}/api/photos`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
    if (response.ok) {
      const photosData = await response.json()
      // photosData agora já tem { url: "https://res.cloudinary.com/..." }
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
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/photos/${photoId}`, {
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
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/photos/${photoData.id}`, {
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
      <Card>
        <CardContent className="p-6">
          <div className="text-center">Carregando fotos...</div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Images className="h-5 w-5" />
          <span>Gerenciar Fotos ({photos.length})</span>
        </CardTitle>
        <CardDescription>
          Visualize, edite e organize suas fotos
        </CardDescription>
      </CardHeader>
      <CardContent>
        {photos.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Images className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p>Nenhuma foto encontrada</p>
            <p className="text-sm">Faça upload da primeira foto para começar</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {photos.map((photo) => (
              <div key={photo.id} className="border rounded-lg overflow-hidden">
                <div className="relative">
                  <img src={photo.url} alt={photo.title} className="w-full h-48 object-cover" />
                  {photo.is_featured && (
                    <Badge className="absolute top-2 left-2 bg-yellow-500">
                      <Star className="h-3 w-3 mr-1" />
                      Destaque
                    </Badge>
                  )}
                </div>

                <div className="p-4">
                  <h3 className="font-medium truncate">{photo.title}</h3>
                  {photo.description && (
                    <p className="text-sm text-gray-600 mt-1 line-clamp-2">{photo.description}</p>
                  )}

                  <div className="flex items-center justify-between mt-3">
                    <Badge variant="outline">{photo.category_name || 'Sem categoria'}</Badge>

                    <div className="flex space-x-1">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button size="sm" variant="outline">
                            <Eye className="h-3 w-3" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl">
                          <DialogHeader>
                            <DialogTitle>{photo.title}</DialogTitle>
                          </DialogHeader>
                          <img src={photo.url} alt={photo.title} className="w-full max-h-96 object-contain rounded" />
                          {photo.description && (
                            <p className="text-sm text-gray-600">{photo.description}</p>
                          )}
                        </DialogContent>
                      </Dialog>

                      <Dialog>
                        <DialogTrigger asChild>
                          <Button size="sm" variant="outline">
                            <Edit className="h-3 w-3" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Editar Foto</DialogTitle>
                            <DialogDescription>Atualize as informações da foto</DialogDescription>
                          </DialogHeader>
                          <EditPhotoForm photo={photo} categories={categories} onSave={handleUpdate} />
                        </DialogContent>
                      </Dialog>

                      <Button size="sm" variant="outline" onClick={() => handleDelete(photo.id)} className="text-red-600 hover:text-red-700">
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
  const [title, setTitle] = useState(photo.title)
  const [description, setDescription] = useState(photo.description || '')
  const [categoryId, setCategoryId] = useState(photo.category_id?.toString() || '')
  const [isFeatured, setIsFeatured] = useState(photo.is_featured)

  const handleSubmit = (e) => {
    e.preventDefault()
    onSave({
      id: photo.id,
      title,
      description,
      category_id: categoryId ? parseInt(categoryId) : null,
      is_featured: isFeatured
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="edit-title">Título</Label>
        <Input id="edit-title" value={title} onChange={(e) => setTitle(e.target.value)} required />
      </div>

      <div className="space-y-2">
        <Label htmlFor="edit-description">Descrição</Label>
        <Textarea id="edit-description" value={description} onChange={(e) => setDescription(e.target.value)} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="edit-category">Categoria</Label>
        <Select value={categoryId} onValueChange={setCategoryId}>
          <SelectTrigger>
            <SelectValue placeholder="Selecione uma categoria" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">Sem categoria</SelectItem>
            {categories.map((category) => (
              <SelectItem key={category.id} value={category.id.toString()}>{category.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center space-x-2">
        <input type="checkbox" id="edit-featured" checked={isFeatured} onChange={(e) => setIsFeatured(e.target.checked)} className="rounded" />
        <Label htmlFor="edit-featured">Foto em destaque</Label>
      </div>

      <Button type="submit" className="w-full">Salvar Alterações</Button>
    </form>
  )
}

export default PhotoManager
