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
}

const mockProducts: Product[] = [
  { id: 'mock1', name: 'Batom Líquido Matte Rosa', price: 29.90, image: 'https://images.unsplash.com/photo-1586495777744-4413f21062fa?auto=format&fit=crop&w=300&q=80' },
  { id: 'mock2', name: 'Paleta de Sombras Neon', price: 89.90, image: 'https://images.unsplash.com/photo-1512496115841-db0aaf528090?auto=format&fit=crop&w=300&q=80' },
  { id: 'mock3', name: 'Base Cobertura Extrema', price: 55.00, image: 'https://images.unsplash.com/photo-1599305090598-fe179d501227?auto=format&fit=crop&w=300&q=80' },
  { id: 'mock4', name: 'Sérum Facial Vitamina C', price: 120.00, image: 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&w=300&q=80' },
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
    <div className="min-h-screen bg-[#eb5a22] font-sans text-gray-800 pb-10">
      
      {/* HEADER */}
      <header className="bg-[#eb5a22] text-white p-4 sticky top-0 z-50 shadow-md flex justify-between items-center border-b border-orange-600">
        <div 
          className="text-2xl font-black tracking-tighter cursor-pointer flex flex-col leading-none"
          onClick={() => setCurrentView('catalog')}
        >
          <span className="text-[#ff478d] drop-shadow-md text-3xl">LADY BAGUNÇA</span>
          <span className="text-sm font-medium italic text-white ml-1">Outlet da Beleza</span>
        </div>
        
        <button 
          onClick={() => setCurrentView('cart')}
          className="relative bg-white text-[#eb5a22] p-3 rounded-full hover:bg-gray-100 transition shadow-sm"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="8" cy="21" r="1"/><circle cx="19" cy="21" r="1"/><path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"/></svg>
          {cart.length > 0 && (
            <span className="absolute -top-2 -right-2 bg-[#ff478d] text-white text-xs font-bold rounded-full h-6 w-6 flex items-center justify-center border-2 border-[#eb5a22]">
              {cart.length}
            </span>
          )}
        </button>
      </header>

      {/* MAIN CONTENT */}
      <main className="p-4 max-w-5xl mx-auto mt-4">
        
        {/* VIEW: CATÁLOGO */}
        {currentView === 'catalog' && (
          <>
            {isLoading ? (
              <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white"></div>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {products.map(product => (
                  <div key={product.id} className="bg-white rounded-xl shadow-md overflow-hidden flex flex-col transition hover:shadow-xl hover:-translate-y-1">
                    <div className="h-40 bg-gray-100 relative">
                      <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
                      <div className="absolute top-2 right-2 bg-black/70 text-white text-xs font-bold px-2 py-1 rounded-full">
                        Oferta
                      </div>
                    </div>
                    <div className="p-4 flex flex-col flex-grow">
                      <h3 className="text-sm font-semibold text-gray-700 line-clamp-2 flex-grow h-10">{product.name}</h3>
                      <div className="mt-3 flex flex-col">
                        <span className="text-xs text-gray-400 line-through">R$ {(product.price * 1.3).toFixed(2)}</span>
                        <span className="text-xl font-black text-[#eb5a22]">R$ {product.price.toFixed(2)}</span>
                      </div>
                      <button 
                        onClick={() => addToCart(product)}
                        className="mt-4 w-full bg-[#ff478d] text-white py-2 rounded-lg text-sm font-bold hover:bg-pink-600 transition flex items-center justify-center gap-2"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="M12 5v14"/></svg>
                        Adicionar
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* VIEW: CARRINHO */}
        {currentView === 'cart' && (
          <div className="bg-white p-6 rounded-2xl shadow-xl max-w-2xl mx-auto">
            <div className="flex justify-between items-center mb-6 border-b pb-4">
              <h2 className="text-2xl font-black text-[#eb5a22]">O teu Carrinho</h2>
              <button onClick={() => setCurrentView('catalog')} className="text-sm text-gray-500 font-medium hover:text-[#ff478d]">← Continuar a comprar</button>
            </div>

            {cart.length === 0 ? (
              <div className="text-center py-12 flex flex-col items-center">
                <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#ccc" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="mb-4"><circle cx="8" cy="21" r="1"/><circle cx="19" cy="21" r="1"/><path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"/></svg>
                <p className="text-gray-500 text-lg">O teu carrinho está vazio.</p>
                <p className="text-gray-400 text-sm">Vamos fazer bagunça?</p>
              </div>
            ) : (
              <>
                <ul className="divide-y divide-gray-100 mb-6">
                  {cart.map((item, index) => (
                    <li key={index} className="py-4 flex justify-between items-center group">
                      <div className="flex items-center gap-3">
                        <img src={item.image} alt={item.name} className="w-12 h-12 rounded-md object-cover border" />
                        <span className="text-sm font-semibold text-gray-700">{item.name}</span>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="font-black text-gray-800">R$ {item.price.toFixed(2)}</span>
                        <button onClick={() => removeFromCart(index)} className="text-red-400 hover:text-red-600 p-2 rounded-full hover:bg-red-50 transition">
                          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
                <div className="bg-gray-50 p-4 rounded-xl flex justify-between items-center mb-6">
                  <span className="text-lg font-semibold text-gray-600">Total a pagar:</span>
                  <span className="text-3xl font-black text-[#ff478d]">R$ {cartTotal.toFixed(2)}</span>
                </div>
                <button 
                  onClick={() => setCurrentView('checkout')}
                  className="w-full bg-[#eb5a22] text-white py-4 rounded-xl font-black text-lg hover:bg-orange-600 transition shadow-lg flex justify-center items-center gap-2"
                >
                  Ir para o Checkout 
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
                </button>
              </>
            )}
          </div>
        )}

        {/* VIEW: CHECKOUT */}
        {currentView === 'checkout' && (
          <div className="bg-white p-6 rounded-2xl shadow-xl max-w-2xl mx-auto">
            <h2 className="text-2xl font-black text-[#eb5a22] mb-6 border-b pb-4">Finalizar Compra</h2>
            
            <form onSubmit={handleCheckout} className="space-y-5">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Nome Completo</label>
                <input required type="text" placeholder="Ex: Maria Joaquina" className="w-full border-2 border-gray-200 rounded-lg p-3 focus:outline-none focus:border-[#ff478d] transition" />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">E-mail</label>
                <input required type="email" placeholder="maria@email.com" className="w-full border-2 border-gray-200 rounded-lg p-3 focus:outline-none focus:border-[#ff478d] transition" />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Endereço de Entrega</label>
                <input required type="text" placeholder="Rua das Flores, 123" className="w-full border-2 border-gray-200 rounded-lg p-3 focus:outline-none focus:border-[#ff478d] transition" />
              </div>
              
              <div className="pt-2">
                <p className="block text-sm font-bold text-gray-700 mb-3">Método de Pagamento</p>
                <div className="flex gap-4">
                  <label className={`flex-1 border-2 rounded-xl p-4 text-center cursor-pointer transition flex flex-col items-center justify-center gap-2 ${paymentMethod === 'pix' ? 'border-[#ff478d] bg-pink-50' : 'border-gray-200 hover:border-gray-300'}`}>
                    <input type="radio" name="payment" value="pix" checked={paymentMethod === 'pix'} onChange={() => setPaymentMethod('pix')} className="hidden" />
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#eb5a22" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2 2 7l10 5 10-5-10-5Z"/><path d="m2 17 10 5 10-5"/><path d="m2 12 10 5 10-5"/></svg>
                    <span className="font-black text-[#eb5a22]">PIX</span>
                    <span className="text-xs text-gray-500">Aprovação imediata</span>
                  </label>
                  <label className={`flex-1 border-2 rounded-xl p-4 text-center cursor-pointer transition flex flex-col items-center justify-center gap-2 ${paymentMethod === 'cartao' ? 'border-[#ff478d] bg-pink-50' : 'border-gray-200 hover:border-gray-300'}`}>
                    <input type="radio" name="payment" value="cartao" checked={paymentMethod === 'cartao'} onChange={() => setPaymentMethod('cartao')} className="hidden" />
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#eb5a22" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="14" x="2" y="5" rx="2"/><line x1="2" x2="22" y1="10" y2="10"/></svg>
                    <span className="font-black text-[#eb5a22]">Cartão</span>
                    <span className="text-xs text-gray-500">Até 12x sem juros</span>
                  </label>
                </div>
              </div>

              <button 
                type="submit"
                className="w-full bg-[#ff478d] text-white py-4 rounded-xl font-black text-xl hover:bg-pink-600 transition shadow-lg mt-8 flex justify-between items-center px-6"
              >
                <span>Pagar e Finalizar</span>
                <span>R$ {cartTotal.toFixed(2)}</span>
              </button>
              
              <button 
                type="button"
                onClick={() => setCurrentView('cart')}
                className="w-full text-center text-sm font-semibold text-gray-500 mt-4 hover:text-[#eb5a22] transition"
              >
                ← Voltar ao carrinho
              </button>
            </form>
          </div>
        )}
      </main>
    </div>
  );
}