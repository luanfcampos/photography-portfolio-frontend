import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Upload, X, CheckCircle, AlertCircle, Loader2, ImagePlus } from 'lucide-react'

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
      formData.append('category_id', categoryId && categoryId !== 'none' ? categoryId : '')
      formData.append('work_id', workId && workId !== 'none' ? workId : '')
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
    <Card className="w-full bg-gray-800/80 backdrop-blur-sm border-gray-700">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2 text-white">
          <Upload className="h-5 w-5" />
          <span>Upload de Foto</span>
        </CardTitle>
        <CardDescription className="text-gray-300">
          Adicione uma nova foto ao seu portfólio
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {uploadStatus && (
          <div className={`flex items-center space-x-2 p-4 rounded-lg border ${
            uploadStatus.type === 'success' 
              ? 'bg-green-900/50 border-green-500 text-green-200' 
              : 'bg-red-900/50 border-red-500 text-red-200'
          }`}>
            {uploadStatus.type === 'success' ? (
              <CheckCircle className="h-5 w-5 text-green-400 flex-shrink-0" />
            ) : (
              <AlertCircle className="h-5 w-5 text-red-400 flex-shrink-0" />
            )}
            <span className="font-medium">{uploadStatus.message}</span>
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="photo-upload" className="text-white">Selecionar Foto</Label>
          <div className="relative">
            <Input
              id="photo-upload"
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              disabled={isUploading}
              className="bg-gray-700/50 border-gray-600 text-white file:bg-blue-600 file:border-0 file:text-white file:rounded-md file:px-3 file:py-1 file:mr-3 hover:file:bg-blue-700 focus:border-blue-500 focus:ring-blue-500"
            />
            <ImagePlus className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
          </div>
        </div>

        {preview && (
          <div className="relative">
            <div className="relative bg-gray-900 rounded-lg p-4 border border-gray-600">
              <img
                src={preview}
                alt="Preview"
                className="w-full max-h-64 object-contain rounded-lg"
              />
              <Button
                variant="outline"
                size="sm"
                onClick={clearSelection}
                className="absolute top-2 right-2 bg-red-600 border-red-500 text-white hover:bg-red-700 h-8 w-8 p-0"
                disabled={isUploading}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {selectedFile && (
          <div className="space-y-4 bg-gray-700/30 p-6 rounded-lg border border-gray-600">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="title" className="text-white">Título</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Título da foto"
                  disabled={isUploading}
                  className="bg-gray-700/50 border-gray-600 text-white placeholder-gray-400 focus:border-blue-500 focus:ring-blue-500"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="category" className="text-white">Categoria</Label>
                <Select value={categoryId} onValueChange={setCategoryId} disabled={isUploading}>
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
              <Label htmlFor="description" className="text-white">Descrição</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Descrição da foto (opcional)"
                disabled={isUploading}
                className="bg-gray-700/50 border-gray-600 text-white placeholder-gray-400 focus:border-blue-500 focus:ring-blue-500 min-h-20"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="work" className="text-white">Trabalho (Opcional)</Label>
              <Select value={workId} onValueChange={setWorkId} disabled={isUploading}>
                <SelectTrigger className="bg-gray-700/50 border-gray-600 text-white focus:border-blue-500 focus:ring-blue-500">
                  <SelectValue placeholder="Selecione um trabalho" />
                </SelectTrigger>
                <SelectContent className="bg-gray-700 border-gray-600">
                  <SelectItem value="none" className="text-white hover:bg-gray-600">Nenhum trabalho</SelectItem>
                  {works.map((work) => (
                    <SelectItem key={work.id} value={work.id.toString()} className="text-white hover:bg-gray-600">
                      {work.title} ({work.category_name})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center space-x-2 p-3 bg-gray-600/30 rounded-lg">
              <input
                type="checkbox"
                id="featured"
                checked={isFeatured}
                onChange={(e) => setIsFeatured(e.target.checked)}
                disabled={isUploading}
                className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500"
              />
              <Label htmlFor="featured" className="text-white font-medium">Foto em destaque</Label>
            </div>

            <div className="flex space-x-3 pt-4">
              <Button
                onClick={handleUpload}
                disabled={isUploading || !title.trim()}
                className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 disabled:from-gray-600 disabled:to-gray-700 text-white font-semibold"
              >
                {isUploading ? (
                  <div className="flex items-center space-x-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Enviando...</span>
                  </div>
                ) : (
                  <div className="flex items-center space-x-2">
                    <Upload className="h-4 w-4" />
                    <span>Enviar Foto</span>
                  </div>
                )}
              </Button>
              <Button
                variant="outline"
                onClick={clearSelection}
                disabled={isUploading}
                className="border-gray-600 text-gray-300 hover:bg-gray-700 hover:text-white"
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