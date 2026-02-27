import React, { useState } from 'react';
import { useNavigate, NavLink, Link } from 'react-router-dom';
import './Header.css';
import { useAuth } from '../../contexts/AuthContext';

// Componentes e Ícones
import Logo from '../Logo';
import { InputDefault } from '../Input';
import { useCart } from '../../contexts/CartContext';
// import products from '../../data/products.json'; // substituído por busca via backend
import { FaRegCircleUser, FaCartShopping, FaRegHeart, FaAngleDown } from 'react-icons/fa6';

const Header = () => {
    const { user, logout } = useAuth();
    // const location = useLocation();
    
    const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [suggestions, setSuggestions] = useState([]); // reservado para auto-complete futuro
    const [searchHistory, setSearchHistory] = useState(() => {
        return JSON.parse(localStorage.getItem('searchHistory')) || [];
    });
    
    const navigate = useNavigate();
    const { getCartItemCount } = useCart();
    const cartItemCount = getCartItemCount();
    
    const handleLogout = () => {
        logout();
        setIsUserMenuOpen(false);
        navigate('/');
    };

    const getDashboardLink = () => {
        if (!user) return "/login";
        switch (user.role) {
            case 'cliente': return "/cliente/dashboard";
            case 'vendedor': return "/vendedor/dashboard";
            case 'admin': return "/admin/dashboard";
            default: return "/login";
        }
    };

    // Verifica se estamos nas páginas de painel (cliente, vendedor, admin)
    // const isDashboardPage = () => {
    //     return location.pathname.includes('/cliente/dashboard') || 
    //            location.pathname.includes('/vendedor/dashboard') || 
    //            location.pathname.includes('/admin/dashboard');
    // };

        const handleInputChange = (event) => {
        const value = event.target.value;
        setSearchTerm(value);
                // Sugestões futuras podem ser carregadas do backend
                setSuggestions([]);
    };

        const handleSearch = () => {
                const term = searchTerm.trim();
                if (!term) return;

                const updatedHistory = [term.toLowerCase(), ...searchHistory.filter((t) => t !== term.toLowerCase())].slice(0, 5);
                setSearchHistory(updatedHistory);
                localStorage.setItem('searchHistory', JSON.stringify(updatedHistory));

                navigate(`/produtos?q=${encodeURIComponent(term)}`);
                setSuggestions([]);
        };
    
    const handleKeyPress = event => {
        if (event.key === 'Enter') handleSearch();
    };

    return (
        <header className="header-container">
            <div className="header-dropshadow">
                <div className='header-main'>
                    <button className='hamburger-menu' onClick={() => setIsMenuOpen(!isMenuOpen)}>
                        {isMenuOpen ? (
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M18 6L6 18M6 6L18 18" stroke="#2D2D36" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                        ) : (
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M3 12H21M3 6H21M3 18H21" stroke="#2D2D36" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                        )}
                    </button>

                    <div className='content-logo'>
                        <Link to="/"><Logo /></Link>
                    </div>

                    <div className='search-input'>
                        <InputDefault
                            type='text'
                            placeholder='Pesquisar produtos...'
                            value={searchTerm}
                            onChange={handleInputChange}
                            onKeyUp={handleKeyPress}
                        />
                         {/* As suas sugestões de busca aqui */}
                    </div>

                    <div className='user-actions'>
                        {user ? (
                            <div className="user-logged-in" onMouseLeave={() => setIsUserMenuOpen(false)}>
                                <div className="user-info" onMouseEnter={() => setIsUserMenuOpen(true)}>
                                    <FaRegCircleUser className='user-icons'/>
                                    <div className="user-text">
                                        <span className='user-line'>Olá, <strong>{user.name}</strong></span>
                                        <span className='user-line subtle'>Minha Conta <FaAngleDown /></span>
                                    </div>
                                </div>
                                {isUserMenuOpen && (
                                    <div className="user-dropdown-menu">
                                        <Link to={getDashboardLink()} onClick={() => setIsUserMenuOpen(false)}>Meu Painel</Link>
                                        <button onClick={handleLogout}>Sair</button>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="user">
                                <Link to='/login' className='user-link'><FaRegCircleUser className='user-icons'/></Link>
                                <div className="user-text">
                                    <span className='user-line'>Olá, <Link to='/login' className='user-link'>Entre </Link>ou</span>
                                    <span className='user-line'><Link to='/create-account' className='user-link'>Cadastre-se</Link></span>
                                </div>
                            </div>
                        )}
                        
                        <div className="functions">
                            <Link to="/*" className="icon-link"><FaRegHeart /></Link>
                            <Link to="/shopping-cart" className="icon-link">
                                <FaCartShopping />
                                {cartItemCount > 0 && <span className="cart-badge">{cartItemCount}</span>}
                            </Link>
                        </div>
                    </div>
                </div>

                <nav className={`header-nav ${isMenuOpen ? 'mobile-open' : ''}`}>
                    <ul className="nav-list">
                        <li><NavLink to='/' end className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>Home</NavLink></li>
                        <li><NavLink to='/produtos' className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>Produtos</NavLink></li>
                        
                        {/* --- LÓGICA ATUALIZADA PARA O MENU --- */}
                        {user ? (
                             <li><NavLink to={getDashboardLink()} className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>Meu Painel</NavLink></li>
                        ) : (
                            <>
                                {/* Estes links só serão visíveis no menu hamburguer */}
                                <li className="mobile-auth-link"><NavLink to="/login" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>Entrar</NavLink></li>
                                <li className="mobile-auth-link"><NavLink to="/create-account" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>Cadastre-se</NavLink></li>
                            </>
                        )}
                    </ul>
                </nav>
            </div>
        </header>
    );
};

export default Header;

