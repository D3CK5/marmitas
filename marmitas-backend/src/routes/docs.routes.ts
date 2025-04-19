import express from 'express';
import { apiGateway } from '../config/api-gateway.config.js';

const router = express.Router();

// GET /api/docs - API documentation
router.get('/', (_req, res) => {
  res.json({
    message: 'API Documentation',
    status: 'Under construction'
  });
});

// GET /api/docs/endpoints - List of endpoints
router.get('/endpoints', (_req, res) => {
  const routes = apiGateway.getRoutesInfo();
  
  res.json({
    endpoints: routes.map(route => ({
      path: route.path,
      authRequired: route.authRequired,
      isHighlySensitive: route.isHighlySensitive || false
    }))
  });
});

export const docsRoutes = router;
export default docsRoutes; 