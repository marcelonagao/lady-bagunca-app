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
// 2. TIPAGENS & DADOS DE TESTE (FALLBACK)
// ==========================================
interface Product {
  id: string | number;
  name: string;
  price: number;
  image: string;
  discount?: number;
  category: string; // Nova propriedade para o sistema de categorias
  freeShipping?: boolean; // Gatilho estilo Mercado Livre
  installments?: number;
}

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

const CATEGORIES = ['Todas', 'Maquiagem', 'Skincare', 'Perfumes', 'Corpo e Banho', 'Kits', 'Lançamentos'];

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
  
  // Novos estados para a experiência ML/Shopee
  const [selectedCategory, setSelectedCategory] = useState('Todas');
  const [searchQuery, setSearchQuery] = useState('');

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

  const addToCart = (product: Product) => {
    setCart([...cart, product]);
  };

  const removeFromCart = (indexToRemove: number) => {
    setCart(cart.filter((_, index) => index !== indexToRemove));
  };

  const cartTotal = cart.reduce((sum, item) => sum + item.price, 0);

  // Lógica de Filtro (Pesquisa + Categoria)
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
    <div className="min-h-screen bg-[#ebebeb] font-sans text-gray-800 pb-16">
      
      {/* HEADER ESTILO MARKETPLACE (Fundo Laranja Lady Bagunça) */}
      <header className="bg-[#eb5a22] sticky top-0 z-50 shadow-md">
        <div className="w-full px-4 lg:px-8 mx-auto">
          {/* Topo do Header: Logo, Busca e Carrinho */}
          <div className="flex justify-between items-center py-3 gap-4 lg:gap-8">
            
            {/* Logo */}
            <div 
              className="text-2xl font-black tracking-tighter cursor-pointer flex flex-col leading-none shrink-0"
              onClick={() => {setCurrentView('catalog'); setSelectedCategory('Todas'); setSearchQuery('');}}
            >
              <span className="text-white drop-shadow-sm uppercase">LADY BAGUNÇA</span>
              <span className="text-[10px] md:text-xs font-medium italic text-orange-200">Outlet da Beleza</span>
            </div>
            
            {/* Barra de Pesquisa */}
            {currentView === 'catalog' && (
              <div className="flex-grow max-w-3xl hidden sm:flex relative">
                <input 
                  type="text" 
                  placeholder="Buscar produtos, marcas e muito mais..." 
                  className="w-full bg-white py-2.5 px-4 pr-12 rounded-sm shadow-sm focus:outline-none text-sm text-gray-700"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <button className="absolute right-0 top-0 h-full px-3 text-gray-400 hover:text-gray-600">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
                </button>
              </div>
            )}
            
            {/* Ações (Carrinho) */}
            <div className="flex items-center gap-4 shrink-0">
              <button 
                onClick={() => setCurrentView('cart')}
                className="relative text-white p-2 hover:bg-black/10 rounded-full transition flex items-center gap-2"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="8" cy="21" r="1"/><circle cx="19" cy="21" r="1"/><path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"/></svg>
                {cart.length > 0 && (
                  <span className="absolute -top-1 -right-1 bg-[#ff478d] text-white text-[10px] font-bold rounded-full h-5 w-5 flex items-center justify-center border border-[#eb5a22]">
                    {cart.length}
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* Busca Mobile (Aparece apenas em ecrãs pequenos) */}
          {currentView === 'catalog' && (
            <div className="sm:hidden pb-3 relative">
              <input 
                type="text" 
                placeholder="Buscar em Lady Bagunça..." 
                className="w-full bg-white py-2 px-4 pr-10 rounded-sm shadow-sm focus:outline-none text-sm text-gray-700"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="absolute right-3 top-2.5"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
            </div>
          )}

          {/* Barra de Categorias Horizontal */}
          {currentView === 'catalog' && (
            <div className="flex overflow-x-auto hide-scrollbar gap-6 text-sm text-white/90 font-medium pb-3 pt-1">
              {CATEGORIES.map(category => (
                <button 
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`whitespace-nowrap transition-colors ${selectedCategory === category ? 'text-white font-bold border-b-2 border-white' : 'hover:text-white'}`}
                >
                  {category}
                </button>
              ))}
            </div>
          )}
        </div>
      </header>

      {/* MAIN CONTENT (100% WIDE) */}
      <main className="w-full px-2 sm:px-4 lg:px-8 mt-6">
        
        {currentView === 'catalog' && (
          <>
            {/* Feedback de pesquisa/categoria */}
            <div className="mb-4 text-gray-600 text-sm md:text-base">
              {searchQuery ? (
                <span>Buscando por: <strong>"{searchQuery}"</strong></span>
              ) : (
                <span>Categoria: <strong>{selectedCategory}</strong></span>
              )}
            </div>

            {isLoading ? (
              <div className="flex justify-center items-center h-64 w-full">
                <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-[#eb5a22]"></div>
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="text-center py-20 bg-white rounded-md shadow-sm border border-gray-200">
                <p className="text-gray-500 text-lg">Nenhum produto encontrado nesta categoria ou pesquisa.</p>
                <button onClick={() => {setSearchQuery(''); setSelectedCategory('Todas');}} className="mt-4 text-[#eb5a22] hover:underline font-semibold">Ver todos os produtos</button>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7 gap-2 sm:gap-4">
                {filteredProducts.map(product => (
                  <div key={product.id} className="bg-white rounded-md shadow-sm border border-gray-200 overflow-hidden flex flex-col group hover:shadow-md transition duration-200 cursor-pointer">
                    
                    {/* Imagem do Produto */}
                    <div className="aspect-square bg-white relative p-2 border-b border-gray-100 flex items-center justify-center">
                      <img src={product.image} alt={product.name} className="w-full h-full object-contain group-hover:scale-105 transition duration-300" />
                      {/* Coração Favorito (Visual) */}
                      <div className="absolute top-2 right-2 text-gray-300 hover:text-[#ff478d] transition">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/></svg>
                      </div>
                    </div>

                    {/* Informações (Estilo Marketplace) */}
                    <div className="p-3 md:p-4 flex flex-col flex-grow relative">
                      
                      {/* Preço Original (Riscado) */}
                      <div className="min-h-[16px]">
                        {product.discount && (
                          <span className="text-xs text-gray-400 line-through">R$ {product.discount.toFixed(2)}</span>
                        )}
                      </div>
                      
                      {/* Preço Atual e Desconto */}
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xl md:text-2xl font-normal text-gray-900 leading-none">R$ {product.price.toFixed(2)}</span>
                        {product.discount && (
                          <span className="text-xs font-semibold text-[#00a650]">
                            {Math.round(((product.discount - product.price) / product.discount) * 100)}% OFF
                          </span>
                        )}
                      </div>
                      
                      {/* Parcelamento */}
                      <div className="text-xs md:text-sm text-[#00a650] mb-2">
                        {product.installments ? `em ${product.installments}x R$ ${(product.price / product.installments).toFixed(2)} sem juros` : 'Ver opções de pagamento'}
                      </div>

                      {/* Selo Frete Grátis */}
                      {product.freeShipping && (
                        <div className="text-xs font-bold text-[#00a650] flex items-center gap-1 mb-2">
                          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11h1Zm0 0h2.5a2.5 2.5 0 0 0 2.5-2.5V11l-4-4Z"/><path d="M14 7h3.5l3.5 4"/><path d="M12 18a2 2 0 1 0-4 0 2 2 0 0 0 4 0Z"/><path d="M22 18a2 2 0 1 0-4 0 2 2 0 0 0 4 0Z"/></svg>
                          Frete grátis
                        </div>
                      )}

                      {/* Nome do Produto */}
                      <h3 className="text-[11px] md:text-xs text-gray-600 line-clamp-2 leading-tight mt-auto group-hover:text-black">{product.name}</h3>
                      
                      {/* Botão Adicionar que aparece no Hover (Desktop) ou fica fixo (Mobile) */}
                      <div className="mt-3 opacity-100 lg:opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={(e) => {e.stopPropagation(); addToCart(product);}}
                          className="w-full bg-[#ff478d]/10 text-[#ff478d] hover:bg-[#ff478d] hover:text-white py-1.5 rounded text-xs font-semibold transition"
                        >
                          Adicionar ao carrinho
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* VIEW: CARRINHO (Ajustado para ocupar largura fluída) */}
        {currentView === 'cart' && (
          <div className="w-full max-w-4xl mx-auto mt-4">
            <div className="bg-white p-6 md:p-8 rounded-md shadow-sm border border-gray-200">
              <div className="flex justify-between items-center mb-6 pb-4 border-b border-gray-100">
                <h2 className="text-xl md:text-2xl font-bold text-gray-800">Carrinho de Compras</h2>
              </div>

              {cart.length === 0 ? (
                <div className="text-center py-16 flex flex-col items-center">
                  <p className="text-gray-500 text-lg">O teu carrinho está vazio.</p>
                  <button onClick={() => setCurrentView('catalog')} className="mt-4 text-[#eb5a22] font-semibold hover:underline">Ir às compras</button>
                </div>
              ) : (
                <>
                  <ul className="divide-y divide-gray-100 mb-6">
                    {cart.map((item, index) => (
                      <li key={index} className="py-4 flex justify-between items-center">
                        <div className="flex items-center gap-4">
                          <img src={item.image} alt={item.name} className="w-16 h-16 object-contain border border-gray-100 rounded" />
                          <span className="text-sm text-gray-700">{item.name}</span>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          <span className="font-semibold text-gray-900 text-lg">R$ {item.price.toFixed(2)}</span>
                          <button onClick={() => removeFromCart(index)} className="text-sm text-blue-500 hover:text-blue-700">Excluir</button>
                        </div>
                      </li>
                    ))}
                  </ul>
                  <div className="flex flex-col md:flex-row justify-end items-end md:items-center gap-6 border-t border-gray-100 pt-6">
                    <div className="text-right">
                      <span className="text-gray-600 text-sm">Total:</span>
                      <div className="text-3xl font-normal text-gray-900">R$ {cartTotal.toFixed(2)}</div>
                    </div>
                    <button 
                      onClick={() => setCurrentView('checkout')}
                      className="w-full md:w-auto bg-[#3483fa] text-white px-10 py-3 rounded-md font-semibold hover:bg-blue-600 transition"
                    >
                      Continuar a compra
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* VIEW: CHECKOUT */}
        {currentView === 'checkout' && (
          <div className="w-full max-w-2xl mx-auto mt-4">
            <div className="bg-white p-6 md:p-8 rounded-md shadow-sm border border-gray-200">
              <h2 className="text-xl font-bold text-gray-800 mb-6 pb-4 border-b border-gray-100">Como você prefere pagar?</h2>
              
              <form onSubmit={handleCheckout} className="space-y-6">
                <div className="grid gap-4">
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Nome Completo</label>
                    <input required type="text" className="w-full border border-gray-300 rounded-md p-2.5 focus:outline-none focus:ring-2 focus:ring-[#3483fa]/50 focus:border-[#3483fa] transition" />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">E-mail</label>
                    <input required type="email" className="w-full border border-gray-300 rounded-md p-2.5 focus:outline-none focus:ring-2 focus:ring-[#3483fa]/50 focus:border-[#3483fa] transition" />
                  </div>
                </div>
                
                <div className="pt-2">
                  <p className="block text-sm font-semibold text-gray-800 mb-3">Opções de pagamento</p>
                  <div className="flex flex-col gap-3">
                    <label className={`border rounded-md p-4 flex items-center gap-4 cursor-pointer transition ${paymentMethod === 'pix' ? 'border-[#3483fa] bg-blue-50/30' : 'border-gray-200 hover:bg-gray-50'}`}>
                      <input type="radio" name="payment" value="pix" checked={paymentMethod === 'pix'} onChange={() => setPaymentMethod('pix')} className="w-4 h-4 text-[#3483fa]" />
                      <div>
                        <div className="font-semibold text-gray-800">PIX</div>
                        <div className="text-xs text-[#00a650]">Aprovação imediata</div>
                      </div>
                    </label>
                    <label className={`border rounded-md p-4 flex items-center gap-4 cursor-pointer transition ${paymentMethod === 'cartao' ? 'border-[#3483fa] bg-blue-50/30' : 'border-gray-200 hover:bg-gray-50'}`}>
                      <input type="radio" name="payment" value="cartao" checked={paymentMethod === 'cartao'} onChange={() => setPaymentMethod('cartao')} className="w-4 h-4 text-[#3483fa]" />
                      <div>
                        <div className="font-semibold text-gray-800">Cartão de Crédito</div>
                        <div className="text-xs text-gray-500">Até 6x sem juros</div>
                      </div>
                    </label>
                  </div>
                </div>

                <div className="flex justify-between items-center py-4 border-t border-gray-100">
                  <span className="text-gray-600">Total a pagar</span>
                  <span className="text-2xl font-normal text-gray-900">R$ {cartTotal.toFixed(2)}</span>
                </div>

                <button 
                  type="submit"
                  className="w-full bg-[#3483fa] text-white py-3.5 rounded-md font-semibold hover:bg-blue-600 transition"
                >
                  Confirmar pagamento
                </button>
                <button 
                  type="button"
                  onClick={() => setCurrentView('cart')}
                  className="w-full text-center text-sm font-semibold text-blue-500 hover:text-blue-700"
                >
                  Voltar ao carrinho
                </button>
              </form>
            </div>
          </div>
        )}
      </main>
      
      {/* Esconder scrollbar na barra de categorias via CSS embutido */}
      <style dangerouslySetInnerHTML={{__html: `
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}} />
    </div>
  );
}