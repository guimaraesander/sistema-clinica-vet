import { getAllUsersService, getUserByIdService, updateUserService, deleteUserService } from '../services/userService.js';
import bcrypt from 'bcryptjs';

export const getMe = (req, res) => {
    res.status(200).json(req.user);
};

export const userSelect = {
    id: true,
    name: true,
    email: true,
    role: true,
    createdAt: true,
    updatedAt: true,
};

export const getAllUsers = async (req, res) => {
  try {
    const users = await getAllUsersService();
    res.status(200).json(users);
  } catch (error) {
    console.error("erro ao buscar usuários:", error);
    res.status(500).json({ message: "Ocorreu um erro no servidor ao buscar usuários" });
  }
};
export const getUserById = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await getUserByIdService(id);
    if (!user) {
      return res.status(400).json({ message: "Usuário não encontrado" });
    }
    res.status(200).json(user);
  } catch (error) {
    console.error("erro ao buscar usuários:", error);
    res.status(500).json({ message: "Ocorreu um erro no servidor ao buscar usuários" });
  }
};

export const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { email, name, role } = req.body;
    const updatedUser = await updateUserService(id, { email, name, role });
    res.status(200).json(updatedUser);
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({ message: "Usuário não encontrado." });
    }
    console.error("Erro ao atualizar usuário:", error);
    res.status(500).json({ message: "Ocorreu um erro no servidor ao buscar usuários" });
  }
};

export const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    await deleteUserService(id);
    res.status(200).send();
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({ message: "Usuário não encontrado." });
    }
    console.error("Erro ao deletar usuário:", error);
    res.status(500).json({ message: "Ocorreu um erro no servidor ao deletar usuário." });
  }
};


// @desc    Update user profile
// @route   PUT /api/profile
// @access  Private
export const getProfile = async (req, res) => {
  try {
    const user = await getUserByIdService(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'Usuário não encontrado.' });
    }
    res.status(200).json(user);
  } catch (error) {
    console.error('Erro ao buscar perfil do usuário:', error);
    res.status(500).json({ message: 'Erro ao buscar perfil do usuário.' });
  }
};

// @desc    Atualizar perfil do usuário autenticado
// @route   PUT /api/auth/profile
// @access  Private
export const updateProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const { name, email, password, address, phone, cnpj } = req.body;
    let updateData = { name, email, address, phone, cnpj };
    if (password) {
      const hashedPassword = await bcrypt.hash(password, 10);
      updateData.password = hashedPassword;
    }
    const updatedUser = await updateUserService(userId, updateData);
    res.status(200).json(updatedUser);
  } catch (error) {
    console.error('Erro ao atualizar perfil do usuário:', error);
    res.status(500).json({ message: 'Erro ao atualizar perfil do usuário.' });
  }
};
