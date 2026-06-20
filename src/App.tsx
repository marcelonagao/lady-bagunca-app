import { useState, useEffect } from 'react';
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

// Inicializar o Firebase e o Banco de Dados
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// ==========================================
// 2. TIPAGENS DO TYPESCRIPT
// ==========================================
interface Product {
  id: string | number;
  name: string;
  price: number;
  image: string;
}

type ViewState = 'catalog' | 'cart' | 'checkout';
type PaymentMethod = 'pix' | 'cartao';

// ==========================================
// 3. COMPONENTE PRINCIPAL
// ==========================================
export default function LadyBaguncaApp() {
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<Product[]>([]);
  const [currentView, setCurrentView] = useState<ViewState>('catalog');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('pix');

  // LER PRODUTOS DO FIREBASE
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const snapshot = await getDocs(collection(db, 'products'));
        const productsData = snapshot.docs.map(doc => ({ 
          id: doc.id, 
          ...doc.data() 
        } as Product));
        
        setProducts(productsData);
      } catch (error) {
        console.error("Erro ao carregar produtos:", error);
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
      // Grava na coleção 'orders'
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
    <div className="min-h-screen bg-[#eb5a22] font-sans text-gray-800">
      
      {/* HEADER */}
      <header className="bg-[#eb5a22] text-white p-4 sticky top-0 z-50 shadow-md flex justify-between items-center">
        <div 
          className="text-2xl font-black tracking-tighter cursor-pointer flex flex-col leading-none"
          onClick={() => setCurrentView('catalog')}
        >
          <span className="text-[#ff478d] drop-shadow-md">LADY BAGUNÇA</span>
          <span className="text-sm font-medium italic text-white">Outlet da Beleza</span>
        </div>
        
        <button 
          onClick={() => setCurrentView('cart')}
          className="relative bg-white text-[#eb5a22] p-2 rounded-full hover:bg-gray-100 transition"
        >
          🛒
          {cart.length > 0 && (
            <span className="absolute -top-2 -right-2 bg-[#ff478d] text-white text-xs font-bold rounded-full h-6 w-6 flex items-center justify-center">
              {cart.length}
            </span>
          )}
        </button>
      </header>

      {/* MAIN CONTENT */}
      <main className="p-4 max-w-7xl mx-auto">
        
        {/* VIEW: CATÁLOGO */}
        {currentView === 'catalog' && (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {products.length === 0 ? (
              <p className="text-white col-span-full text-center py-10">A carregar produtos do Firebase...</p>
            ) : (
              products.map(product => (
                <div key={product.id} className="bg-white rounded-lg shadow-sm overflow-hidden flex flex-col transition hover:shadow-md">
                  <img src={product.image} alt={product.name} className="w-full h-36 object-cover" />
                  <div className="p-3 flex flex-col flex-grow">
                    <h3 className="text-sm text-gray-600 line-clamp-2 flex-grow">{product.name}</h3>
                    <p className="text-lg font-bold text-[#eb5a22] mt-2">R$ {product.price.toFixed(2)}</p>
                    <button 
                      onClick={() => addToCart(product)}
                      className="mt-3 w-full bg-[#ff478d] text-white py-1.5 rounded text-sm font-semibold hover:bg-pink-600 transition"
                    >
                      Comprar
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* VIEW: CARRINHO */}
        {currentView === 'cart' && (
          <div className="bg-white p-6 rounded-lg shadow-lg max-w-2xl mx-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-[#eb5a22]">O teu Carrinho</h2>
              <button onClick={() => setCurrentView('catalog')} className="text-sm text-gray-500 underline">Voltar a comprar</button>
            </div>

            {cart.length === 0 ? (
              <p className="text-center text-gray-500 py-10">O teu carrinho está vazio. Vamos fazer bagunça?</p>
            ) : (
              <>
                <ul className="divide-y divide-gray-200 mb-6">
                  {cart.map((item, index) => (
                    <li key={index} className="py-3 flex justify-between items-center">
                      <span className="text-sm font-medium">{item.name}</span>
                      <div className="flex items-center gap-4">
                        <span className="font-bold text-gray-700">R$ {item.price.toFixed(2)}</span>
                        <button onClick={() => removeFromCart(index)} className="text-red-500 text-xs font-bold">X</button>
                      </div>
                    </li>
                  ))}
                </ul>
                <div className="border-t pt-4 flex justify-between items-center mb-6">
                  <span className="text-lg font-bold">Total:</span>
                  <span className="text-2xl font-black text-[#ff478d]">R$ {cartTotal.toFixed(2)}</span>
                </div>
                <button 
                  onClick={() => setCurrentView('checkout')}
                  className="w-full bg-[#eb5a22] text-white py-3 rounded-lg font-bold text-lg hover:bg-orange-600 transition shadow-md"
                >
                  Ir para o Checkout
                </button>
              </>
            )}
          </div>
        )}

        {/* VIEW: CHECKOUT */}
        {currentView === 'checkout' && (
          <div className="bg-white p-6 rounded-lg shadow-lg max-w-2xl mx-auto">
            <h2 className="text-2xl font-bold text-[#eb5a22] mb-6">Finalizar Compra</h2>
            
            <form onSubmit={handleCheckout} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nome Completo</label>
                <input required type="text" className="w-full border rounded p-2 focus:outline-none focus:ring-2 focus:ring-[#ff478d]" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">E-mail</label>
                <input required type="email" className="w-full border rounded p-2 focus:outline-none focus:ring-2 focus:ring-[#ff478d]" />
              </div>
              
              <div className="pt-4">
                <p className="block text-sm font-bold text-gray-700 mb-2">Método de Pagamento</p>
                <div className="flex gap-4">
                  <label className={`flex-1 border rounded p-3 text-center cursor-pointer transition ${paymentMethod === 'pix' ? 'border-[#ff478d] bg-pink-50' : ''}`}>
                    <input type="radio" name="payment" value="pix" checked={paymentMethod === 'pix'} onChange={() => setPaymentMethod('pix')} className="hidden" />
                    <span className="font-bold text-[#eb5a22]">PIX</span> (Aprovação rápida)
                  </label>
                  <label className={`flex-1 border rounded p-3 text-center cursor-pointer transition ${paymentMethod === 'cartao' ? 'border-[#ff478d] bg-pink-50' : ''}`}>
                    <input type="radio" name="payment" value="cartao" checked={paymentMethod === 'cartao'} onChange={() => setPaymentMethod('cartao')} className="hidden" />
                    <span className="font-bold text-[#eb5a22]">Cartão</span> (Até 12x)
                  </label>
                </div>
              </div>

              <button 
                type="submit"
                className="w-full bg-[#ff478d] text-white py-3 rounded-lg font-bold text-lg hover:bg-pink-600 transition shadow-md mt-6"
              >
                Pagar R$ {cartTotal.toFixed(2)}
              </button>
              
              <button 
                type="button"
                onClick={() => setCurrentView('cart')}
                className="w-full text-center text-sm text-gray-500 mt-4 underline"
              >
                Voltar ao carrinho
              </button>
            </form>
          </div>
        )}
      </main>
    </div>
  );
}