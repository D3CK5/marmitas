import { Request, Response } from 'express';
import { dbService } from '../services/database.service.js';

/**
 * ExampleController - Example controller to demonstrate API structure
 */
export class ExampleController {
  /**
   * Get a list of items
   */
  async getItems(req: Request, res: Response): Promise<void> {
    try {
      const items = await dbService.find('example_table', {
        limit: parseInt(req.query.limit as string) || 10,
        offset: parseInt(req.query.offset as string) || 0,
      });
      
      res.json({ items });
    } catch (error: any) {
      res.status(500).json({
        error: {
          message: error.message || 'Failed to retrieve items',
        },
      });
    }
  }

  /**
   * Get a single item by ID
   */
  async getItemById(req: Request, res: Response): Promise<void> {
    try {
      const item = await dbService.findById('example_table', req.params.id);
      
      if (!item) {
        res.status(404).json({
          error: {
            message: 'Item not found',
          },
        });
        return;
      }
      
      res.json({ item });
    } catch (error: any) {
      res.status(500).json({
        error: {
          message: error.message || 'Failed to retrieve item',
        },
      });
    }
  }

  /**
   * Create a new item
   */
  async createItem(req: Request, res: Response): Promise<void> {
    try {
      const newItem = await dbService.create('example_table', req.body);
      res.status(201).json({ item: newItem });
    } catch (error: any) {
      res.status(500).json({
        error: {
          message: error.message || 'Failed to create item',
        },
      });
    }
  }

  /**
   * Update an existing item
   */
  async updateItem(req: Request, res: Response): Promise<void> {
    try {
      const updatedItem = await dbService.update('example_table', req.params.id, req.body);
      res.json({ item: updatedItem });
    } catch (error: any) {
      res.status(500).json({
        error: {
          message: error.message || 'Failed to update item',
        },
      });
    }
  }

  /**
   * Delete an item
   */
  async deleteItem(req: Request, res: Response): Promise<void> {
    try {
      await dbService.delete('example_table', req.params.id);
      res.status(204).send();
    } catch (error: any) {
      res.status(500).json({
        error: {
          message: error.message || 'Failed to delete item',
        },
      });
    }
  }
}

// Export a singleton instance
export const exampleController = new ExampleController();
export default exampleController; 