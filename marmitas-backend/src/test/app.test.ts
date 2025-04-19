import request from 'supertest';
import express from 'express';
import { describe, it, expect, beforeEach } from '@jest/globals';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';

// Simular o app para testes
const createTestApp = () => {
  const app = express();
  
  // Middleware básico
  app.use(cors());
  app.use(helmet());
  app.use(morgan('dev'));
  app.use(express.json());
  
  // Rota de saúde para testes
  app.get('/health', (req, res) => {
    res.status(200).json({ status: 'ok', version: '1.0.0' });
  });
  
  // Rota de API básica para testes
  app.get('/api', (req, res) => {
    res.status(200).json({ message: 'API funcionando' });
  });
  
  return app;
};

describe('Servidor Express', () => {
  let app: express.Application;
  
  beforeEach(() => {
    app = createTestApp();
  });
  
  it('deve responder à rota de saúde', async () => {
    const response = await request(app).get('/health');
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('status', 'ok');
    expect(response.body).toHaveProperty('version');
  });
  
  it('deve responder à rota de API básica', async () => {
    const response = await request(app).get('/api');
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('message', 'API funcionando');
  });
  
  it('deve retornar 404 para rotas não existentes', async () => {
    const response = await request(app).get('/rota-nao-existente');
    
    expect(response.status).toBe(404);
  });
}); 