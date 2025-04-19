/**
 * Integration Test Framework Setup
 * 
 * This file sets up the necessary configuration and utilities for integration tests
 * between the frontend and backend components of the separated system.
 */

import { Server } from 'http';
import express from 'express';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';

// Import app creation function (without starting the server)
import { createApp } from '../../index';

// Environment setup for tests
process.env.NODE_ENV = 'test';

interface TestUser {
  id: string;
  email: string;
  role: string;
}

export const createTestToken = (user: Partial<TestUser> = {}): string => {
  const testUser: TestUser = {
    id: user.id || uuidv4(),
    email: user.email || 'test@example.com',
    role: user.role || 'user',
  };
  
  // Using the same secret as in the auth service
  const jwtSecret = process.env.JWT_SECRET || 'test-integration-secret';
  return jwt.sign(testUser, jwtSecret, { expiresIn: '1h' });
};

export const setupTestServer = (): {
  app: express.Application;
  server: Server;
  request: request.SuperTest<request.Test>;
} => {
  // Create Express app
  const app = createApp();
  
  // Create server but don't listen on a port
  const server = new Server(app);
  
  // Return test utilities
  return {
    app,
    server,
    request: request(app),
  };
};

export const closeTestServer = (server: Server): Promise<void> => {
  return new Promise((resolve, reject) => {
    server.close((err) => {
      if (err) return reject(err);
      resolve();
    });
  });
};

// Helper to create authenticated request
export const createAuthRequest = (token: string, req: request.Test): request.Test => {
  return req.set('Authorization', `Bearer ${token}`);
}; 