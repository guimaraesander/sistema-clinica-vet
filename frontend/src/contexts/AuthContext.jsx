import React, { createContext, useState, useContext, useEffect } from 'react';
import { login as loginService } from '../services/authService';

const AuthContext = createContext(null);
export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true); // 1. Adicionar estado de loading

    // Ao carregar a aplicação, verifica se há um usuário salvo no localStorage
    useEffect(() => {
        try {
            const storedUser = localStorage.getItem('user');
            if (storedUser) {
                setUser(JSON.parse(storedUser));
            }
        } catch (error) {
            console.error("Falha ao carregar dados do usuário do localStorage", error);
            // Limpa o estado se os dados estiverem corrompidos
            setUser(null);
            localStorage.clear();
        } finally {
            setLoading(false); // 2. Finaliza o loading, com ou sem usuário
        }
    }, []);

    // Função de login que chama o backend
    const login = async (email, password) => {
        setLoading(true);
        try {
            const data = await loginService(email, password);
            setUser(data.user);
            localStorage.setItem('user', JSON.stringify(data.user));
            localStorage.setItem('authToken', data.token);
            return data.user;
        } catch (error) {
            // Garante que o estado esteja limpo em caso de erro
            logout();
            // Extrai mensagem amigável do backend (ex.: 403 vendedor pendente)
            const friendlyMessage =
                error?.response?.data?.message ||
                (error?.message?.toLowerCase()?.includes('network')
                    ? 'Falha de rede. Tente novamente.'
                    : 'Falha no login. Verifique suas credenciais.');
            throw new Error(friendlyMessage); // Repassa mensagem para a página de login
        } finally {
            setLoading(false); // Finaliza o loading após a tentativa de login
        }
    };

    // Função de logout que limpa o estado e o localStorage
    const logout = () => {
        setUser(null);
        localStorage.removeItem('user');
        localStorage.removeItem('authToken');
    };

    // Atualiza dados do usuário no contexto e persiste no localStorage
    const updateUser = (partialOrUser) => {
        setUser((prev) => {
            const next = typeof partialOrUser === 'function' ? partialOrUser(prev) : { ...prev, ...partialOrUser };
            try {
                localStorage.setItem('user', JSON.stringify(next));
            } catch (e) {
                // Ignora falha de persistência no localStorage (ex.: modo privado ou quota excedida)
                void e;
            }
            return next;
        });
    };

    const value = {
        user,
        loading, // 3. Expor o estado de loading
        login,
        logout,
        updateUser,
        isAuthenticated: !loading && !!user, // A autenticação só é real quando não está carregando e existe usuário
        isAdmin: !loading && user?.role === 'admin',
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

