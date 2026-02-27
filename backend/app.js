import express from 'express';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import path from 'path';
import { fileURLToPath } from 'url';
import cors from 'cors';
import fs from 'fs';

import { FRONTEND_URL, CORS_ORIGINS } from './src/config/env.js';
import { errorHandler } from './src/middleware/errorMiddleware.js';

// Rotas (vamos manter auth e products por enquanto)
import authRoutes from './src/routes/authRoutes.js';
import productRoutes from './src/routes/productRoutes.js';
import caixaRoutes from './src/routes/caixaRoutes.js';
import debugRoutes from './src/routes/debugRoutes.js';

const app = express();

// Hardening básico
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}));

// Rate limit (produção)
const isProd = process.env.NODE_ENV === 'production';
const authLimiter = isProd
  ? rateLimit({
      windowMs: 15 * 60 * 1000,
      max: 100,
      standardHeaders: true,
      legacyHeaders: false,
      message: {
        message: 'Muitas tentativas. Aguarde alguns minutos e tente novamente.'
      }
    })
  : (req, res, next) => next();

// CORS
const allowedOrigins = new Set([FRONTEND_URL, 'http://localhost:5173', ...(CORS_ORIGINS || [])]);

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true); // Postman/curl
    if (allowedOrigins.has(origin)) return callback(null, true);

    try {
      const host = new URL(origin).host;
      if (host.endsWith('.vercel.app')) return callback(null, true);
    } catch (_) {}

    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true
}));

app.use(express.json());

// Static uploads (pode manter; não atrapalha)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
app.use('/uploads', express.static(path.join(__dirname, 'src', 'uploads')));

// Healthcheck simples
app.get('/api/health', (req, res) => {
  res.status(200).json({ success: true, message: 'API Clínica Vet OK' });
});

// Rotas
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/caixa', caixaRoutes);
app.use('/api/debug', debugRoutes);

// Servir frontend buildado (quando existir)
const frontendDist = path.resolve(__dirname, "..", "frontend", "dist");
const indexHtml = path.join(frontendDist, "index.html");

if (fs.existsSync(indexHtml)) {
  app.use(express.static(frontendDist));

  app.get("*", (req, res, next) => {
    if (req.path.startsWith("/api") || req.path.startsWith("/uploads")) return next();
    res.sendFile(indexHtml);
  });
}

// 404 (rota não encontrada)
app.use((req, res) => {
  res.status(404).json({
    error: `Rota não encontrada: ${req.method} ${req.originalUrl}`,
    code: "not_found",
  });
});

// Erros da aplicação (JSON)
app.use(errorHandler);

export default app;