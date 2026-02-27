import { Suspense, lazy } from 'react';
import { Routes, Route } from 'react-router-dom';
import Layout from './pages/Layout';
import FormCreatePage from './pages/FormCreatePage';
import UserDashboard from './components/UserDashboard';
import BuySuccessPage from './pages/BuySuccess';
import ResetScroll from './components/ResetScroll';
import AdminRoute from './components/AdminRoute';
import ProtectedRoute from './components/ProtectedRoute';

// Imports lazy
const AdminLoginPage = lazy(() => import('./pages/AdminLoginPage'));
const HomePage = lazy(() => import('./pages/HomePage'));
const ProductListingPage = lazy(() => import('./pages/ProductListingPage'));
const ProductViewPage = lazy(() => import('./pages/ProductViewPage'));
const LoginPage = lazy(() => import('./pages/LoginPage'));
const ShoppingCartPage = lazy(() => import('./pages/ShoppingCartPage'));
const Success = lazy(() => import('./pages/BuySuccess'));
const FinaleBuyPage = lazy(() => import('./pages/FinalizarCompraPage'));
const NotFoundPage = lazy(() => import('./pages/404'));
const AdminPage = lazy(() => import('./pages/AdminPage')); 
const AdminSellerDetailsPage = lazy(() => import('./pages/AdminSellerDetailsPage')); 
const CadastroProdutosPage = lazy(() => import('./pages/CadastroProdutosPage')); 
const PendingApprovalPage = lazy(() => import('./pages/PendingApprovalPage'));
const PaginaVendedor = lazy(() => import('./pages/PaginaVendedor'));
const PaginaCliente = lazy(() => import('./pages/PaginaCliente'));
const EditarProdutoPage = lazy(() => import('./pages/EditarProdutoPage'));
const DetalhesPedidoClientePage = lazy(() => import('./pages/DetalhesPedidoClientePage')); 

const App = () => {
  return (
    <Suspense fallback={<div>Carregando...</div>}>
      <ResetScroll />
      <Routes>
        
        {/* ROTAS PÚBLICAS  */}
        <Route path='/' element={<Layout><HomePage /></Layout>} />
        <Route path='/produtos' element={<Layout><ProductListingPage /></Layout>} />
        <Route path='/produtos/:id' element={<Layout><ProductViewPage /></Layout>} />
        <Route path='/login' element={<Layout><LoginPage /></Layout>} />
        <Route path='/create-account' element={<Layout><FormCreatePage /></Layout>} />
        <Route path='/shopping-cart' element={<Layout><ShoppingCartPage /></Layout>} />
        <Route path='/cadastro/pendente' element={<Layout><PendingApprovalPage /></Layout>} />
        
        {/* ROTAS PRIVADAS */}
        <Route element={<ProtectedRoute />}>
          <Route path='/checkout' element={<Layout><FinaleBuyPage /></Layout>} />
          <Route path='/success' element={<Layout><Success/></Layout>} />
          <Route path='/product-success' element={<Layout><BuySuccessPage /></Layout>} />
        </Route>

        {/* ROTAS DE CLIENTE */}
        <Route element={<ProtectedRoute />}>
          <Route path='/cliente/dashboard' element={<Layout><PaginaCliente /></Layout>} />
          <Route path='/orders/:id' element={<Layout><DetalhesPedidoClientePage /></Layout>} />
        </Route>

        {/* ROTAS DE VENDEDOR */}
        <Route element={<ProtectedRoute />}>
          <Route path='/vendedor/cadastrar-produto'element={<Layout><CadastroProdutosPage /></Layout>} />
          <Route path='/vendedor/dashboard' element={<Layout><PaginaVendedor /></Layout>}  />
          <Route path='/vendedor/produtos/editar/:id' element={<Layout><EditarProdutoPage /></Layout>} />
        </Route>

        {/* --- ROTAS DE ADMIN --- */}
        <Route path='/admin/login' element={<AdminLoginPage />} />
        <Route element={<AdminRoute />}>
        <Route path='/admin/dashboard' element={<Layout><AdminPage /></Layout>} />
        <Route path='/admin/seller/:sellerId' element={<Layout><AdminSellerDetailsPage /></Layout>} />
        </Route>

        {/* Rota de fallback para 404  */}
        <Route path='/*' element={<Layout><NotFoundPage /></Layout>} />
      </Routes>
    </Suspense>
  );
};

export default App;