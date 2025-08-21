import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Upload, X, CheckCircle, AlertCircle } from 'lucide-react'

function PhotoUpload({ onUploadSuccess }) {
  const [selectedFile, setSelectedFile] = useState(null)
  const [preview, setPreview] = useState(null)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [workId, setWorkId] = useState('')
  const [isFeatured, setIsFeatured] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadStatus, setUploadStatus] = useState(null)
  const [categories] = useState([
    { id: 1, name: 'Ensaios' },
    { id: 2, name: 'Produtos' },
    { id: 3, name: 'Eventos' }
  ])
  const [works, setWorks] = useState([])

  // Carregar trabalhos disponíveis
  useEffect(() => {
    const loadWorks = async () => {
      try {
        const token = localStorage.getItem('adminToken')
        const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001'
        const response = await fetch(`${API_URL}/api/works`, {
          headers: { 'Authorization': `Bearer ${token}` }
        })
        if (response.ok) {
          const worksData = await response.json()
          setWorks(worksData)
        }
      } catch (error) {
        console.error('Erro ao carregar trabalhos:', error)
      }
    }

    loadWorks()
  }, [])

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
      formData.append('work_id', workId)
      formData.append('is_featured', isFeatured)

      const token = localStorage.getItem("adminToken")
      const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001'
      const response = await fetch(`${API_URL}/api/photos`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`
        },
        body: formData
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Erro desconhecido' }))
        throw new Error(errorData.error || `HTTP ${response.status}`)
      }

      const result = await response.json()

      setUploadStatus({ type: 'success', message: 'Foto enviada com sucesso!' })
      
      // Limpar formulário
      clearForm()
      
      // Callback para atualizar lista de fotos
      if (onUploadSuccess) {
        onUploadSuccess(result)
      }

    } catch (error) {
      console.error('Erro no upload:', error)
      setUploadStatus({ 
        type: 'error', 
        message: error.message || 'Erro de conexão com o servidor' 
      })
    } finally {
      setIsUploading(false)
    }
  }

  const clearForm = () => {
    setSelectedFile(null)
    setPreview(null)
    setTitle('')
    setDescription('')
    setCategoryId('')
    setWorkId('')
    setIsFeatured(false)
    setUploadStatus(null)
  }

  const clearSelection = () => {
    clearForm()
  }

  return (
    <Card className="w-full">
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

        {preview && (
          <div className="relative inline-block">
            <img
              src={preview}
              alt="Preview"
              className="w-full max-w-md h-48 object-cover rounded-lg border"
            />
            <Button
              variant="outline"
              size="sm"
              onClick={clearSelection}
              className="absolute top-2 right-2 bg-red-500 text-white hover:bg-red-600 h-8 w-8 p-0"
              disabled={isUploading}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        )}

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
                className="min-h-20"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="work">Trabalho (Opcional)</Label>
              <Select value={workId} onValueChange={setWorkId} disabled={isUploading}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um trabalho" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Nenhum trabalho</SelectItem>
                  {works.map((work) => (
                    <SelectItem key={work.id} value={work.id.toString()}>
                      {work.title} ({work.category_name})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
                className="rounded border-gray-300"
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