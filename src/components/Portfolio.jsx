import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Camera, Mail, Instagram, X, ChevronLeft, ChevronRight } from 'lucide-react'
import { API_CONFIG, apiRequest } from '../config/api'
import WhatsAppFloatingButton from './WhatsAppFloatingButton'
import aboutImage from '../assets/portrait1.jpg';

function Portfolio() {
  const navigate = useNavigate()
  const [activeFilter, setActiveFilter] = useState('todos')
  const [selectedImage, setSelectedImage] = useState(null)
  const [photos, setPhotos] = useState([])
  const [works, setWorks] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    message: ''
  })
  const [formStatus, setFormStatus] = useState({
    isSubmitting: false,
    success: null,
    error: null
  })

  const selectFeaturedWorkPhotos = (workPhotos) => {
    if (!workPhotos || workPhotos.length === 0) return [];
    
    const featuredPhotos = workPhotos.filter(photo => photo.is_featured || photo.is_highlight || photo.highlighted);
    
    return featuredPhotos;
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true)
      setError(null)

      try {
        const worksResponse = await apiRequest(API_CONFIG.ENDPOINTS.WORKS);

        if (worksResponse.ok) {
          const worksData = await worksResponse.json();
          setWorks(worksData);

          const allFeaturedPhotos = [];
          
          for (const work of worksData) {
            try {
              const workPhotosResponse = await apiRequest(`${API_CONFIG.ENDPOINTS.WORKS}/${work.id}/photos`);
              
              let featuredWorkPhotos = [];
              
              if (workPhotosResponse.ok) {
                const workPhotosData = await workPhotosResponse.json();
                
                const selectedFeaturedPhotos = selectFeaturedWorkPhotos(workPhotosData);
                
                featuredWorkPhotos = selectedFeaturedPhotos.map((photo, index) => ({
                  id: `work-${work.id}-photo-${photo.id}`,
                  title: selectedFeaturedPhotos.length > 1 ? `${work.title} (${index + 1})` : work.title,
                  url: photo.url || photo.photo_url,
                  category_slug: work.category_slug,
                  work_id: work.id,
                  photo_id: photo.id,
                  is_featured: photo.is_featured || photo.is_highlight || photo.highlighted,
                  order: photo.order || index,
                  total_photos: workPhotosData.length,
                  type: 'work'
                }));
              } else if (workPhotosResponse.status === 404) {
                // Work existe mas não tem fotos - apenas log, não quebra
                console.info(`Work ${work.id} não tem fotos disponíveis (404)`);
              } else {
                // Outros erros - log mas continua
                console.warn(`Erro ao carregar fotos do trabalho ${work.id}:`, workPhotosResponse.status);
              }
              
              allFeaturedPhotos.push(...featuredWorkPhotos);
              
            } catch (workError) {
              // Log do erro mas não quebra o carregamento
              console.warn(`Erro ao carregar fotos do trabalho ${work.id}:`, workError.message);
              continue; // Pula para o próximo work
            }
          }

          setPhotos(allFeaturedPhotos);

          // Categorias baseadas nas fotos que realmente carregaram
          const uniqueCategories = [
            ...new Set(allFeaturedPhotos.map(photo => photo.category_slug).filter(Boolean))
          ];
          setCategories(uniqueCategories);

          // Se não tem fotos em destaque dos works, tenta fotos individuais
          if (allFeaturedPhotos.length === 0) {
            try {
              const photosResponse = await apiRequest(API_CONFIG.ENDPOINTS.PHOTOS);

              if (photosResponse.ok) {
                const photosData = await photosResponse.json();

                const featuredIndividualPhotos = photosData.filter(photo => photo.is_featured === true);

                const individualPhotos = featuredIndividualPhotos.map(photo => ({
                  ...photo,
                  id: `photo-${photo.id}`,
                  type: 'photo'
                }));

                setPhotos(individualPhotos);

                const uniqueCategories = [
                  ...new Set(individualPhotos.map(photo => photo.category_slug).filter(Boolean))
                ];
                setCategories(uniqueCategories);
              }
            } catch (photosError) {
              console.warn('Erro ao carregar fotos individuais:', photosError.message);
            }
          }

        } else {
          throw new Error(`Falha ao carregar trabalhos: ${worksResponse.status}`);
        }
      } catch (error) {
        console.error('Erro detalhado ao carregar dados:', error);
        setError(error.message);

        // Fallback photos (dados de exemplo)
        const fallbackPhotos = [
          {
            id: 'fallback-1',
            title: 'Ensaio Natural',
            url: aboutImage,
            category_slug: 'ensaios',
            work_id: null, // Sem work_id para evitar navegação
            is_featured: true,
            type: 'photo'
          },
          {
            id: 'fallback-2',
            title: 'Fotografia Profissional',
            url: aboutImage,
            category_slug: 'performances',
            work_id: null,
            is_featured: true,
            type: 'photo'
          }
        ];

        setPhotos(fallbackPhotos);
        setCategories(['ensaios', 'performances']);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const filteredPhotos = activeFilter === 'todos'
    ? photos
    : photos.filter(photo => photo.category_slug === activeFilter)

  const scrollToSection = (sectionId) => {
    const element = document.getElementById(sectionId)
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' })
    }
  }

  const openWorkGallery = (photo) => {
    // Se não tem work_id ou se for foto de fallback, abre modal
    if (!photo.work_id || photo.id.startsWith('fallback-')) {
      setSelectedImage(photo)
      return;
    }
    
    try {
      navigate(`/work/${photo.work_id}`)
    } catch (navError) {
      console.warn('Erro na navegação, abrindo modal:', navError);
      setSelectedImage(photo)
    }
  }

  const closeModal = () => {
    setSelectedImage(null)
  }

  const navigateImage = (direction) => {
    if (!selectedImage) return

    const currentIndex = filteredPhotos.findIndex(photo => photo.id === selectedImage.id)
    let newIndex

    if (direction === 'next') {
      newIndex = (currentIndex + 1) % filteredPhotos.length
    } else {
      newIndex = currentIndex === 0 ? filteredPhotos.length - 1 : currentIndex - 1
    }

    setSelectedImage(filteredPhotos[newIndex])
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormStatus({ isSubmitting: true, success: null, error: null });

    try {
      if (!formData.name || !formData.email || !formData.message) {
        throw new Error('Todos os campos são obrigatórios');
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email)) {
        throw new Error('Por favor, insira um email válido');
      }

      const response = await apiRequest('/api/contact', {
        method: 'POST',
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        const responseData = await response.json();

        setFormStatus({
          isSubmitting: false,
          success: responseData.message || 'Mensagem enviada com sucesso!',
          error: null
        });
        setFormData({ name: '', email: '', message: '' });
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Falha ao enviar mensagem');
      }
    } catch (error) {
      setFormStatus({
        isSubmitting: false,
        success: null,
        error: error.message || 'Falha ao enviar mensagem'
      });
    }
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="fixed top-0 w-full bg-white/95 backdrop-blur-sm z-40 border-b border-gray-100">
        <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <Camera className="h-8 w-8 text-black" />
              <span className="text-xl font-bold text-black">Luan Ferreira</span>
            </div>

            <div className="hidden md:flex space-x-8">
              <button
                onClick={() => scrollToSection('home')}
                className="text-gray-700 hover:text-black transition-colors"
              >
                Home
              </button>
              <button
                onClick={() => scrollToSection('galeria')}
                className="text-gray-700 hover:text-black transition-colors"
              >
                Galeria
              </button>
              <button
                onClick={() => scrollToSection('sobre')}
                className="text-gray-700 hover:text-black transition-colors"
              >
                Sobre
              </button>
              <button
                onClick={() => scrollToSection('contato')}
                className="text-gray-700 hover:text-black transition-colors"
              >
                Contato
              </button>
            </div>
          </div>
        </nav>
      </header>

      {/* Hero Section */}
      <section id="home" className="relative h-screen flex items-center justify-center bg-[url('/src/assets/portrait2.jpg')] bg-center bg-cover text-white">
        <div className="absolute inset-0 bg-black/40"></div>
        <div className="relative z-10 text-center max-w-4xl mx-auto px-4">
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-5xl md:text-7xl font-bold mb-6"
          >
            Capturando Momentos
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-xl md:text-2xl mb-8 text-gray-300"
          >
            Fotografia profissional que conta histórias únicas
          </motion.p>
          <motion.button
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            onClick={() => scrollToSection('galeria')}
            className="bg-white text-black px-8 py-3 rounded-full font-semibold hover:bg-gray-100 transition-colors"
          >
            Ver Portfólio
          </motion.button>
        </div>
      </section>

      {/* Galeria */}
      <section id="galeria" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Meu Trabalho</h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Uma seleção das fotos em destaque dos meus trabalhos, capturando momentos únicos e emoções autênticas.
            </p>
          </div>

          {/* Filtros - Melhorados para mostrar apenas categorias não vazias */}
          <div className="flex justify-center mb-12">
            <div className="flex flex-wrap justify-center gap-2 bg-gray-100 p-1 rounded-full">
              <button
                onClick={() => setActiveFilter('todos')}
                className={`px-6 py-2 rounded-full transition-all ${
                  activeFilter === 'todos'
                    ? 'bg-black text-white'
                    : 'text-gray-600 hover:text-black'
                }`}
              >
                Todos ({photos.length})
              </button>
              {/* Filtrar apenas categorias que têm fotos */}
              {categories
                .map(category => ({
                  slug: category,
                  count: photos.filter(photo => photo.category_slug === category).length
                }))
                .filter(category => category.count > 0) // Só categorias com fotos
                .map(({ slug, count }) => (
                  <button
                    key={slug}
                    onClick={() => setActiveFilter(slug)}
                    className={`px-6 py-2 rounded-full transition-all capitalize ${
                      activeFilter === slug
                        ? 'bg-black text-white'
                        : 'text-gray-600 hover:text-black'
                    }`}
                  >
                    {slug} ({count})
                  </button>
                ))
              }
            </div>
          </div>

          {/* Grid de Fotos */}
          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-black"></div>
              <p className="mt-4 text-gray-600">Carregando fotos em destaque...</p>
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded mb-4 max-w-md mx-auto">
                <p className="font-bold">Problema de conexão com a API</p>
                <p className="text-sm">{error}</p>
                <p className="text-sm mt-2">Exibindo dados de exemplo.</p>
              </div>
            </div>
          ) : null}

          {!loading && (
            <motion.div
              layout
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            >
              {filteredPhotos.map((photo) => (
                <motion.div
                  key={photo.id}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.3 }}
                  className="group cursor-pointer"
                  onClick={() => openWorkGallery(photo)}
                >
                  <div className="relative overflow-hidden rounded-lg aspect-square bg-gray-100">
                    <img
                      src={photo.url}
                      alt={photo.title}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                      onError={(e) => {
                        e.target.style.display = 'none';
                        const placeholder = e.target.parentElement.querySelector('.placeholder');
                        if (placeholder) {
                          placeholder.style.display = 'flex';
                        }
                      }}
                    />

                    <div className="placeholder absolute inset-0 bg-gray-200 flex-col items-center justify-center text-gray-500 hidden">
                      <Camera className="h-12 w-12 mb-2" />
                      <p className="text-sm text-center px-2">Erro ao carregar imagem</p>
                    </div>

                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300"></div>

                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <h3 className="text-white font-medium">{photo.title}</h3>
                      <p className="text-white/80 text-sm">
                        {photo.work_id && !photo.id.startsWith('fallback-') ? 'Clique para ver galeria completa' : 'Clique para ampliar'}
                      </p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}

          {filteredPhotos.length === 0 && !loading && (
            <div className="text-center py-12">
              <Camera className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">Nenhuma foto em destaque encontrada nesta categoria.</p>
              <button
                onClick={() => setActiveFilter('todos')}
                className="mt-4 text-blue-600 hover:text-blue-800 underline"
              >
                Ver todas as fotos em destaque
              </button>
            </div>
          )}
        </div>
      </section>

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

            <button
              onClick={closeModal}
              className="absolute top-4 right-4 text-white hover:text-gray-300 transition-colors"
            >
              <X className="h-8 w-8" />
            </button>

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

            <div className="absolute bottom-4 left-4 text-white">
              <h3 className="text-lg font-semibold">{selectedImage.title}</h3>
            </div>
          </motion.div>
        </div>
      )}

      {/* Seção Sobre */}
      <section id="sobre" className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-4xl font-bold text-gray-900 mb-6">Sobre Mim</h2>
              <p className="text-lg text-gray-600 mb-6">
                Sou um fotógrafo movido pela missão de transformar momentos em memórias eternas. Com mais de seis anos de experiência, dedico-me a criar imagens autênticas e cheias de significado, seja em ensaios fotográficos ou na fotografia de Performances.
              </p>
              <p className="text-lg text-gray-600 mb-8">
                Minha abordagem vai além do registro: busco contar histórias, revelar emoções e capturar a essência única de cada pessoa, objeto ou situação. Acredito que uma boa fotografia não só documenta um instante, mas também evoca sentimentos e cria laços que permanecem no tempo.
              </p>
               <p className="text-lg text-gray-600 mb-8">
               Meu trabalho é guiado pela paixão por conectar pessoas através de imagens e pela constante busca por ângulos, luzes e perspectivas que inspirem e emocionem.
              </p>
              <div className="flex space-x-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-black">5000+</div>
                  <div className="text-sm text-gray-600">Fotos</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-black">100+</div>
                  <div className="text-sm text-gray-600">Ensaios</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-black">6+</div>
                  <div className="text-sm text-gray-600">Anos</div>
                </div>
              </div>
            </div>
            <div className="relative">
              <img
                src={aboutImage}
                alt="Sobre o fotógrafo"
                className="rounded-lg shadow-2xl"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Seção Contato */}
      <section id="contato" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Entre em Contato</h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Pronto para capturar seus momentos especiais? Vamos conversar sobre seu próximo projeto.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            <div>
              <h3 className="text-2xl font-semibold text-gray-900 mb-6">Informações de Contato</h3>
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <Mail className="h-5 w-5 text-gray-600" />
                  <span className="text-gray-700">lfcampos.photos@gmail.com</span>
                </div>
                <div className="flex items-center space-x-3">
                  <Camera className="h-5 w-5 text-gray-600" />
                  <span className="text-gray-700">+55 (31) 93301-4291</span>
                </div>
              </div>

              <div className="mt-8">
                <h4 className="text-lg font-semibold text-gray-900 mb-4">Redes Sociais</h4>
                <div className="flex space-x-4">
                  <a href="https://www.instagram.com/luanferreira.foto/" target="_blank" className="text-gray-600 hover:text-black transition-colors">
                    <Instagram className="h-6 w-6" />
                  </a>
                </div>
              </div>
            </div>

            <div>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                    Nome
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                    placeholder="Seu nome"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                    placeholder="seu@email.com"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-2">
                    Mensagem
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    value={formData.message}
                    onChange={handleInputChange}
                    rows={4}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                    placeholder="Conte-me sobre seu projeto..."
                    required
                  ></textarea>
                </div>
                <button
                  type="submit"
                  disabled={formStatus.isSubmitting}
                  className="w-full bg-black text-white py-3 px-6 rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {formStatus.isSubmitting ? 'Enviando...' : 'Enviar Mensagem'}
                </button>
              </form>

              {formStatus.success && (
                <div className="mt-4 p-4 bg-green-100 border border-green-400 text-green-700 rounded">
                  <div className="flex items-center">
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                    </svg>
                    <span>{formStatus.success}</span>
                  </div>
                </div>
              )}

              {formStatus.error && (
                <div className="mt-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
                  <div className="flex items-center">
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                    </svg>
                    <span>{formStatus.error}</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="flex items-center justify-center space-x-2 mb-4">
              <Camera className="h-8 w-8" />
              <span className="text-xl font-bold">Luan Ferreira</span>
            </div>
            <p className="text-gray-400 mb-6">
              Fotógrafo profissional especializado em retratos e eventos
            </p>
            <div className="flex justify-center space-x-6">
              <a href="https://www.instagram.com/luanferreira.foto/" target="_blank" className="text-gray-600 hover:text-white transition-colors">
                <Instagram className="h-5 w-5" />
              </a>
            </div>
            <div className="mt-8 pt-8 border-t border-gray-800 text-gray-400 text-sm">
              © 2025 Luan Ferreira. Todos os direitos reservados.
            </div>
          </div>
        </div>
      </footer>
      <WhatsAppFloatingButton />
    </div>
  )
}

export default Portfolio