import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Camera, Mail, Instagram, Facebook, Twitter, X, ChevronLeft, ChevronRight } from 'lucide-react'
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

  // Função para selecionar APENAS fotos em destaque de um trabalho
  const selectFeaturedWorkPhotos = (workPhotos) => {
    if (!workPhotos || workPhotos.length === 0) return [];
    
    // Filtrar apenas fotos marcadas como destaque/highlight
    const featuredPhotos = workPhotos.filter(photo => photo.is_featured || photo.is_highlight || photo.highlighted);
    
    console.log(`Trabalho tem ${workPhotos.length} fotos, ${featuredPhotos.length} em destaque`);
    
    return featuredPhotos;
  };

  // Carregar fotos e trabalhos da API
  useEffect(() => {
    const loadData = async () => {
      setLoading(true)
      setError(null)

      try {
        console.log('Carregando dados da API:', API_CONFIG.BASE_URL);

        // Carregar trabalhos
        const worksResponse = await apiRequest(API_CONFIG.ENDPOINTS.WORKS);

        if (worksResponse.ok) {
          const worksData = await worksResponse.json();
          console.log('Trabalhos carregados:', worksData);
          setWorks(worksData);

          // Para cada trabalho, carregar suas fotos E FILTRAR apenas as em destaque
          const allFeaturedPhotos = [];
          
          for (const work of worksData) {
            try {
              // Carregar fotos específicas do trabalho
              const workPhotosResponse = await apiRequest(`${API_CONFIG.ENDPOINTS.WORKS}/${work.id}/photos`);
              
              let featuredWorkPhotos = [];
              
              if (workPhotosResponse.ok) {
                const workPhotosData = await workPhotosResponse.json();
                console.log(`Fotos do trabalho ${work.id} carregadas:`, workPhotosData);
                
                // Selecionar APENAS fotos em destaque deste trabalho
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
              } else {
                console.warn(`Não foi possível carregar fotos do trabalho ${work.id}`);
              }
              
              allFeaturedPhotos.push(...featuredWorkPhotos);
              
            } catch (workError) {
              console.warn(`Erro ao carregar fotos do trabalho ${work.id}:`, workError);
            }
          }

          console.log('Total de fotos em destaque selecionadas:', allFeaturedPhotos);
          setPhotos(allFeaturedPhotos);

          // Extrair categorias únicas dos trabalhos
          const uniqueCategories = [
            ...new Set(worksData.map(work => work.category_slug).filter(Boolean))
          ];
          console.log('Categorias encontradas:', uniqueCategories);
          setCategories(uniqueCategories);

          // Se não temos fotos em destaque dos trabalhos, tentar carregar fotos individuais em destaque
          if (allFeaturedPhotos.length === 0) {
            console.log('Nenhuma foto em destaque de trabalhos encontrada, carregando fotos individuais...');
            const photosResponse = await apiRequest(API_CONFIG.ENDPOINTS.PHOTOS);

            if (photosResponse.ok) {
              const photosData = await photosResponse.json();
              console.log('Fotos individuais carregadas:', photosData);

              // Filtrar apenas fotos individuais marcadas como destaque
              const featuredIndividualPhotos = photosData.filter(photo => photo.is_featured === true);

              const individualPhotos = featuredIndividualPhotos.map(photo => ({
                ...photo,
                id: `photo-${photo.id}`,
                type: 'photo'
              }));

              setPhotos(individualPhotos);

              const uniqueCategories = [
                ...new Set(featuredIndividualPhotos.map(photo => photo.category_slug).filter(Boolean))
              ];
              setCategories(uniqueCategories);
            }
          }

        } else {
          throw new Error('Falha ao carregar trabalhos');
        }
      } catch (error) {
        console.error('Erro detalhado ao carregar dados:', error);
        setError(error.message);

        // Fallback para dados locais caso a API falhe
        console.log('Usando dados de fallback...');
        const fallbackPhotos = [
          {
            id: 'fallback-1',
            title: 'Ensaio Natural',
            url: aboutImage,
            category_slug: 'ensaios',
            work_id: 1,
            is_featured: true,
            type: 'work'
          },
          {
            id: 'fallback-2',
            title: 'Fotografia Profissional',
            url: aboutImage,
            category_slug: 'retratos',
            work_id: 2,
            is_featured: true,
            type: 'work'
          }
        ];

        setPhotos(fallbackPhotos);
        setCategories(['ensaios', 'retratos']);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // Log para debug
  useEffect(() => {
    console.log('Estado atual:');
    console.log('- API Base URL:', API_CONFIG.BASE_URL);
    console.log('- Loading:', loading);
    console.log('- Error:', error);
    console.log('- Featured Photos:', photos);
    console.log('- Categories:', categories);
    console.log('- Active Filter:', activeFilter);
    console.log('- LÓGICA: Mostrando APENAS fotos em destaque de cada trabalho, mas mantendo navegação para galeria completa');
  }, [loading, error, photos, categories, activeFilter]);

  // Filtrar fotos baseado no filtro ativo
  const filteredPhotos = activeFilter === 'todos'
    ? photos
    : photos.filter(photo => photo.category_slug === activeFilter)

  console.log('Fotos em destaque filtradas:', filteredPhotos);

  const scrollToSection = (sectionId) => {
    const element = document.getElementById(sectionId)
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' })
    }
  }

  const openWorkGallery = (photo) => {
    console.log('Tentando abrir galeria para:', photo);
    console.log('Photo details:', {
      id: photo.id,
      work_id: photo.work_id,
      type: photo.type,
      title: photo.title
    });

    // Verificação melhorada - trabalhar com work_id se existir
    if (photo.work_id) {
      console.log('Navegando para work gallery:', photo.work_id);
      try {
        navigate(`/work/${photo.work_id}`)
      } catch (navError) {
        console.error('Erro na navegação:', navError);
        // Fallback para modal
        setSelectedImage(photo)
      }
    } else {
      console.log('Abrindo modal (sem work_id)');
      // Fallback para modal se não houver work_id
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
      console.log('Enviando mensagem de contato:', formData);

      // Validação adicional
      if (!formData.name || !formData.email || !formData.message) {
        throw new Error('Todos os campos são obrigatórios');
      }

      // Validação de email
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
        console.log('Resposta do servidor:', responseData);

        // Limpar formulário e mostrar mensagem de sucesso
        setFormStatus({
          isSubmitting: false,
          success: responseData.message || 'Mensagem enviada com sucesso!',
          error: null
        });
        setFormData({ name: '', email: '', message: '' });

        console.log('Mensagem enviada com sucesso:', responseData);
      } else {
        const errorData = await response.json();
        console.error('Erro do servidor:', errorData);

        // Lançar erro com mensagem do servidor ou padrão
        throw new Error(errorData.error || 'Falha ao enviar mensagem');
      }
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error);

      // Atualizar estado com mensagem de erro
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

          {/* Debug Info */}
          {import.meta.env.DEV && (
            <div className="mb-8 p-4 bg-gray-100 rounded-lg text-sm text-gray-700">
              <p><strong>Debug Info:</strong></p>
              <p>API URL: {API_CONFIG.BASE_URL}</p>
              <p>Loading: {loading ? 'Sim' : 'Não'}</p>
              <p>Error: {error || 'Nenhum'}</p>
              <p>Featured Photos: {photos.length}</p>
              <p>Filtered Photos: {filteredPhotos.length}</p>
              <p>Categories: {categories.join(', ') || 'Nenhuma'}</p>
              <p>Photos with work_id: {photos.filter(p => p.work_id).length}</p>
              <p><strong>LÓGICA: Mostrando apenas fotos EM DESTAQUE de cada trabalho, mas mantendo navegação para galeria completa</strong></p>
            </div>
          )}

          {/* Filtros */}
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
              {categories.map((category) => {
                const categoryCount = photos.filter(photo => photo.category_slug === category).length;
                return (
                  <button
                    key={category}
                    onClick={() => setActiveFilter(category)}
                    className={`px-6 py-2 rounded-full transition-all capitalize ${
                      activeFilter === category
                        ? 'bg-black text-white'
                        : 'text-gray-600 hover:text-black'
                    }`}
                  >
                    {category} ({categoryCount})
                  </button>
                );
              })}
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

          {/* Grid sempre exibe, mesmo com erro (usando fallback) */}
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
                  onClick={() => {
                    console.log('Clique na foto em destaque:', photo);
                    openWorkGallery(photo);
                  }}
                >
                  <div className="relative overflow-hidden rounded-lg aspect-square bg-gray-100">
                    <img
                      src={photo.url}
                      alt={photo.title}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                      onLoad={() => console.log('Imagem em destaque carregada:', photo.url)}
                      onError={(e) => {
                        console.error('Erro ao carregar imagem em destaque:', photo.url);
                        // Placeholder mais elegante
                        e.target.style.display = 'none';
                        const placeholder = e.target.parentElement.querySelector('.placeholder');
                        if (placeholder) {
                          placeholder.style.display = 'flex';
                        }
                      }}
                    />

                    {/* Placeholder para erro de carregamento */}
                    <div className="placeholder absolute inset-0 bg-gray-200 flex-col items-center justify-center text-gray-500 hidden">
                      <Camera className="h-12 w-12 mb-2" />
                      <p className="text-sm text-center px-2">Erro ao carregar imagem</p>
                    </div>

                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300"></div>

                    {/* Badge de destaque */}
                    {photo.is_featured && (
                      <div className="absolute top-3 right-3 bg-gradient-to-r from-yellow-500 to-amber-500 text-black text-xs px-2 py-1 rounded-full font-semibold flex items-center space-x-1">
                        <span className="text-yellow-800">★</span>
                        <span>Destaque</span>
                      </div>
                    )}

                    {/* Título no hover */}
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <h3 className="text-white font-medium">{photo.title}</h3>
                      <p className="text-white/80 text-sm">
                        {photo.work_id ? 'Clique para ver galeria completa' : 'Clique para ampliar'}
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
              <p className="text-gray-400 text-sm mt-2">
                Marque fotos como destaque no gerenciador para que apareçam aqui.
              </p>
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

            {/* Controles do Modal */}
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

            {/* Título da imagem */}
            <div className="absolute bottom-4 left-4 text-white">
              <h3 className="text-lg font-semibold">{selectedImage.title}</h3>
              {/* Info adicional para debug */}
              {import.meta.env.DEV && (
                <p className="text-sm text-gray-300">
                  ID: {selectedImage.id} | Work ID: {selectedImage.work_id || 'N/A'} | Type: {selectedImage.type} | Featured: {selectedImage.is_featured ? 'Sim' : 'Não'}
                </p>
              )}
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
                Sou um fotógrafo movido pela missão de transformar momentos em memórias eternas. Com mais de seis anos de experiência, dedico-me a criar imagens autênticas e cheias de significado, seja em ensaios fotográficos ou na fotografia de Shows e Espetáculos.
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
                  {import.meta.env.DEV && (
                    <div className="mt-2 text-xs text-gray-500">
                      <p>Dados enviados:</p>
                      <pre className="whitespace-pre-wrap">{JSON.stringify(formData, null, 2)}</pre>
                    </div>
                  )}
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
                  {import.meta.env.DEV && (
                    <div className="mt-2 text-xs text-gray-500">
                      <p>Dados enviados:</p>
                      <pre className="whitespace-pre-wrap">{JSON.stringify(formData, null, 2)}</pre>
                    </div>
                  )}
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
              <a href="https://www.instagram.com/luanferreira.foto/" target="_blank" className="text-gray-400 hover:text-white transition-colors">
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