import React, { useState, useEffect } from 'react';
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, addDoc } from 'firebase/firestore';

// ==========================================
// 1. CONFIGURAÇÃO DO FIREBASE
// ==========================================
const firebaseConfig = {
  apiKey: "AIzaSyBHpXTB6TtcmhGAdTXMU-Eh_PKmHzDuNcU",
  authDomain: "lady-bagunca.firebaseapp.com",
  projectId: "lady-bagunca",
  storageBucket: "lady-bagunca.firebasestorage.app",
  messagingSenderId: "397966169444",
  appId: "1:397966169444:web:5badbcec110aaabb591671"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// ==========================================
// 2. TIPAGENS & DADOS DE TESTE
// ==========================================
interface Product {
  id: string | number;
  name: string;
  price: number;
  image: string;
  discount?: number;
  category: string;
  freeShipping?: boolean;
  installments?: number;
}

// Banners para o Carrossel (Futuramente virão do Firebase)
const BANNERS = [
  {
    id: 1,
    image: 'https://images.unsplash.com/photo-1612817288484-6f916006741a?auto=format&fit=crop&w=1600&q=80',
    alt: 'Promoção de Skincare'
  },
  {
    id: 2,
    image: 'https://images.unsplash.com/photo-1596462502278-27bf85033e5a?auto=format&fit=crop&w=1600&q=80',
    alt: 'Lançamentos de Maquiagem'
  },
  {
    id: 3,
    image: 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&w=1600&q=80',
    alt: 'Semana do Consumidor'
  }
];

// Categorias com Imagens (Futuramente virão do Firebase)
const CATEGORIES_DATA = [
  { name: 'Todas', image: 'https://images.unsplash.com/photo-1556228578-0d85b1a4d571?auto=format&fit=crop&w=300&q=80' },
  { name: 'Maquiagem', image: 'https://images.unsplash.com/photo-1512496115841-db0aaf528090?auto=format&fit=crop&w=300&q=80' },
  { name: 'Skincare', image: 'https://images.unsplash.com/photo-1599305090598-fe179d501227?auto=format&fit=crop&w=300&q=80' },
  { name: 'Perfumes', image: 'https://images.unsplash.com/photo-1594035910387-fea47794261f?auto=format&fit=crop&w=300&q=80' },
  { name: 'Corpo e Banho', image: 'https://images.unsplash.com/photo-1608248543803-ba4f8c70ae0b?auto=format&fit=crop&w=300&q=80' },
  { name: 'Kits', image: 'https://images.unsplash.com/photo-1612817159949-195b6eb9e31a?auto=format&fit=crop&w=300&q=80' }
];

const mockProducts: Product[] = [
  { id: 'mock1', name: 'Batom Líquido Matte Rosa Selva Longa Duração', price: 29.90, discount: 38.90, category: 'Maquiagem', freeShipping: true, installments: 2, image: 'https://images.unsplash.com/photo-1586495777744-4413f21062fa?auto=format&fit=crop&w=400&q=80' },
  { id: 'mock2', name: 'Paleta de Sombras Neon Vibes 12 Cores Pigmentadas', price: 89.90, discount: 119.90, category: 'Maquiagem', freeShipping: true, installments: 3, image: 'https://images.unsplash.com/photo-1512496115841-db0aaf528090?auto=format&fit=crop&w=400&q=80' },
  { id: 'mock3', name: 'Base Cobertura Extrema Glow FPS 30', price: 55.00, category: 'Maquiagem', installments: 2, image: 'https://images.unsplash.com/photo-1599305090598-fe179d501227?auto=format&fit=crop&w=400&q=80' },
  { id: 'mock4', name: 'Sérum Facial Vitamina C Pura Anti-Idade', price: 120.00, discount: 150.00, category: 'Skincare', freeShipping: true, installments: 6, image: 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&w=400&q=80' },
  { id: 'mock5', name: 'Kit SkinCare Completo Bagunça (Limpeza + Hidratação)', price: 199.90, discount: 250.00, category: 'Kits', freeShipping: true, installments: 6, image: 'https://images.unsplash.com/photo-1556228578-0d85b1a4d571?auto=format&fit=crop&w=400&q=80' },
  { id: 'mock6', name: 'Perfume Floral Rosa Selvagem Eau de Parfum 100ml', price: 145.00, category: 'Perfumes', freeShipping: true, installments: 5, image: 'https://images.unsplash.com/photo-1594035910387-fea47794261f?auto=format&fit=crop&w=400&q=80' },
  { id: 'mock7', name: 'Máscara de Cílios Volume Máximo', price: 34.90, category: 'Maquiagem', image: 'https://images.unsplash.com/photo-1555487353-a460ee301029?auto=format&fit=crop&w=400&q=80' },
  { id: 'mock8', name: 'Hidratante Corporal Framboesa 400ml', price: 45.00, discount: 55.00, category: 'Corpo e Banho', installments: 2, image: 'https://images.unsplash.com/photo-1608248543803-ba4f8c70ae0b?auto=format&fit=crop&w=400&q=80' },
];

type ViewState = 'catalog' | 'cart' | 'checkout';
type PaymentMethod = 'pix' | 'cartao';

// ==========================================
// 3. COMPONENTE PRINCIPAL
// ==========================================
export default function App() {
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<Product[]>([]);
  const [currentView, setCurrentView] = useState<ViewState>('catalog');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('pix');
  const [isLoading, setIsLoading] = useState(true);
  
  const [selectedCategory, setSelectedCategory] = useState('Todas');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Estado do Carrossel
  const [currentSlide, setCurrentSlide] = useState(0);

  // LER PRODUTOS DO FIREBASE
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const snapshot = await getDocs(collection(db, 'products'));
        if (snapshot.empty) {
          setProducts(mockProducts);
        } else {
          const productsData = snapshot.docs.map(doc => ({ 
            id: doc.id, 
            ...doc.data() 
          } as Product));
          setProducts(productsData);
        }
      } catch (error) {
        console.error("Erro ao carregar produtos:", error);
        setProducts(mockProducts);
      } finally {
        setIsLoading(false);
      }
    };
    fetchProducts();
  }, []);

  // Lógica de Rotação Automática do Carrossel
  useEffect(() => {
    if (currentView !== 'catalog') return;
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev === BANNERS.length - 1 ? 0 : prev + 1));
    }, 5000);
    return () => clearInterval(timer);
  }, [currentView]);

  const nextSlide = () => setCurrentSlide((prev) => (prev === BANNERS.length - 1 ? 0 : prev + 1));
  const prevSlide = () => setCurrentSlide((prev) => (prev === 0 ? BANNERS.length - 1 : prev - 1));

  const addToCart = (product: Product) => setCart([...cart, product]);
  const removeFromCart = (indexToRemove: number) => setCart(cart.filter((_, index) => index !== indexToRemove));
  const cartTotal = cart.reduce((sum, item) => sum + item.price, 0);

  const filteredProducts = products.filter(product => {
    const matchesCategory = selectedCategory === 'Todas' || product.category === selectedCategory;
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await addDoc(collection(db, 'orders'), {
        items: cart,
        total: cartTotal,
        method: paymentMethod,
        status: 'pendente',
        dataPedido: new Date().toISOString()
      });
      alert(`Pedido finalizado via ${paymentMethod.toUpperCase()}! Total: R$ ${cartTotal.toFixed(2)}`);
      setCart([]);
      setCurrentView('catalog');
    } catch (error) {
      console.error("Erro ao gravar pedido:", error);
      alert("Houve um erro ao processar o teu pedido. Tenta novamente.");
    }
  };

  return (
    <div className="min-h-screen bg-white font-sans text-gray-800 pb-16">
      
      {/* TOPO: Faixa de Anúncios */}
      <div className="bg-[#ff478d] text-white text-[10px] md:text-xs font-semibold py-1.5 px-4 flex justify-center items-center gap-4 text-center tracking-wide">
        <span className="hidden md:inline">✨ Frete Grátis acima de R$150</span>
        <span className="hidden md:inline">•</span>
        <span>💳 Parcele em até 6x sem juros</span>
        <span className="hidden md:inline">•</span>
        <span>⚡ 5% de desconto no PIX</span>
      </div>

      {/* HEADER ESTILO BOTICÁRIO (Fundo Branco, Minimalista) */}
      <header className="bg-white sticky top-0 z-50 border-b border-gray-100 shadow-sm">
        <div className="max-w-7xl px-4 lg:px-8 mx-auto">
          <div className="flex justify-between items-center py-4 gap-4 lg:gap-12">
            
            {/* Logo */}
            <div 
              className="text-2xl md:text-3xl font-black tracking-tighter cursor-pointer flex flex-col leading-none shrink-0"
              onClick={() => {setCurrentView('catalog'); setSelectedCategory('Todas'); setSearchQuery('');}}
            >
              <span className="text-[#eb5a22] uppercase tracking-tight">LADY BAGUNÇA</span>
            </div>
            
            {/* Barra de Pesquisa */}
            {currentView === 'catalog' && (
              <div className="flex-grow max-w-2xl hidden md:flex relative">
                <input 
                  type="text" 
                  placeholder="O que você procura hoje?" 
                  className="w-full bg-gray-50 border border-gray-200 py-2.5 px-5 rounded-full focus:outline-none focus:border-[#eb5a22] focus:bg-white transition text-sm text-gray-700"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <button className="absolute right-2 top-1.5 p-1.5 text-gray-400 hover:text-[#eb5a22] transition">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
                </button>
              </div>
            )}
            
            {/* Ações (Entrar, Carrinho) */}
            <div className="flex items-center gap-6 shrink-0 text-sm font-medium text-gray-600">
              <button className="hidden lg:flex items-center gap-2 hover:text-[#eb5a22] transition">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                Entrar
              </button>

              <button 
                onClick={() => setCurrentView('cart')}
                className="relative text-gray-700 hover:text-[#eb5a22] transition flex items-center gap-2"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"/><path d="M3 6h18"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>
                {cart.length > 0 && (
                  <span className="absolute -top-1 -right-2 bg-[#00a650] text-white text-[10px] font-bold rounded-full h-5 w-5 flex items-center justify-center border-2 border-white">
                    {cart.length}
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* Busca Mobile */}
          {currentView === 'catalog' && (
            <div className="md:hidden pb-4 relative">
              <input 
                type="text" 
                placeholder="O que você procura hoje?" 
                className="w-full bg-gray-50 border border-gray-200 py-2 px-4 rounded-full focus:outline-none focus:border-[#eb5a22] text-sm text-gray-700"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="absolute right-4 top-2.5"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
            </div>
          )}
        </div>
      </header>

      <main className="w-full">
        {currentView === 'catalog' && (
          <>
            {/* CARROSSEL DE BANNERS */}
            {searchQuery === '' && (
              <div className="relative w-full overflow-hidden group bg-gray-100 aspect-[16/7] md:aspect-[21/6]">
                {BANNERS.map((banner, index) => (
                  <div 
                    key={banner.id}
                    className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${index === currentSlide ? 'opacity-100 z-10' : 'opacity-0 z-0'}`}
                  >
                    <img src={banner.image} alt={banner.alt} className="w-full h-full object-cover" />
                    {/* Overlay escuro suave para legibilidade caso tenha texto em cima da imagem */}
                    <div className="absolute inset-0 bg-black/10"></div>
                  </div>
                ))}

                {/* Controles do Carrossel */}
                <button onClick={prevSlide} className="absolute left-4 top-1/2 -translate-y-1/2 z-20 bg-white/80 hover:bg-white text-gray-800 p-2 rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-opacity">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
                </button>
                <button onClick={nextSlide} className="absolute right-4 top-1/2 -translate-y-1/2 z-20 bg-white/80 hover:bg-white text-gray-800 p-2 rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-opacity">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
                </button>

                {/* Bolinhas Indicadoras */}
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex gap-2">
                  {BANNERS.map((_, index) => (
                    <button 
                      key={index} 
                      onClick={() => setCurrentSlide(index)}
                      className={`h-2 rounded-full transition-all ${index === currentSlide ? 'w-8 bg-[#eb5a22]' : 'w-2 bg-white/60 hover:bg-white'}`}
                    />
                  ))}
                </div>
              </div>
            )}

            <div className="max-w-7xl mx-auto px-4 lg:px-8">
              
              {/* CATEGORIAS COM FOTOS */}
              {searchQuery === '' && (
                <div className="py-10">
                  <div className="flex overflow-x-auto hide-scrollbar gap-4 md:gap-6 pb-4 pt-2 snap-x">
                    {CATEGORIES_DATA.map(category => (
                      <div 
                        key={category.name}
                        onClick={() => setSelectedCategory(category.name)}
                        className={`snap-start shrink-0 cursor-pointer group flex flex-col items-center gap-3 w-24 md:w-32`}
                      >
                        <div className={`w-20 h-20 md:w-28 md:h-28 rounded-2xl overflow-hidden relative shadow-sm transition-transform duration-300 group-hover:scale-105 border-2 ${selectedCategory === category.name ? 'border-[#eb5a22]' : 'border-transparent'}`}>
                           <img src={category.image} alt={category.name} className="w-full h-full object-cover" />
                           <div className="absolute inset-0 bg-black/10 group-hover:bg-black/0 transition"></div>
                        </div>
                        <span className={`text-xs md:text-sm text-center font-semibold ${selectedCategory === category.name ? 'text-[#eb5a22]' : 'text-gray-700 group-hover:text-[#eb5a22]'}`}>
                          {category.name}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* TÍTULO DA SEÇÃO */}
              <div className="flex justify-between items-end mb-8 mt-4">
                <h2 className="text-2xl md:text-3xl font-light text-gray-800">
                  {searchQuery ? (
                    <>Resultados para <span className="font-bold">"{searchQuery}"</span></>
                  ) : (
                    <>Sucessos em <span className="font-bold text-[#eb5a22]">{selectedCategory}</span></>
                  )}
                </h2>
                {!searchQuery && (
                  <button className="hidden md:flex items-center gap-1 text-sm font-semibold text-[#00a650] hover:underline">
                    Veja Mais <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
                  </button>
                )}
              </div>

              {/* GRID DE PRODUTOS */}
              {isLoading ? (
                <div className="flex justify-center items-center h-64 w-full">
                  <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-[#eb5a22]"></div>
                </div>
              ) : filteredProducts.length === 0 ? (
                <div className="text-center py-20 bg-gray-50 rounded-2xl">
                  <p className="text-gray-500 text-lg">Nenhum produto encontrado nesta categoria ou pesquisa.</p>
                  <button onClick={() => {setSearchQuery(''); setSelectedCategory('Todas');}} className="mt-4 text-white bg-[#eb5a22] px-6 py-2 rounded-full font-semibold hover:bg-orange-600 transition">Ver todos os produtos</button>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-6">
                  {filteredProducts.map(product => (
                    <div key={product.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden flex flex-col group hover:shadow-md transition duration-300 relative">
                      
                      {/* Selo de Desconto (Estilo Top-Left) */}
                      {product.discount && (
                        <div className="absolute top-3 left-3 bg-[#00a650] text-white text-[10px] md:text-xs font-bold px-2 py-0.5 rounded-sm z-10 shadow-sm">
                          -{Math.round(((product.discount - product.price) / product.discount) * 100)}%
                        </div>
                      )}

                      {/* Coração (Estilo Top-Right) */}
                      <button className="absolute top-3 right-3 text-gray-300 hover:text-[#ff478d] transition z-10 bg-white/80 p-1.5 rounded-full">
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/></svg>
                      </button>

                      {/* Imagem do Produto Centralizada */}
                      <div className="aspect-square bg-white relative p-4 flex items-center justify-center cursor-pointer">
                        <img src={product.image} alt={product.name} className="max-w-full max-h-full object-contain group-hover:scale-105 transition duration-500" />
                      </div>

                      {/* Informações Centralizadas */}
                      <div className="p-4 flex flex-col flex-grow items-center text-center relative border-t border-gray-50 bg-gray-50/30">
                        
                        {/* Avaliação em Estrelas Centralizadas */}
                        <div className="flex text-yellow-400 mb-2">
                           {[1,2,3,4,5].map(star => (
                             <svg key={star} xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                           ))}
                        </div>

                        {/* Nome do Produto */}
                        <h3 className="text-xs md:text-sm text-gray-700 font-medium line-clamp-2 leading-snug h-10 mb-2 hover:text-[#eb5a22] cursor-pointer">
                          {product.name}
                        </h3>
                        
                        <div className="mt-auto w-full flex flex-col items-center">
                          {/* Preço Original Riscado */}
                          <div className="min-h-[16px]">
                            {product.discount && (
                              <span className="text-[11px] md:text-xs text-gray-400 line-through">R$ {product.discount.toFixed(2)}</span>
                            )}
                          </div>
                          
                          {/* Preço Atual */}
                          <span className="text-lg md:text-xl font-bold text-gray-900 leading-none mb-1">
                            R$ {product.price.toFixed(2)}
                          </span>
                          
                          {/* Botão de Compra Integrado */}
                          <button 
                            onClick={(e) => {e.stopPropagation(); addToCart(product);}}
                            className="mt-4 w-full bg-[#00a650] text-white hover:bg-green-700 py-2.5 rounded-lg text-sm font-semibold transition flex items-center justify-center gap-2 shadow-sm"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"/><path d="M3 6h18"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>
                            Comprar
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}

        {/* VIEW: CARRINHO */}
        {currentView === 'cart' && (
          <div className="w-full max-w-4xl mx-auto mt-8 px-4">
            <div className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-gray-200">
              <div className="flex justify-between items-center mb-6 pb-4 border-b border-gray-100">
                <h2 className="text-xl md:text-2xl font-light text-gray-800">Seu Carrinho</h2>
                <button onClick={() => setCurrentView('catalog')} className="text-sm text-[#eb5a22] font-medium hover:underline">Continuar comprando</button>
              </div>

              {cart.length === 0 ? (
                <div className="text-center py-20 flex flex-col items-center">
                  <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                    <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#ccc" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"/><path d="M3 6h18"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>
                  </div>
                  <p className="text-gray-500 text-lg">Sua sacola de beleza está vazia.</p>
                  <button onClick={() => setCurrentView('catalog')} className="mt-6 bg-[#eb5a22] text-white px-8 py-3 rounded-full font-bold hover:bg-orange-600 transition">Explorar Produtos</button>
                </div>
              ) : (
                <>
                  <ul className="divide-y divide-gray-100 mb-8">
                    {cart.map((item, index) => (
                      <li key={index} className="py-6 flex flex-col md:flex-row md:justify-between md:items-center gap-4">
                        <div className="flex items-center gap-4">
                          <img src={item.image} alt={item.name} className="w-20 h-20 object-contain bg-gray-50 p-2 rounded-xl border border-gray-100" />
                          <div>
                            <span className="text-sm md:text-base font-medium text-gray-800 block mb-1">{item.name}</span>
                            <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-md">Qtd: 1</span>
                          </div>
                        </div>
                        <div className="flex items-center justify-between md:flex-col md:items-end gap-2 pl-24 md:pl-0">
                          <span className="font-bold text-gray-900 text-lg md:text-xl">R$ {item.price.toFixed(2)}</span>
                          <button onClick={() => removeFromCart(index)} className="text-sm text-gray-400 hover:text-red-500 flex items-center gap-1 transition">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
                            Remover
                          </button>
                        </div>
                      </li>
                    ))}
                  </ul>
                  <div className="bg-gray-50 border border-gray-100 p-6 rounded-2xl flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
                    <div className="w-full md:w-1/2">
                      <div className="flex relative">
                        <input type="text" placeholder="Cupom de desconto" className="w-full py-2.5 px-4 rounded-l-lg border border-gray-200 focus:outline-none focus:border-[#eb5a22] text-sm" />
                        <button className="bg-gray-800 text-white px-6 rounded-r-lg font-semibold text-sm hover:bg-gray-700 transition">Aplicar</button>
                      </div>
                    </div>
                    <div className="flex flex-col items-end w-full md:w-auto mt-4 md:mt-0">
                      <span className="text-gray-500 text-sm mb-1">Total da compra:</span>
                      <div className="text-3xl font-bold text-gray-900">R$ {cartTotal.toFixed(2)}</div>
                    </div>
                  </div>
                  <div className="flex justify-end">
                    <button 
                      onClick={() => setCurrentView('checkout')}
                      className="w-full md:w-auto bg-[#00a650] text-white px-12 py-4 rounded-xl font-bold text-lg hover:bg-green-700 transition shadow-lg shadow-green-500/30"
                    >
                      Finalizar Compra
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* VIEW: CHECKOUT */}
        {currentView === 'checkout' && (
          <div className="w-full max-w-3xl mx-auto mt-8 px-4">
            <div className="bg-white p-6 md:p-10 rounded-2xl shadow-sm border border-gray-200">
              <h2 className="text-2xl font-light text-gray-800 mb-8 pb-4 border-b border-gray-100">Pagamento Seguro</h2>
              
              <form onSubmit={handleCheckout} className="space-y-8">
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Nome Completo</label>
                    <input required type="text" className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-[#eb5a22]/20 focus:border-[#eb5a22] transition" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">E-mail</label>
                    <input required type="email" className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-[#eb5a22]/20 focus:border-[#eb5a22] transition" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Telefone (WhatsApp)</label>
                    <input required type="tel" className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-[#eb5a22]/20 focus:border-[#eb5a22] transition" />
                  </div>
                </div>
                
                <div className="pt-4 border-t border-gray-100">
                  <p className="block text-sm font-bold text-gray-800 mb-4">Escolha a forma de pagamento</p>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <label className={`border-2 rounded-xl p-5 flex flex-col items-center justify-center gap-3 cursor-pointer transition relative overflow-hidden ${paymentMethod === 'pix' ? 'border-[#00a650] bg-green-50/50' : 'border-gray-200 hover:border-gray-300 bg-white'}`}>
                      <input type="radio" name="payment" value="pix" checked={paymentMethod === 'pix'} onChange={() => setPaymentMethod('pix')} className="absolute opacity-0" />
                      {paymentMethod === 'pix' && <div className="absolute top-2 right-2 text-[#00a650]"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg></div>}
                      <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke={paymentMethod === 'pix' ? '#00a650' : '#9ca3af'} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2 2 7l10 5 10-5-10-5Z"/><path d="m2 17 10 5 10-5"/><path d="m2 12 10 5 10-5"/></svg>
                      <div className="text-center">
                        <div className={`font-bold ${paymentMethod === 'pix' ? 'text-green-800' : 'text-gray-700'}`}>PIX</div>
                        <div className="text-xs text-[#00a650] font-medium mt-1 bg-green-100 px-2 py-0.5 rounded-md inline-block">5% de Desconto</div>
                      </div>
                    </label>
                    <label className={`border-2 rounded-xl p-5 flex flex-col items-center justify-center gap-3 cursor-pointer transition relative overflow-hidden ${paymentMethod === 'cartao' ? 'border-[#eb5a22] bg-orange-50/50' : 'border-gray-200 hover:border-gray-300 bg-white'}`}>
                      <input type="radio" name="payment" value="cartao" checked={paymentMethod === 'cartao'} onChange={() => setPaymentMethod('cartao')} className="absolute opacity-0" />
                      {paymentMethod === 'cartao' && <div className="absolute top-2 right-2 text-[#eb5a22]"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg></div>}
                      <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke={paymentMethod === 'cartao' ? '#eb5a22' : '#9ca3af'} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="14" x="2" y="5" rx="2"/><line x1="2" x2="22" y1="10" y2="10"/></svg>
                      <div className="text-center">
                        <div className={`font-bold ${paymentMethod === 'cartao' ? 'text-orange-800' : 'text-gray-700'}`}>Cartão de Crédito</div>
                        <div className="text-xs text-gray-500 mt-1">Até 6x sem juros</div>
                      </div>
                    </label>
                  </div>
                </div>

                <div className="bg-gray-50 p-6 rounded-xl flex justify-between items-center border border-gray-100">
                  <span className="text-gray-600 font-medium">Total a Pagar</span>
                  <div className="text-right">
                    {paymentMethod === 'pix' && <div className="text-xs text-gray-400 line-through mb-1">R$ {cartTotal.toFixed(2)}</div>}
                    <span className="text-3xl font-black text-[#00a650]">
                      R$ {paymentMethod === 'pix' ? (cartTotal * 0.95).toFixed(2) : cartTotal.toFixed(2)}
                    </span>
                  </div>
                </div>

                <div className="pt-4 flex flex-col md:flex-row gap-4">
                  <button 
                    type="button"
                    onClick={() => setCurrentView('cart')}
                    className="w-full md:w-1/3 text-center py-4 rounded-xl font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 transition"
                  >
                    Voltar à Sacola
                  </button>
                  <button 
                    type="submit"
                    className="w-full md:w-2/3 bg-[#00a650] text-white py-4 rounded-xl font-bold text-lg hover:bg-green-700 transition shadow-lg shadow-green-500/30 flex justify-center items-center gap-2"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="m9 12 2 2 4-4"/></svg>
                    Pagar com Segurança
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
      
      <style dangerouslySetInnerHTML={{__html: `
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}} />
    </div>
  );
}