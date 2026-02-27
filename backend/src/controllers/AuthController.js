import { getUserByEmailService, getUserByCnpjService, createUserService } from '../services/userService.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { JWT_SECRET, JWT_EXPIRES_IN } from '../config/env.js';


const generateToken = (id, role) => {
    return jwt.sign({ id, role }, JWT_SECRET, {
        expiresIn: JWT_EXPIRES_IN,
    });
};

export const register = async (req, res) => {
    try {
    const { name, email, password, role, phone, address, cnpj } = req.body;

        //validação
        if (!name || !email || !password || !role) {
            return res.status(400).json({ message: 'Todos os campos são obrigatórios.'})
        }

        // Validar role permitida
        const allowedRoles = ['cliente', 'vendedor'];
        if (!allowedRoles.includes(role)) {
            return res.status(400).json({ message: 'Role inválida.'});
        }

        // Validação adicional para vendedor
        if (role === 'vendedor' && !cnpj) {
            return res.status(400).json({ message: 'CNPJ é obrigatório para vendedores.'})
        }

        //para verificar se o usário já existe
    const existingUser = await getUserByEmailService(email);
            if (existingUser) {
                return res.status(409).json({ message: 'Email em uso.'})
            }
        
        // Verificar se já existe um vendedor com esse CNPJ
        if (role === 'vendedor' && cnpj) {
            const existingCNPJ = await getUserByCnpjService(cnpj);
            if (existingCNPJ) {
                return res.status(409).json({ message: 'CNPJ já cadastrado.'})
            }
        }

        //critp senha
        const hashedPassword = await bcrypt.hash(password, 12);

        //cria usuario no bd
        const user = await createUserService({
            name,
            email,
            password: hashedPassword,
            role,
            phone,
            address,
            ...(role === 'vendedor' && { cnpj }),
            status: role === 'vendedor' ? 'pending' : 'active'
        });

        // Não emitir token no registro para evitar acesso imediato
        res.status(201).json({
            message: role === 'vendedor' 
                ? 'Cadastro enviado com sucesso! Aguarde a aprovação do administrador.'
                : 'Usuário registrado com sucesso!',
            user: { 
                id: user.id, 
                name: user.name, 
                email: user.email, 
                role: user.role,
                status: user.status
            },
        });
    } catch (error) {
            res.status(500).json({ message: 'Erro no servidor', error: error.message})
        }
    };

    export const login = async (req, res) => {
        try {
            const { email, password } = req.body;

            // Validação
            if (!email || !password) {
                return res.status(400).json({ message: 'Email e senha são obrigatórios.' });
            }

            // Encontrar usuário
            const user = await getUserByEmailService(email);
            if (!user || !(await bcrypt.compare(password, user.password))) {
                return res.status(401).json({ message: 'Credenciais inválidas.' });
            }

            // Verificar se o vendedor foi aprovado
            if (user.role === 'vendedor' && user.status !== 'active') {
                return res.status(403).json({ message: 'Seu cadastro ainda não foi aprovado. Aguarde a aprovação para acessar a plataforma.' });
            }

            // Gerar token e enviar resposta (retornando campos completos não sensíveis)
            const token = generateToken(user.id, user.role);
            res.status(200).json({
                token,
                user: {
                    id: user.id,
                    name: user.name,
                    email: user.email,
                    role: user.role,
                    address: user.address ?? null,
                    phone: user.phone ?? null,
                    cnpj: user.cnpj ?? null,
                    status: user.status ?? 'active'
                }
            });
        } catch (error) {
            console.error('Erro detalhado no login:', error);
            res.status(500).json({ message: 'Erro no servidor.', error: error.message });
        }
    };