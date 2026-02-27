import React, { useEffect, useState } from 'react';
import styles from './PaginaVendedor.module.css';
import DadosLoja from './DadosLoja';
import VendasRecentes from './VendasRecentes';
import MeusProdutos from './MeusProdutos';
import { FaStore, FaTag, FaChartLine } from 'react-icons/fa'; // Ícones para o menu
import { useLocation } from 'react-router-dom';
import { useToast } from '../../components/Toast/ToastProvider.jsx';

const PaginaVendedor = () => {
    const location = useLocation();
    const { show } = useToast();
    // Este estado controla qual componente será exibido na tela principal
    const [currentView, setCurrentView] = useState('dados'); // A visualização padrão é 'dados'

    // Quando vier de uma navegação com state, abrir a aba adequada e exibir mensagem
    useEffect(() => {
        const tabFromState = location?.state?.sellerTab;
        if (tabFromState) {
            setCurrentView(tabFromState);
        }
        const flash = location?.state?.flash;
        if (flash) {
            show(flash, 'success');
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return (
        <div className={styles.dashboardContainer}>
            <h1 className={styles.title}>Painel do Vendedor</h1>
            
            <div className={styles.dashboardLayout}>
                {/* --- MENU LATERAL --- */}
                <aside className={styles.sidebar}>
                    <nav>
                        <button
                            className={currentView === 'dados' ? styles.active : ''}
                            onClick={() => setCurrentView('dados')}
                        >
                            <FaStore /> Dados da Loja
                        </button>
                        <button
                            className={currentView === 'vendas' ? styles.active : ''}
                            onClick={() => setCurrentView('vendas')}
                        >
                            <FaChartLine /> Minhas Vendas
                        </button>
                        <button
                            className={currentView === 'produtos' ? styles.active : ''}
                            onClick={() => setCurrentView('produtos')}
                        >
                            <FaTag /> Meus Produtos
                        </button>
                    </nav>
                </aside>

                {/* --- CONTEÚDO PRINCIPAL (RENDERIZAÇÃO CONDICIONAL) --- */}
                <main className={styles.content}>
                    {currentView === 'dados' && <DadosLoja />}
                    {currentView === 'vendas' && <VendasRecentes />}
                    {currentView === 'produtos' && <MeusProdutos />}
                </main>
            </div>
        </div>
    );
};

export default PaginaVendedor;