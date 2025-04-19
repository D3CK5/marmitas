import express from 'express';
import { apiSpec } from '../docs/api-spec.js';

const router = express.Router();

// GET /api/docs - API documentation
router.get('/', (req, res) => {
  res.json(apiSpec);
});

// GET /api/docs/endpoints - List all endpoints
router.get('/endpoints', (req, res) => {
  const endpoints = apiSpec.endpoints.map(endpoint => {
    return {
      path: endpoint.path,
      methods: Object.keys(endpoint.methods)
    };
  });
  
  res.json({
    basePath: apiSpec.basePath,
    endpoints
  });
});

export const docsRoutes = router;
export default docsRoutes; 