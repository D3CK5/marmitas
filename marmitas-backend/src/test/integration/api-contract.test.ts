/**
 * API Contract Tests
 * 
 * These tests validate that the backend API adheres to the contracts expected by the frontend.
 * They ensure that API responses conform to the expected structure and data types.
 */

import { Server } from 'http';
import { setupTestServer, closeTestServer, createTestToken } from './setup';
import { request as supertest } from 'supertest';

// Import shared types
import { User } from 'marmitas-types/src/models/user';

describe('API Contract Tests', () => {
  let server: Server;
  let request: supertest.SuperTest<supertest.Test>;
  let authToken: string;

  beforeAll(() => {
    const setup = setupTestServer();
    server = setup.server;
    request = setup.request;
    
    // Create an authentication token for the tests
    authToken = createTestToken();
  });

  afterAll(async () => {
    await closeTestServer(server);
  });

  describe('Authentication Endpoints', () => {
    test('POST /api/auth/login returns expected response structure', async () => {
      const credentials = {
        email: 'test@example.com',
        password: 'testPassword123',
      };

      // This test will fail if the credentials are valid, but we're testing the structure
      const response = await request
        .post('/api/auth/login')
        .send(credentials)
        .expect((res) => {
          // We expect either a 200 (success) or 401 (invalid credentials)
          // Both cases should have a well-defined structure
          if (res.status !== 200 && res.status !== 401) {
            throw new Error(`Unexpected status code: ${res.status}`);
          }
        });

      if (response.status === 200) {
        // If login was successful, validate the response structure
        expect(response.body).toHaveProperty('data');
        expect(response.body.data).toHaveProperty('token');
        expect(response.body.data).toHaveProperty('user');
        expect(response.body.data.user).toHaveProperty('id');
        expect(response.body.data.user).toHaveProperty('email');
      } else {
        // If login failed, validate the error structure
        expect(response.body).toHaveProperty('error');
        expect(response.body.error).toHaveProperty('message');
      }
    });

    test('GET /api/auth/profile returns expected user structure', async () => {
      const response = await request
        .get('/api/auth/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .expect((res) => {
          // We expect either 200 (valid token) or 401 (invalid token)
          if (res.status !== 200 && res.status !== 401) {
            throw new Error(`Unexpected status code: ${res.status}`);
          }
        });

      if (response.status === 200) {
        // If profile retrieval was successful, validate user structure
        expect(response.body).toHaveProperty('data');
        
        // Validate user structure against shared types
        const user = response.body.data as User;
        expect(user).toHaveProperty('id');
        expect(user).toHaveProperty('email');
        expect(typeof user.id).toBe('string');
        expect(typeof user.email).toBe('string');
      } else {
        // If profile retrieval failed, validate error structure
        expect(response.body).toHaveProperty('error');
        expect(response.body.error).toHaveProperty('message');
      }
    });
  });

  describe('API Response Structure', () => {
    test('Successful responses follow standard structure', async () => {
      const response = await request
        .get('/api/health')
        .expect(200);

      expect(response.body).toHaveProperty('status');
      expect(response.body.status).toBe('ok');
    });

    test('Error responses follow standard structure', async () => {
      const response = await request
        .get('/api/non-existent-route')
        .expect(404);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toHaveProperty('message');
      expect(response.body.error).toHaveProperty('status');
      expect(response.body.error.status).toBe(404);
    });
  });
}); 