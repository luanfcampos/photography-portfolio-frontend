import { API_CONFIG, apiRequest } from '../config/api'
import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Upload, X, CheckCircle, AlertCircle, Loader2, ImagePlus, Image, Trash2, Edit3 } from 'lucide-react'

function PhotoUpload({ onUploadSuccess }) {
  const [selectedFiles, setSelectedFiles] = useState([])
  const [previews, setPreviews] = useState([])
  const [globalSettings, setGlobalSettings] = useState({
    categoryId: '',
    workId: '',
    isFeatured: false
  })
  const [isUploading, setIsUploading] = useState(false)
  const [uploadStatus, setUploadStatus] = useState(null)
  const [uploadProgress, setUploadProgress] = useState({})
  const [categories] = useState([
    { id: 1, name: 'Ensaios' },
    { id: 2, name: 'Shows e Espetáculos' },
    { id: 3, name: 'Eventos' }
  ])
  const [works, setWorks] = useState([])

  // Carregar trabalhos disponíveis
  useEffect(() => {
    const loadWorks = async () => {
      try {
        const response = await apiRequest(API_CONFIG.ENDPOINTS.WORKS)
        if (response.ok) {
          const worksData = await response.json()
          setWorks(worksData)
        } else {
          console.error('Erro na resposta:', response.status, response.statusText)
        }
      } catch (error) {
        console.error('Erro ao carregar trabalhos:', error)
      }
    }
    
    loadWorks()
  }, [])

  const handleFileSelect = (event) => {
    const files = Array.from(event.target.files)
    if (files.length === 0) return

    const newFiles = files.map((file, index) => ({
      id: Date.now() + index,
      file: file,
      title: file.name.split('.')[0],
      description: '',
      // ✅ CORREÇÃO: Aplicar configurações globais apenas se estiverem definidas
      categoryId: globalSettings.categoryId && globalSettings.categoryId !== 'none' ? globalSettings.categoryId : '',
      workId: globalSettings.workId && globalSettings.workId !== 'none' ? globalSettings.workId : '',
      isFeatured: globalSettings.isFeatured
    }))

    setSelectedFiles(prev => [...prev, ...newFiles])

    // Criar previews
    files.forEach((file, index) => {
      const reader = new FileReader()
      reader.onload = (e) => {
        const fileId = Date.now() + index
        setPreviews(prev => [...prev, {
          id: fileId,
          url: e.target.result,
          name: file.name
        }])
      }
      reader.readAsDataURL(file)
    })

    // ✅ Limpar o input para permitir selecionar os mesmos arquivos novamente se necessário
    event.target.value = ''
  }

  const updateFileSettings = (fileId, field, value) => {
    setSelectedFiles(prev => 
      prev.map(file => 
        file.id === fileId 
          ? { ...file, [field]: value }
          : file
      )
    )
  }

  const removeFile = (fileId) => {
    setSelectedFiles(prev => prev.filter(file => file.id !== fileId))
    setPreviews(prev => prev.filter(preview => preview.id !== fileId))
  }

  // ✅ CORREÇÃO: Melhorar a aplicação das configurações globais
  const applyGlobalSettings = () => {
    setSelectedFiles(prev => 
      prev.map(file => ({
        ...file,
        // Aplicar configurações globais se estiverem definidas, senão manter as individuais
        categoryId: globalSettings.categoryId && globalSettings.categoryId !== 'none' && globalSettings.categoryId !== '' 
          ? globalSettings.categoryId 
          : file.categoryId,
        workId: globalSettings.workId && globalSettings.workId !== 'none' && globalSettings.workId !== '' 
          ? globalSettings.workId 
          : file.workId,
        isFeatured: globalSettings.isFeatured // Sempre aplicar o valor do checkbox
      }))
    )
    
    // ✅ Mostrar feedback visual
    setUploadStatus({ 
      type: 'success', 
      message: `Configurações aplicadas a ${selectedFiles.length} fotos!` 
    })
    
    // Limpar status após 3 segundos
    setTimeout(() => setUploadStatus(null), 3000)
  }

  // ✅ NOVA FUNÇÃO: Aplicar configurações automaticamente quando mudarem
  const handleGlobalSettingChange = (field, value) => {
    setGlobalSettings(prev => ({ ...prev, [field]: value }))
    
    // Se há fotos selecionadas, aplicar automaticamente
    if (selectedFiles.length > 0) {
      setSelectedFiles(prev => 
        prev.map(file => ({
          ...file,
          [field]: value && value !== 'none' ? value : (field === 'isFeatured' ? value : '')
        }))
      )
    }
  }

  const handleUpload = async () => {
    if (selectedFiles.length === 0) {
      setUploadStatus({ type: 'error', message: 'Selecione pelo menos uma foto' })
      return
    }

    setIsUploading(true)
    setUploadStatus(null)
    setUploadProgress({})

    const results = {
      success: [],
      failed: []
    }

    try {
      // Upload sequencial para evitar sobrecarga
      for (let i = 0; i < selectedFiles.length; i++) {
        const fileData = selectedFiles[i]
        
        setUploadProgress(prev => ({
          ...prev,
          [fileData.id]: { status: 'uploading', progress: 0 }
        }))

        try {
          const formData = new FormData()
          formData.append('photo', fileData.file)
          formData.append('title', fileData.title)
          formData.append('description', fileData.description)
          formData.append('category_id', fileData.categoryId && fileData.categoryId !== 'none' ? fileData.categoryId : '')
          formData.append('work_id', fileData.workId && fileData.workId !== 'none' ? fileData.workId : '')
          formData.append('is_featured', fileData.isFeatured)

          const response = await apiRequest(API_CONFIG.ENDPOINTS.PHOTOS, {
            method: "POST",
            body: formData
          })

          if (!response.ok) {
            const errorData = await response.json().catch(() => ({ error: 'Erro desconhecido' }))
            throw new Error(errorData.error || `HTTP ${response.status}`)
          }

          const result = await response.json()
          results.success.push({ ...result, originalTitle: fileData.title })
          
          setUploadProgress(prev => ({
            ...prev,
            [fileData.id]: { status: 'success', progress: 100 }
          }))

        } catch (error) {
          console.error(`Erro no upload da foto ${fileData.title}:`, error)
          results.failed.push({ 
            title: fileData.title, 
            error: error.message 
          })
          
          setUploadProgress(prev => ({
            ...prev,
            [fileData.id]: { status: 'error', progress: 0 }
          }))
        }
      }

      // Mostrar resultado final
      if (results.success.length > 0 && results.failed.length === 0) {
        setUploadStatus({ 
          type: 'success', 
          message: `${results.success.length} fotos enviadas com sucesso!` 
        })
      } else if (results.success.length > 0 && results.failed.length > 0) {
        setUploadStatus({ 
          type: 'warning', 
          message: `${results.success.length} fotos enviadas com sucesso, ${results.failed.length} falharam.` 
        })
      } else {
        setUploadStatus({ 
          type: 'error', 
          message: `Falha no envio de ${results.failed.length} fotos.` 
        })
      }

      // Callback para atualizar lista de fotos se houver sucessos
      if (results.success.length > 0 && onUploadSuccess) {
        onUploadSuccess(results.success)
      }

      // Limpar apenas as fotos que foram enviadas com sucesso
      if (results.success.length > 0) {
        const successIds = results.success.map((_, index) => {
          // Encontrar o ID da foto que foi enviada com sucesso
          return selectedFiles[index]?.id
        }).filter(Boolean)
        
        setSelectedFiles(prev => prev.filter(file => !successIds.includes(file.id)))
        setPreviews(prev => prev.filter(preview => !successIds.includes(preview.id)))
      }

    } catch (error) {
      console.error('Erro geral no upload:', error)
      setUploadStatus({
        type: 'error',
        message: 'Erro de conexão com o servidor'
      })
    } finally {
      setIsUploading(false)
    }
  }

  const clearForm = () => {
    setSelectedFiles([])
    setPreviews([])
    setGlobalSettings({
      categoryId: '',
      workId: '',
      isFeatured: false
    })
    setUploadStatus(null)
    setUploadProgress({})
  }

  const getPreview = (fileId) => {
    return previews.find(p => p.id === fileId)
  }

  return (
    <Card className="w-full bg-gray-800/80 backdrop-blur-sm border-gray-700">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2 text-white">
          <Upload className="h-5 w-5" />
          <span>Upload de Fotos</span>
        </CardTitle>
        <CardDescription className="text-gray-300">
          Adicione múltiplas fotos ao seu portfólio de uma vez
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {uploadStatus && (
          <div className={`flex items-center space-x-2 p-4 rounded-lg border ${
            uploadStatus.type === 'success' 
              ? 'bg-green-900/50 border-green-500 text-green-200'
              : uploadStatus.type === 'warning'
              ? 'bg-yellow-900/50 border-yellow-500 text-yellow-200'
              : 'bg-red-900/50 border-red-500 text-red-200'
          }`}>
            {uploadStatus.type === 'success' ? (
              <CheckCircle className="h-5 w-5 text-green-400 flex-shrink-0" />
            ) : uploadStatus.type === 'warning' ? (
              <AlertCircle className="h-5 w-5 text-yellow-400 flex-shrink-0" />
            ) : (
              <AlertCircle className="h-5 w-5 text-red-400 flex-shrink-0" />
            )}
            <span className="font-medium">{uploadStatus.message}</span>
          </div>
        )}

        {/* ✅ CONFIGURAÇÕES GLOBAIS - Movido para cima e melhorado */}
        <Card className="bg-blue-900/20 border-blue-600/50">
          <CardHeader>
            <CardTitle className="text-white text-lg">Configurações Padrão</CardTitle>
            <CardDescription className="text-blue-200">
              Configure valores que serão aplicados automaticamente a todas as fotos
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="global-category" className="text-white">Categoria Padrão</Label>
                <Select 
                  value={globalSettings.categoryId || 'none'} 
                  onValueChange={(value) => handleGlobalSettingChange('categoryId', value)}
                >
                  <SelectTrigger className="bg-gray-700/50 border-gray-600 text-white">
                    <SelectValue placeholder="Selecione uma categoria" />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-700 border-gray-600">
                    <SelectItem value="none" className="text-white hover:bg-gray-600">Nenhuma categoria</SelectItem>
                    {categories.map((category) => (
                      <SelectItem key={category.id} value={category.id.toString()} className="text-white hover:bg-gray-600">
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="global-work" className="text-white">Trabalho Padrão</Label>
                <Select 
                  value={globalSettings.workId || 'none'} 
                  onValueChange={(value) => handleGlobalSettingChange('workId', value)}
                >
                  <SelectTrigger className="bg-gray-700/50 border-gray-600 text-white">
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
            </div>

            <div className="flex items-center space-x-2 p-3 bg-gray-600/30 rounded-lg">
              <input
                type="checkbox"
                id="global-featured"
                checked={globalSettings.isFeatured}
                onChange={(e) => handleGlobalSettingChange('isFeatured', e.target.checked)}
                className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500"
              />
              <Label htmlFor="global-featured" className="text-white font-medium">
                Marcar todas como destaque
              </Label>
            </div>

            {selectedFiles.length > 0 && (
              <div className="p-3 bg-blue-800/20 rounded-lg border border-blue-600/30">
                <p className="text-blue-200 text-sm mb-2">
                  ✨ As configurações são aplicadas automaticamente quando você as altera
                </p>
                <Button
                  onClick={applyGlobalSettings}
                  variant="outline"
                  size="sm"
                  className="border-blue-500 text-blue-300 hover:bg-blue-600 hover:text-white"
                >
                  Reaplicar a Todas as Fotos
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="space-y-2">
          <Label htmlFor="photo-upload" className="text-white">Selecionar Fotos</Label>
          <div className="relative">
            <Input
              id="photo-upload"
              type="file"
              accept="image/*"
              multiple
              onChange={handleFileSelect}
              disabled={isUploading}
              className="bg-gray-700/50 border-gray-600 text-white file:bg-blue-600 file:border-0 file:text-white file:rounded-md file:px-3 file:py-1 file:mr-3 hover:file:bg-blue-700 focus:border-blue-500 focus:ring-blue-500"
            />
            <ImagePlus className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
          </div>
          <p className="text-sm text-gray-400">
            Selecione múltiplas fotos mantendo Ctrl/Cmd pressionado. As configurações padrão serão aplicadas automaticamente.
          </p>
        </div>

        {selectedFiles.length > 0 && (
          <div className="space-y-6">
            {/* Lista de Fotos Selecionadas */}
            <div className="space-y-4">
              <h3 className="text-white font-semibold text-lg">
                Fotos Selecionadas ({selectedFiles.length})
              </h3>
              
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {selectedFiles.map((fileData, index) => {
                  const preview = getPreview(fileData.id)
                  const progress = uploadProgress[fileData.id]
                  
                  return (
                    <Card key={fileData.id} className="bg-gray-700/50 border-gray-600">
                      <CardContent className="p-4">
                        <div className="flex gap-4">
                          {/* Preview da Imagem */}
                          <div className="relative flex-shrink-0">
                            {preview && (
                              <img
                                src={preview.url}
                                alt={fileData.title}
                                className="w-20 h-20 object-cover rounded-lg border border-gray-600"
                              />
                            )}
                            
                            {/* Status do Upload */}
                            {progress && (
                              <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-lg">
                                {progress.status === 'uploading' && (
                                  <Loader2 className="h-6 w-6 animate-spin text-blue-400" />
                                )}
                                {progress.status === 'success' && (
                                  <CheckCircle className="h-6 w-6 text-green-400" />
                                )}
                                {progress.status === 'error' && (
                                  <AlertCircle className="h-6 w-6 text-red-400" />
                                )}
                              </div>
                            )}

                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => removeFile(fileData.id)}
                              disabled={isUploading}
                              className="absolute -top-2 -right-2 h-6 w-6 p-0 bg-red-600 border-red-500 text-white hover:bg-red-700"
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </div>

                          {/* Configurações da Foto */}
                          <div className="flex-1 space-y-3">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                              <div>
                                <Label className="text-white text-sm">Título</Label>
                                <Input
                                  value={fileData.title}
                                  onChange={(e) => updateFileSettings(fileData.id, 'title', e.target.value)}
                                  disabled={isUploading}
                                  className="bg-gray-700/50 border-gray-600 text-white text-sm h-8"
                                  placeholder="Título da foto"
                                />
                              </div>

                              <div>
                                <Label className="text-white text-sm">Categoria</Label>
                                <Select 
                                  value={fileData.categoryId || 'none'} 
                                  onValueChange={(value) => updateFileSettings(fileData.id, 'categoryId', value === 'none' ? '' : value)}
                                  disabled={isUploading}
                                >
                                  <SelectTrigger className="bg-gray-700/50 border-gray-600 text-white text-sm h-8">
                                    <SelectValue placeholder="Categoria" />
                                  </SelectTrigger>
                                  <SelectContent className="bg-gray-700 border-gray-600">
                                    <SelectItem value="none" className="text-white hover:bg-gray-600">Nenhuma</SelectItem>
                                    {categories.map((category) => (
                                      <SelectItem key={category.id} value={category.id.toString()} className="text-white hover:bg-gray-600">
                                        {category.name}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                            </div>

                            <div>
                              <Label className="text-white text-sm">Descrição</Label>
                              <Textarea
                                value={fileData.description}
                                onChange={(e) => updateFileSettings(fileData.id, 'description', e.target.value)}
                                disabled={isUploading}
                                className="bg-gray-700/50 border-gray-600 text-white text-sm min-h-16"
                                placeholder="Descrição da foto"
                              />
                            </div>

                            <div className="flex items-center space-x-4">
                              <div className="flex items-center space-x-2">
                                <input
                                  type="checkbox"
                                  id={`featured-${fileData.id}`}
                                  checked={fileData.isFeatured}
                                  onChange={(e) => updateFileSettings(fileData.id, 'isFeatured', e.target.checked)}
                                  disabled={isUploading}
                                  className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded"
                                />
                                <Label htmlFor={`featured-${fileData.id}`} className="text-white text-sm">
                                  Destaque
                                </Label>
                              </div>

                              <div className="flex-1">
                                <Select 
                                  value={fileData.workId || 'none'} 
                                  onValueChange={(value) => updateFileSettings(fileData.id, 'workId', value === 'none' ? '' : value)}
                                  disabled={isUploading}
                                >
                                  <SelectTrigger className="bg-gray-700/50 border-gray-600 text-white text-sm h-8">
                                    <SelectValue placeholder="Trabalho" />
                                  </SelectTrigger>
                                  <SelectContent className="bg-gray-700 border-gray-600">
                                    <SelectItem value="none" className="text-white hover:bg-gray-600">Nenhum</SelectItem>
                                    {works.map((work) => (
                                      <SelectItem key={work.id} value={work.id.toString()} className="text-white hover:bg-gray-600">
                                        {work.title}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            </div>

            {/* Botões de Ação */}
            <div className="flex space-x-3 pt-4 border-t border-gray-600">
              <Button
                onClick={handleUpload}
                disabled={isUploading || selectedFiles.some(f => !f.title.trim())}
                className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 disabled:from-gray-600 disabled:to-gray-700 text-white font-semibold"
              >
                {isUploading ? (
                  <div className="flex items-center space-x-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Enviando {selectedFiles.length} fotos...</span>
                  </div>
                ) : (
                  <div className="flex items-center space-x-2">
                    <Upload className="h-4 w-4" />
                    <span>Enviar {selectedFiles.length} Fotos</span>
                  </div>
                )}
              </Button>
              <Button
                variant="outline"
                onClick={clearForm}
                disabled={isUploading}
                className="border-gray-600 text-gray-300 hover:bg-gray-700 hover:text-white"
              >
                Limpar Tudo
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export default PhotoUpload
