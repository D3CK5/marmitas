import { Request, Response } from 'express';
/**
 * ExampleController - Example controller to demonstrate API structure
 */
export declare class ExampleController {
    /**
     * Get a list of items
     */
    getItems(req: Request, res: Response): Promise<void>;
    /**
     * Get a single item by ID
     */
    getItemById(req: Request, res: Response): Promise<void>;
    /**
     * Create a new item
     */
    createItem(req: Request, res: Response): Promise<void>;
    /**
     * Update an existing item
     */
    updateItem(req: Request, res: Response): Promise<void>;
    /**
     * Delete an item
     */
    deleteItem(req: Request, res: Response): Promise<void>;
}
export declare const exampleController: ExampleController;
export default exampleController;
//# sourceMappingURL=example.controller.d.ts.map