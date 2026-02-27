import { createContext, useState, useContext, useEffect } from 'react';
import { useAuth } from './AuthContext';

const CartContext = createContext();

export const useCart = () => useContext(CartContext);

// Base do backend configurável
const API_BASE = (import.meta.env.VITE_API_URL?.replace(/\/$/, '') || 'http://localhost:3001');

// Função auxiliar para fazer chamadas API
const apiCall = async (url, options = {}) => {
  const token = localStorage.getItem('authToken'); // Corrigido: era 'token', deve ser 'authToken'

  const defaultOptions = {
    headers: {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` }),
    },
  };

  const response = await fetch(`${API_BASE}/api${url}`, {
    ...defaultOptions,
    ...options,
    headers: {
      ...defaultOptions.headers,
      ...options.headers,
    },
  });

  if (!response.ok) {
    let details;
    try {
      const data = await response.json();
      details = data?.details || data?.error;
    } catch {
      // ignore JSON parse error
    }
    const err = new Error(`Erro na API: ${response.status} ${response.statusText}${details ? ` - ${details}` : ''}`);
    // anexar infos úteis
    err.status = response.status;
    err.details = details;
    throw err;
  }

  return response.json();
};

export const CartProvider = ({ children }) => {
  const { isAuthenticated, user } = useAuth();
  const [cartItems, setCartItems] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  // Carregar carrinho do servidor
  const loadCartFromServer = async () => {
    // Evita chamada se não estiver autenticado ou sem token
    const token = localStorage.getItem('authToken');
    if (!isAuthenticated || !user || !token) {
      const localData = localStorage.getItem('cartItems');
      if (localData) {
        setCartItems(JSON.parse(localData));
      } else {
        setCartItems([]);
      }
      setIsInitialized(true);
      return;
    }
    try {
      setIsLoading(true);
      const data = await apiCall('/cart');

      // Transformar dados do servidor para formato local
      const transformedItems = data.items.map(cartItem => ({
        id: cartItem.productId,
        cartItemId: cartItem.id, // ID do item no carrinho
        name: cartItem.product.title,
        price: cartItem.product.price,
        imageUrl: cartItem.product.images[0] || '',
        quantity: cartItem.quantity,
      }));

      setCartItems(transformedItems);
    } catch (error) {
      // Evita barulho no console para 401 (ex.: token expirado)
      if (error?.status === 401) {
        console.warn('Carrinho não carregado (401). Usuário precisa se autenticar novamente.');
      } else {
        console.error('❌ Erro ao carregar carrinho:', error);
      }
      // Fallback para localStorage se falhar
      const localData = localStorage.getItem('cartItems');
      if (localData) {
        setCartItems(JSON.parse(localData));
      }
    } finally {
      setIsLoading(false);
      setIsInitialized(true);
    }
  };

  // Sincronizar carrinho local com servidor
  const syncCartWithServer = async () => {
    if (!isInitialized) return;

    const token = localStorage.getItem('authToken');
    if (!isAuthenticated || !user || !token) {
      // Sem autenticação, não tenta sincronizar
      return;
    }

    try {
      // Buscar carrinho atual do servidor
      const serverCart = await apiCall('/cart');

      // Comparar e sincronizar diferenças
      const serverItems = serverCart.items || [];

      // Para cada item local, verificar se existe no servidor
      for (const localItem of cartItems) {
        const serverItem = serverItems.find(item => item.productId === localItem.id);

        if (!serverItem) {
          // Item não existe no servidor, adicionar
          await apiCall('/cart', {
            method: 'POST',
            body: JSON.stringify({
              productId: localItem.id,
              quantity: localItem.quantity,
            }),
          });
        } else if (serverItem.quantity !== localItem.quantity) {
          // Quantidade diferente, atualizar
          await apiCall(`/cart/${serverItem.id}`, {
            method: 'PATCH',
            body: JSON.stringify({
              quantity: localItem.quantity,
            }),
          });
        }
      }

      // Recarregar carrinho após sincronização
      await loadCartFromServer();
    } catch (error) {
      console.error('Erro ao sincronizar carrinho:', error);
    }
  };

  // Adicionar item ao carrinho (servidor primeiro, depois local)
  const addToCart = async (product) => {
    const token = localStorage.getItem('authToken');
    if (!token) {
      console.error('❌ Usuário não está logado!');
      alert('Você precisa estar logado para adicionar itens ao carrinho.');
      return;
    }
    try {
      await apiCall('/cart', {
        method: 'POST',
        body: JSON.stringify({ productId: product.id, quantity: 1 }),
      });
      await loadCartFromServer();
    } catch (error) {
      console.error('❌ Erro ao adicionar item ao carrinho:', error);
      if (error.status === 401 || error.message?.includes('401') || error.message?.includes('Unauthorized')) {
        alert('Erro de autenticação. Faça login novamente.');
      } else if (error.status === 404 || error.message?.includes('404')) {
        alert('Produto não encontrado.');
      } else if (error.status === 400 || error.message?.includes('400')) {
        alert('Dados inválidos. Verifique o produto.');
      } else if (error.status === 409 || error.message?.includes('409') || error.details?.toLowerCase?.().includes('estoque')) {
        alert(error.details || 'Estoque insuficiente.');
      } else {
        alert(error.details || 'Erro ao adicionar produto ao carrinho. Tente novamente.');
      }
      throw error;
    }
  };

  // Remover item do carrinho (servidor primeiro, depois local)
  const removeFromCart = async (productId) => {
    const itemToRemove = cartItems.find(item => item.id === productId);
    if (!itemToRemove?.cartItemId) {
      console.warn('Item não tem cartItemId, não pode remover do servidor');
      return;
    }
    try {
      await apiCall(`/cart/${itemToRemove.cartItemId}`, { method: 'DELETE' });
      await loadCartFromServer();
    } catch (error) {
      console.error('Erro ao remover item do carrinho:', error);
      throw error;
    }
  };

  // Atualizar quantidade (local + servidor)
  const updateQuantity = async (productId, quantity) => {
    if (quantity < 1) return;

    const itemToUpdate = cartItems.find(item => item.id === productId);
    const oldQuantity = itemToUpdate?.quantity || 0;

    console.log('🔄 Tentando atualizar quantidade:', {
      productId,
      quantity,
      itemToUpdate,
      cartItemId: itemToUpdate?.cartItemId,
      allCartItems: cartItems
    });

    // Se não tem cartItemId, não pode atualizar no servidor
    if (!itemToUpdate?.cartItemId) {
      console.warn('⚠️ Item não tem cartItemId, pulando sincronização com servidor');
      // Apenas atualização local
      setCartItems(prevItems =>
        prevItems.map(item =>
          item.id === productId ? { ...item, quantity: Math.max(1, quantity) } : item
        )
      );
      return;
    }

    // Atualização otimista local
    setCartItems(prevItems =>
      prevItems.map(item =>
        item.id === productId ? { ...item, quantity: Math.max(1, quantity) } : item
      )
    );

    // Sincronizar com servidor
    try {
      console.log('📡 Fazendo chamada PATCH para:', `/cart/${itemToUpdate.cartItemId}`);
      const response = await apiCall(`/cart/${itemToUpdate.cartItemId}`, {
        method: 'PATCH',
        body: JSON.stringify({
          quantity: Math.max(1, quantity),
        }),
      });
      console.log('✅ Resposta do servidor:', response);
    } catch (error) {
      console.error('❌ Erro ao atualizar quantidade:', error);
      // Reverter mudança local em caso de erro
      setCartItems(prevItems =>
        prevItems.map(item =>
          item.id === productId ? { ...item, quantity: oldQuantity } : item
        )
      );
    }
  };

  const clearCart = () => {
    setCartItems([]);
  };

  const getCartTotal = () => {
    return cartItems.reduce((total, item) => total + (item.price || 0) * item.quantity, 0);
  };

  const getCartItemCount = () => {
    return cartItems.reduce((count, item) => count + item.quantity, 0);
  };

  // Carregar carrinho quando o usuário estiver autenticado
  useEffect(() => {
    if (isAuthenticated && user) {
      loadCartFromServer();
    } else if (!isAuthenticated) {
      // Limpar carrinho quando usuário não estiver autenticado
      setCartItems([]);
      setIsInitialized(true);
    }
  }, [isAuthenticated, user]);

  // Salvar no localStorage como backup
  useEffect(() => {
    if (isInitialized) {
      localStorage.setItem('cartItems', JSON.stringify(cartItems));
    }
  }, [cartItems, isInitialized]);

  return (
    <CartContext.Provider value={{
      cartItems,
      addToCart,
      removeFromCart,
      updateQuantity,
      clearCart,
      getCartTotal,
      getCartItemCount,
      loadCartFromServer,
      syncCartWithServer,
      isLoading
    }}>
      {children}
    </CartContext.Provider>
  );
};