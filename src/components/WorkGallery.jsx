import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowLeft, X, ChevronLeft, ChevronRight, Camera } from 'lucide-react'

function WorkGallery() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [work, setWork] = useState(null)
  const [photos, setPhotos] = useState([])
  const [selectedImage, setSelectedImage] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadWorkData = async () => {
      try {
        // Carregar dados do trabalho
        const worksResponse = await fetch(`${import.meta.env.VITE_API_URL}/api/works`)
        if (worksResponse.ok) {
          const works = await worksResponse.json()
          const currentWork = works.find(w => w.id === parseInt(id))
          setWork(currentWork)
        }

        // Carregar fotos do trabalho
        const photosResponse = await fetch(`${import.meta.env.VITE_API_URL}/api/works/${id}/photos`)
        if (photosResponse.ok) {
          const photosData = await photosResponse.json()
          setPhotos(photosData)
        }
      } catch (error) {
        console.error('Erro ao carregar dados do trabalho:', error)
      } finally {
        setLoading(false)
      }
    }

    if (id) {
      loadWorkData()
    }
  }, [id])

  const openModal = (photo) => {
    setSelectedImage(photo)
  }

  const closeModal = () => {
    setSelectedImage(null)
  }

  const navigateImage = (direction) => {
    if (!selectedImage) return
    
    const currentIndex = photos.findIndex(photo => photo.id === selectedImage.id)
    let newIndex
    
    if (direction === 'next') {
      newIndex = (currentIndex + 1) % photos.length
    } else {
      newIndex = currentIndex === 0 ? photos.length - 1 : currentIndex - 1
    }
    
    setSelectedImage(photos[newIndex])
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-black"></div>
          <p className="mt-4 text-gray-600">Carregando galeria...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="fixed top-0 w-full bg-white/95 backdrop-blur-sm z-40 border-b border-gray-100">
        <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <button
              onClick={() => navigate('/')}
              className="flex items-center space-x-2 text-gray-700 hover:text-black transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
              <span>Voltar ao Portfólio</span>
            </button>
            
            <div className="flex items-center space-x-2">
              <Camera className="h-8 w-8 text-black" />
              <span className="text-xl font-bold text-black">Luan Ferreira</span>
            </div>
          </div>
        </nav>
      </header>

      {/* Conteúdo Principal */}
      <main className="pt-20 pb-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Cabeçalho do Trabalho */}
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              {work?.title || 'Galeria do Trabalho'}
            </h1>
            {work?.description && (
              <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                {work.description}
              </p>
            )}
            <div className="mt-4 flex justify-center items-center space-x-4 text-sm text-gray-500">
              {work?.category_name && (
                <span className="bg-gray-100 px-3 py-1 rounded-full">
                  {work.category_name}
                </span>
              )}
              <span>{photos.length} fotos</span>
            </div>
          </div>

          {/* Grid de Fotos */}
          {photos.length === 0 ? (
            <div className="text-center py-12">
              <Camera className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">Nenhuma foto encontrada neste trabalho.</p>
            </div>
          ) : (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
            >
              {photos.map((photo, index) => (
                <motion.div
                  key={photo.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                  className="group cursor-pointer"
                  onClick={() => openModal(photo)}
                >
                  <div className="relative overflow-hidden rounded-lg aspect-square">
                    <img
                      src={photo.url}
                      alt={photo.title}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300"></div>
                    
                    {/* Título da foto no hover */}
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <h3 className="text-white font-medium text-sm">{photo.title}</h3>
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}
        </div>
      </main>

      {/* Modal/Lightbox */}
      {selectedImage && (
        <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="relative max-w-4xl max-h-full"
          >
            <img
              src={selectedImage.url}
              alt={selectedImage.title}
              className="max-w-full max-h-full object-contain"
            />
            
            {/* Controles do Modal */}
            <button
              onClick={closeModal}
              className="absolute top-4 right-4 text-white hover:text-gray-300 transition-colors"
            >
              <X className="h-8 w-8" />
            </button>
            
            {photos.length > 1 && (
              <>
                <button
                  onClick={() => navigateImage('prev')}
                  className="absolute left-4 top-1/2 transform -translate-y-1/2 text-white hover:text-gray-300 transition-colors"
                >
                  <ChevronLeft className="h-8 w-8" />
                </button>
                
                <button
                  onClick={() => navigateImage('next')}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 text-white hover:text-gray-300 transition-colors"
                >
                  <ChevronRight className="h-8 w-8" />
                </button>
              </>
            )}
            
            {/* Informações da imagem */}
            <div className="absolute bottom-4 left-4 text-white">
              <h3 className="text-lg font-semibold">{selectedImage.title}</h3>
              {selectedImage.description && (
                <p className="text-sm text-gray-300 mt-1">{selectedImage.description}</p>
              )}
            </div>
            
            {/* Contador de fotos */}
            <div className="absolute bottom-4 right-4 text-white text-sm">
              {photos.findIndex(p => p.id === selectedImage.id) + 1} / {photos.length}
            </div>
          </motion.div>
        </div>
      )}
    </div>
  )
}

export default WorkGallery

