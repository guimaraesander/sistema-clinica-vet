import { 
    getPendingSellersService, 
    getSellerByIdService, 
    updateSellerStatusService,
    getCustomersWithStatsService,
    getProductsListService,
    getOrdersListService,
    getCustomerDetailsService,
    getSellersListService,
} from '../services/adminService.js';

// Busca todos os vendedores pendentes de aprovação
export const getPendingSellers = async (req, res) => {
    try {
        const pendingSellers = await getPendingSellersService();
        res.json(pendingSellers);
    } catch (error) {
        res.status(500).json({ message: 'Erro ao buscar vendedores pendentes', error: error.message });
    }
};

// Busca detalhes de um vendedor específico pelo ID
export const getSellerById = async (req, res) => {
    const { id } = req.params;
    try {
        const seller = await getSellerByIdService(id);
        if (!seller) {
            return res.status(404).json({ message: 'Vendedor não encontrado' });
        }
        if (seller.role !== 'vendedor') {
            return res.status(400).json({ message: 'Usuário não é um vendedor' });
        }
        res.json(seller);
    } catch (error) {
        res.status(500).json({ message: 'Erro ao buscar detalhes do vendedor', error: error.message });
    }
};

// Aprovar ou rejeitar um vendedor
export const updateSellerStatus = async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;
    if (!['approved', 'rejected'].includes(status)) {
        return res.status(400).json({ message: 'Status inválido. Use approved ou rejected' });
    }
    try {
        const updatedSeller = await updateSellerStatusService(id, status);
        res.json({
            message: `Vendedor ${status === 'approved' ? 'aprovado' : 'rejeitado'} com sucesso`,
            seller: updatedSeller
        });
    } catch (error) {
        res.status(500).json({ message: 'Erro ao atualizar status do vendedor', error: error.message });
    }
};

// Lista clientes com estatísticas
export const getCustomersWithStats = async (req, res) => {
    try {
        const { page = 1, pageSize = 20, search = '' } = req.query;
        const take = Math.min(parseInt(pageSize, 10) || 20, 100);
        const skip = ((parseInt(page, 10) || 1) - 1) * take;
        const data = await getCustomersWithStatsService({ skip, take, search });
        res.json(data);
    } catch (error) {
        res.status(500).json({ message: 'Erro ao listar clientes', error: error.message });
    }
};

// Lista produtos com dados do vendedor
export const getProductsList = async (req, res) => {
    try {
        const { page = 1, pageSize = 20, search = '', sellerId, stockStatus } = req.query;
        const take = Math.min(parseInt(pageSize, 10) || 20, 100);
        const skip = ((parseInt(page, 10) || 1) - 1) * take;
        const data = await getProductsListService({ skip, take, search, sellerId, stockStatus });
        res.json(data);
    } catch (error) {
        res.status(500).json({ message: 'Erro ao listar produtos', error: error.message });
    }
};

// Lista pedidos/vendas
export const getOrdersList = async (req, res) => {
    try {
        const { page = 1, pageSize = 20, search = '', status, buyerId } = req.query;
        const take = Math.min(parseInt(pageSize, 10) || 20, 100);
        const skip = ((parseInt(page, 10) || 1) - 1) * take;
        const data = await getOrdersListService({ skip, take, search, status, buyerId });
        res.json(data);
    } catch (error) {
        res.status(500).json({ message: 'Erro ao listar vendas', error: error.message });
    }
};

// Detalhes de um cliente específico
export const getCustomerDetails = async (req, res) => {
    try {
        const { id } = req.params;
        const data = await getCustomerDetailsService(id);
        if (!data) return res.status(404).json({ message: 'Cliente não encontrado' });
        res.json(data);
    } catch (error) {
        res.status(500).json({ message: 'Erro ao buscar detalhes do cliente', error: error.message });
    }
};

// Lista de vendedores para filtros
export const getSellersList = async (req, res) => {
    try {
        const { search = '', status } = req.query;
        const data = await getSellersListService({ search, status });
        res.json(data);
    } catch (error) {
        res.status(500).json({ message: 'Erro ao listar vendedores', error: error.message });
    }
};