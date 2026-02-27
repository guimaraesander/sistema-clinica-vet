import { PrismaClient } from '@prisma/client';
import { customAlphabet } from 'nanoid';

const prisma = new PrismaClient();

const userSelect = {
    id: true,
    name: true,
    email: true,
    role: true,
    address: true,
    phone: true,
    cnpj: true,
    status: true,
    createdAt: true,
    updatedAt: true,
};

export const getUserByEmailService = async (email) => {
    return prisma.user.findUnique({ where: { email } });
};

export const getUserByCnpjService = async (cnpj) => {
    if (!cnpj) return null;
    return prisma.user.findFirst({ where: { cnpj } });
};

export const createUserService = async (data) => {
    const nanoid = customAlphabet("0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ", 8);
    const userId = nanoid();
    const userData = { ...data, id: userId };
    return prisma.user.create({ data: userData });
};

export const getAllUsersService = async () => {
    return prisma.user.findMany({ select: userSelect });
};

export const getUserByIdService = async (id) => {
    return prisma.user.findUnique({ where: { id }, select: userSelect });
};

export const updateUserService = async (id, data) => {
    return prisma.user.update({ where: { id }, data, select: userSelect });
};

export const deleteUserService = async (id) => {
    return prisma.user.delete({ where: { id } });
};