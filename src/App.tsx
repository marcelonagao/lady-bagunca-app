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
  discount?: number; // Para mostrar um "De/Por"
}

const mockProducts: Product[] = [
  { id: 'mock1', name: 'Batom Líquido Matte Rosa Selva', price: 29.90, discount: 38.90, image: 'https://images.unsplash.com/photo-1586495777744-4413f21062fa?auto=format&fit=crop&w=400&q=80' },
  { id: 'mock2', name: 'Paleta de Sombras Neon Vibes', price: 89.90, discount: 119.90, image: 'https://images.unsplash.com/photo-1512496115841-db0aaf528090?auto=format&fit=crop&w=400&q=80' },
  { id: 'mock3', name: 'Base Cobertura Extrema Glow', price: 55.00, discount: 75.00, image: 'https://images.unsplash.com/photo-1599305090598-fe179d501227?auto=format&fit=crop&w=400&q=80' },
  { id: 'mock4', name: 'Sérum Facial Vitamina C Pura', price: 120.00, discount: 150.00, image: 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&w=400&q=80' },
  { id: 'mock5', name: 'Kit SkinCare Completo Bagunça', price: 199.90, discount: 250.00, image: 'https://images.unsplash.com/photo-1556228578-0d85b1a4d571?auto=format&fit=crop&w=400&q=80' },
  { id: 'mock6', name: 'Perfume Floral Rosa Selvagem', price: 145.00, image: 'https://images.unsplash.com/photo-1594035910387-fea47794261f?auto=format&fit=crop&w=400&q=80' },
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

  // LER PRODUTOS DO FIREBASE
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const snapshot = await getDocs(collection(db, 'products'));
        
        if (snapshot.empty) {
          console.log("Firebase vazio. A carregar produtos de teste...");
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
        setProducts(mockProducts); // Fallback em caso de erro
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

  // GRAVAR PEDIDO NO FIREBASE
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
    <div className="min-h-screen bg-gray-50 font-sans text-gray-800 pb-16">
      
      {/* ANNOUNCEMENT BAR (Novo visual - focado em conversão) */}
      <div className="bg-[#ff478d] text-white text-xs md:text-sm font-semibold py-2 px-4 flex justify-center items-center gap-4 text-center">
        <span className="hidden md:inline">✨ Frete Grátis acima de R$150</span>
        <span className="hidden md:inline">•</span>
        <span>💳 Parcele em até 6x sem juros</span>
        <span className="hidden md:inline">•</span>
        <span>⚡ 5% de desconto no PIX</span>
      </div>

      {/* HEADER (Clean, fundo branco, detalhes coloridos) */}
      <header className="bg-white sticky top-0 z-50 shadow-sm border-b border-gray-100">
        <div className="w-full px-4 md:px-8 xl:px-16 mx-auto flex justify-between items-center py-4">
          <div 
            className="text-2xl md:text-3xl font-black tracking-tighter cursor-pointer flex flex-col leading-none"
            onClick={() => setCurrentView('catalog')}
          >
            <span className="text-[#eb5a22] drop-shadow-sm uppercase">LADY BAGUNÇA</span>
            <span className="text-xs md:text-sm font-medium italic text-[#ff478d] ml-1">Outlet da Beleza</span>
          </div>
          
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setCurrentView('cart')}
              className="relative bg-gray-50 border border-gray-200 text-[#eb5a22] p-3 rounded-full hover:bg-orange-50 hover:border-orange-200 transition shadow-sm flex items-center justify-center group"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="group-hover:scale-110 transition-transform"><circle cx="8" cy="21" r="1"/><circle cx="19" cy="21" r="1"/><path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"/></svg>
              {cart.length > 0 && (
                <span className="absolute -top-2 -right-2 bg-[#ff478d] text-white text-xs font-bold rounded-full h-6 w-6 flex items-center justify-center border-2 border-white shadow-sm">
                  {cart.length}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* MAIN CONTENT (Aproveitamento 100% da tela) */}
      <main className="w-full">
        
        {/* VIEW: CATÁLOGO */}
        {currentView === 'catalog' && (
          <>
            {/* HERO BANNER (Nova seção para impacto visual) */}
            <div className="w-full bg-[#eb5a22] relative overflow-hidden flex flex-col md:flex-row items-center justify-center px-4 py-12 md:py-16 xl:px-16 mb-8 md:mb-12">
              <div className="relative z-10 text-center md:text-left md:w-1/2 flex flex-col items-center md:items-start gap-4">
                <span className="bg-[#ff478d] text-white text-xs font-black uppercase tracking-widest px-3 py-1 rounded-full">Oferta Especial</span>
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-white leading-tight">As melhores ofertas <br/>de todo o site</h1>
                <p className="text-orange-100 text-lg md:text-xl font-medium max-w-md">Kits campeões de vendas com até <strong className="text-white text-2xl">50% OFF</strong></p>
                <button className="mt-4 bg-white text-[#eb5a22] font-black uppercase tracking-wide px-8 py-4 rounded-full shadow-lg hover:bg-gray-100 transition hover:scale-105">Ver Promoções</button>
              </div>
              <div className="hidden md:flex md:w-1/2 justify-end relative z-10">
                <div className="relative w-72 h-72 lg:w-96 lg:h-96">
                   <img src="https://images.unsplash.com/photo-1596462502278-27bf85033e5a?auto=format&fit=crop&w=600&q=80" alt="Kits de Beleza" className="object-cover rounded-full shadow-2xl border-4 border-[#ff478d] w-full h-full" />
                   {/* Decorações no banner */}
                   <div className="absolute -top-6 -right-6 bg-[#ff478d] text-white font-black text-2xl w-24 h-24 rounded-full flex items-center justify-center shadow-xl rotate-12">-50%</div>
                </div>
              </div>
              {/* Elementos decorativos de fundo */}
              <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
            </div>

            <div className="w-full px-4 md:px-8 xl:px-16 mx-auto">
              <h2 className="text-2xl md:text-3xl font-black text-gray-800 mb-6 flex items-center gap-2">
                <span className="w-8 h-1 bg-[#ff478d] rounded-full inline-block"></span> 
                Mais Vendidos
              </h2>

              {isLoading ? (
                <div className="flex justify-center items-center h-64 w-full">
                  <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-[#eb5a22]"></div>
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-3 md:gap-6">
                  {products.map(product => (
                    <div key={product.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden flex flex-col transition hover:shadow-xl hover:-translate-y-1 group relative">
                      
                      {/* Badge de desconto dinâmico */}
                      {product.discount && (
                        <div className="absolute top-2 left-2 bg-[#ff478d] text-white text-[10px] md:text-xs font-black px-2 py-1 rounded-md z-10 shadow-sm flex items-center gap-1">
                          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m12 14 4-4"/><path d="M3.34 19a10 10 0 1 1 17.32 0"/></svg>
                          -{Math.round(((product.discount - product.price) / product.discount) * 100)}%
                        </div>
                      )}

                      <div className="h-40 md:h-56 bg-gray-50 relative p-4 flex items-center justify-center overflow-hidden">
                        <img src={product.image} alt={product.name} className="max-w-full max-h-full object-contain group-hover:scale-105 transition duration-500" />
                      </div>

                      <div className="p-3 md:p-5 flex flex-col flex-grow bg-white">
                        {/* Estrelas de Avaliação (Visual) */}
                        <div className="flex text-yellow-400 mb-1 md:mb-2">
                           {[1,2,3,4,5].map(star => (
                             <svg key={star} xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                           ))}
                           <span className="text-[10px] text-gray-400 ml-1">(45)</span>
                        </div>

                        <h3 className="text-xs md:text-sm font-semibold text-gray-700 line-clamp-2 flex-grow min-h-[2.5rem]">{product.name}</h3>
                        
                        <div className="mt-2 md:mt-3 flex flex-col">
                          {product.discount ? (
                            <span className="text-[10px] md:text-xs text-gray-400 line-through">R$ {product.discount.toFixed(2)}</span>
                          ) : (
                            <span className="h-[15px] md:h-[18px]"></span> /* Espaçador se não houver desconto */
                          )}
                          <span className="text-lg md:text-2xl font-black text-[#eb5a22]">R$ {product.price.toFixed(2)}</span>
                          <span className="text-[10px] text-gray-500 font-medium">ou 2x de R$ {(product.price / 2).toFixed(2)}</span>
                        </div>
                        
                        <button 
                          onClick={() => addToCart(product)}
                          className="mt-3 md:mt-4 w-full bg-green-500 hover:bg-green-600 text-white py-2 md:py-2.5 rounded-lg text-xs md:text-sm font-bold transition flex items-center justify-center gap-1 md:gap-2 shadow-sm"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="M12 5v14"/></svg>
                          Adicionar
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}

        {/* VIEW: CARRINHO (Mantido centralizado para melhor UX em desktop grande) */}
        {currentView === 'cart' && (
          <div className="w-full px-4 mt-8">
            <div className="bg-white p-6 md:p-8 rounded-2xl shadow-xl border border-gray-100 max-w-3xl mx-auto">
              <div className="flex justify-between items-center mb-6 border-b border-gray-100 pb-4">
                <h2 className="text-2xl font-black text-gray-800 flex items-center gap-2">
                  <span className="text-[#eb5a22]">🛒</span> O teu Carrinho
                </h2>
                <button onClick={() => setCurrentView('catalog')} className="text-sm text-[#ff478d] font-bold hover:underline">← Continuar a comprar</button>
              </div>

              {cart.length === 0 ? (
                <div className="text-center py-16 flex flex-col items-center">
                  <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                    <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#ccc" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="8" cy="21" r="1"/><circle cx="19" cy="21" r="1"/><path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"/></svg>
                  </div>
                  <p className="text-gray-500 text-xl font-medium">O teu carrinho está vazio.</p>
                  <p className="text-gray-400 text-sm mt-2">Navegue pelas nossas ofertas e encha de beleza!</p>
                  <button onClick={() => setCurrentView('catalog')} className="mt-6 bg-[#eb5a22] text-white px-8 py-3 rounded-full font-bold hover:bg-orange-600 transition">Ver Produtos</button>
                </div>
              ) : (
                <>
                  <ul className="divide-y divide-gray-100 mb-6">
                    {cart.map((item, index) => (
                      <li key={index} className="py-4 flex justify-between items-center group">
                        <div className="flex items-center gap-4">
                          <div className="w-16 h-16 bg-gray-50 rounded-lg border border-gray-100 p-1 flex items-center justify-center">
                            <img src={item.image} alt={item.name} className="max-w-full max-h-full object-contain" />
                          </div>
                          <span className="text-sm md:text-base font-semibold text-gray-700 max-w-[150px] md:max-w-xs">{item.name}</span>
                        </div>
                        <div className="flex items-center gap-4 md:gap-6">
                          <span className="font-black text-[#eb5a22] text-lg">R$ {item.price.toFixed(2)}</span>
                          <button onClick={() => removeFromCart(index)} className="text-gray-300 hover:text-red-500 p-2 rounded-full hover:bg-red-50 transition" title="Remover item">
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
                          </button>
                        </div>
                      </li>
                    ))}
                  </ul>
                  <div className="bg-orange-50 border border-orange-100 p-5 rounded-xl flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
                    <span className="text-lg font-bold text-gray-700">Total da compra:</span>
                    <span className="text-3xl md:text-4xl font-black text-[#eb5a22]">R$ {cartTotal.toFixed(2)}</span>
                  </div>
                  <button 
                    onClick={() => setCurrentView('checkout')}
                    className="w-full bg-[#eb5a22] text-white py-4 rounded-xl font-black text-xl hover:bg-orange-600 transition shadow-lg flex justify-center items-center gap-2 hover:-translate-y-1"
                  >
                    Ir para o Pagamento 
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
                  </button>
                </>
              )}
            </div>
          </div>
        )}

        {/* VIEW: CHECKOUT */}
        {currentView === 'checkout' && (
          <div className="w-full px-4 mt-8">
            <div className="bg-white p-6 md:p-8 rounded-2xl shadow-xl border border-gray-100 max-w-2xl mx-auto">
              <h2 className="text-2xl font-black text-gray-800 mb-6 border-b border-gray-100 pb-4">Finalizar Compra</h2>
              
              <form onSubmit={handleCheckout} className="space-y-5">
                <div className="grid md:grid-cols-2 gap-5">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-bold text-gray-700 mb-1">Nome Completo</label>
                    <input required type="text" placeholder="Ex: Maria Joaquina" className="w-full bg-gray-50 border border-gray-200 rounded-lg p-3 focus:outline-none focus:border-[#ff478d] focus:bg-white transition" />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-bold text-gray-700 mb-1">E-mail</label>
                    <input required type="email" placeholder="maria@email.com" className="w-full bg-gray-50 border border-gray-200 rounded-lg p-3 focus:outline-none focus:border-[#ff478d] focus:bg-white transition" />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-bold text-gray-700 mb-1">Endereço de Entrega</label>
                    <input required type="text" placeholder="Rua das Flores, 123" className="w-full bg-gray-50 border border-gray-200 rounded-lg p-3 focus:outline-none focus:border-[#ff478d] focus:bg-white transition" />
                  </div>
                </div>
                
                <div className="pt-4 border-t border-gray-100 mt-6">
                  <p className="block text-sm font-bold text-gray-700 mb-3">Método de Pagamento</p>
                  <div className="flex flex-col md:flex-row gap-4">
                    <label className={`flex-1 border-2 rounded-xl p-4 text-center cursor-pointer transition flex flex-col items-center justify-center gap-2 ${paymentMethod === 'pix' ? 'border-[#ff478d] bg-pink-50' : 'border-gray-200 hover:border-gray-300 bg-gray-50'}`}>
                      <input type="radio" name="payment" value="pix" checked={paymentMethod === 'pix'} onChange={() => setPaymentMethod('pix')} className="hidden" />
                      <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={paymentMethod === 'pix' ? '#ff478d' : '#9ca3af'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2 2 7l10 5 10-5-10-5Z"/><path d="m2 17 10 5 10-5"/><path d="m2 12 10 5 10-5"/></svg>
                      <span className="font-black text-gray-800">PIX</span>
                      <span className="text-xs text-green-600 font-bold bg-green-100 px-2 py-0.5 rounded-full mt-1">5% OFF</span>
                    </label>
                    <label className={`flex-1 border-2 rounded-xl p-4 text-center cursor-pointer transition flex flex-col items-center justify-center gap-2 ${paymentMethod === 'cartao' ? 'border-[#ff478d] bg-pink-50' : 'border-gray-200 hover:border-gray-300 bg-gray-50'}`}>
                      <input type="radio" name="payment" value="cartao" checked={paymentMethod === 'cartao'} onChange={() => setPaymentMethod('cartao')} className="hidden" />
                      <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={paymentMethod === 'cartao' ? '#ff478d' : '#9ca3af'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="14" x="2" y="5" rx="2"/><line x1="2" x2="22" y1="10" y2="10"/></svg>
                      <span className="font-black text-gray-800">Cartão</span>
                      <span className="text-xs text-gray-500 font-medium mt-1">Até 6x sem juros</span>
                    </label>
                  </div>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg mt-6 flex justify-between items-center">
                  <span className="text-gray-600 font-medium">Total a Pagar:</span>
                  <span className="text-2xl font-black text-[#eb5a22]">
                    R$ {paymentMethod === 'pix' ? (cartTotal * 0.95).toFixed(2) : cartTotal.toFixed(2)}
                  </span>
                </div>

                <button 
                  type="submit"
                  className="w-full bg-[#25D366] text-white py-4 rounded-xl font-black text-xl hover:bg-green-600 transition shadow-lg flex justify-center items-center gap-2 mt-4"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="m9 12 2 2 4-4"/></svg>
                  Finalizar Compra Segura
                </button>
                
                <button 
                  type="button"
                  onClick={() => setCurrentView('cart')}
                  className="w-full text-center text-sm font-bold text-[#ff478d] mt-4 hover:underline"
                >
                  ← Voltar ao carrinho
                </button>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}