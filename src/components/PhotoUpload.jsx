import { useState } from 'react'
import { Button } from '@/components/ui/button.jsx'
import { Input } from '@/components/ui/input.jsx'
import { Label } from '@/components/ui/label.jsx'
import { Textarea } from '@/components/ui/textarea.jsx'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select.jsx'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card.jsx'
import { Upload, X, CheckCircle, AlertCircle } from 'lucide-react'

function PhotoUpload({ onUploadSuccess }) {
  const [selectedFile, setSelectedFile] = useState(null)
  const [preview, setPreview] = useState(null)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [isFeatured, setIsFeatured] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadStatus, setUploadStatus] = useState(null)
  const [categories, setCategories] = useState([
    { id: 1, name: 'Retratos' },
    { id: 2, name: 'eventos' },
    { id: 3, name: 'Eventos' }
  ])
 

  const handleFileSelect = (event) => {
    const file = event.target.files[0]
    if (file) {
      setSelectedFile(file)
      setTitle(file.name.split('.')[0]) // Nome sem extensão como título padrão
      
      // Criar preview
      const reader = new FileReader()
      reader.onload = (e) => {
        setPreview(e.target.result)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleUpload = async () => {
    if (!selectedFile) {
      setUploadStatus({ type: 'error', message: 'Selecione uma foto primeiro' })
      return
    }

    setIsUploading(true)
    setUploadStatus(null)

    try {
      const formData = new FormData()
      formData.append('photo', selectedFile)
      formData.append('title', title)
      formData.append('description', description)
      formData.append('category_id', categoryId)
      formData.append('is_featured', isFeatured)

      const token = localStorage.getItem('adminToken')
      const response = await fetch(`${import.meta.env.VITE_API_URL}/photos/upload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      })

      const result = await response.json()

      if (response.ok) {
        setUploadStatus({ type: 'success', message: 'Foto enviada com sucesso!' })
        
        // Limpar formulário
        setSelectedFile(null)
        setPreview(null)
        setTitle('')
        setDescription('')
        setCategoryId('')
        setIsFeatured(false)
        
        // Resetar input de arquivo
        const fileInput = document.getElementById('photo-upload')
        if (fileInput) fileInput.value = ''
        
        // Callback para atualizar lista de fotos
        if (onUploadSuccess) {
          onUploadSuccess(result.photo)
        }
      } else {
        setUploadStatus({ type: 'error', message: result.error || 'Erro ao enviar foto' })
      }
    } catch (error) {
      console.error('Erro no upload:', error)
      setUploadStatus({ type: 'error', message: 'Erro de conexão com o servidor' })
    } finally {
      setIsUploading(false)
    }
  }

  const clearSelection = () => {
    setSelectedFile(null)
    setPreview(null)
    setTitle('')
    setDescription('')
    setUploadStatus(null)
    
    const fileInput = document.getElementById('photo-upload')
    if (fileInput) fileInput.value = ''
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Upload className="h-5 w-5" />
          <span>Upload de Foto</span>
        </CardTitle>
        <CardDescription>
          Adicione uma nova foto ao seu portfólio
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Status de upload */}
        {uploadStatus && (
          <div className={`flex items-center space-x-2 p-3 rounded ${
            uploadStatus.type === 'success' 
              ? 'bg-green-50 text-green-700 border border-green-200' 
              : 'bg-red-50 text-red-700 border border-red-200'
          }`}>
            {uploadStatus.type === 'success' ? (
              <CheckCircle className="h-4 w-4" />
            ) : (
              <AlertCircle className="h-4 w-4" />
            )}
            <span>{uploadStatus.message}</span>
          </div>
        )}

        {/* Seleção de arquivo */}
        <div className="space-y-2">
          <Label htmlFor="photo-upload">Selecionar Foto</Label>
          <Input
            id="photo-upload"
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            disabled={isUploading}
          />
        </div>

        {/* Preview da imagem */}
        {preview && (
          <div className="relative">
            <img
              src={preview}
              alt="Preview"
              className="w-full max-w-md h-48 object-cover rounded-lg border"
            />
            <button
              onClick={clearSelection}
              className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
              disabled={isUploading}
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* Formulário de detalhes */}
        {selectedFile && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Título</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Título da foto"
                disabled={isUploading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Descrição</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Descrição da foto (opcional)"
                disabled={isUploading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Categoria</Label>
              <Select value={categoryId} onValueChange={setCategoryId} disabled={isUploading}>
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

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="featured"
                checked={isFeatured}
                onChange={(e) => setIsFeatured(e.target.checked)}
                disabled={isUploading}
                className="rounded"
              />
              <Label htmlFor="featured">Foto em destaque</Label>
            </div>

            <div className="flex space-x-2">
              <Button
                onClick={handleUpload}
                disabled={isUploading || !title.trim()}
                className="flex-1"
              >
                {isUploading ? 'Enviando...' : 'Enviar Foto'}
              </Button>
              <Button
                variant="outline"
                onClick={clearSelection}
                disabled={isUploading}
              >
                Cancelar
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export default PhotoUpload

