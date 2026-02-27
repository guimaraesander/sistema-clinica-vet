import dotenv from 'dotenv';
dotenv.config();

export const PORT = process.env.PORT || 3001;
export const DATABASE_URL = process.env.DATABASE_URL;
export const JWT_SECRET = process.env.JWT_SECRET;
export const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN;
export const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';
export const CORS_ORIGINS = (process.env.CORS_ORIGINS || '')
	.split(',')
	.map((s) => s.trim())
	.filter(Boolean);