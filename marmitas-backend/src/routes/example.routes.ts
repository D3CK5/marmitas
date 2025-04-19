import express from 'express';
import { exampleController } from '../controllers/example.controller.js';

const router = express.Router();

// GET /api/examples
router.get('/', exampleController.getItems.bind(exampleController));

// GET /api/examples/:id
router.get('/:id', exampleController.getItemById.bind(exampleController));

// POST /api/examples
router.post('/', exampleController.createItem.bind(exampleController));

// PUT /api/examples/:id
router.put('/:id', exampleController.updateItem.bind(exampleController));

// DELETE /api/examples/:id
router.delete('/:id', exampleController.deleteItem.bind(exampleController));

export const exampleRoutes = router;
export default exampleRoutes; 