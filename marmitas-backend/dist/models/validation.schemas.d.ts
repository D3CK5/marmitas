import { z } from 'zod';
/**
 * Validation schemas for API requests
 */
export declare const loginSchema: z.ZodObject<{
    email: z.ZodString;
    password: z.ZodString;
}, "strip", z.ZodTypeAny, {
    password: string;
    email: string;
}, {
    password: string;
    email: string;
}>;
export declare const registerSchema: z.ZodObject<{
    email: z.ZodString;
    password: z.ZodString;
    name: z.ZodString;
}, "strip", z.ZodTypeAny, {
    password: string;
    email: string;
    name: string;
}, {
    password: string;
    email: string;
    name: string;
}>;
export declare const updateUserSchema: z.ZodEffects<z.ZodObject<{
    name: z.ZodOptional<z.ZodString>;
    email: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    email?: string | undefined;
    name?: string | undefined;
}, {
    email?: string | undefined;
    name?: string | undefined;
}>, {
    email?: string | undefined;
    name?: string | undefined;
}, {
    email?: string | undefined;
    name?: string | undefined;
}>;
export declare const createProductSchema: z.ZodObject<{
    name: z.ZodString;
    description: z.ZodString;
    price: z.ZodNumber;
    imageUrl: z.ZodOptional<z.ZodString>;
    category: z.ZodString;
    isAvailable: z.ZodDefault<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    name: string;
    description: string;
    price: number;
    category: string;
    isAvailable: boolean;
    imageUrl?: string | undefined;
}, {
    name: string;
    description: string;
    price: number;
    category: string;
    imageUrl?: string | undefined;
    isAvailable?: boolean | undefined;
}>;
export declare const updateProductSchema: z.ZodEffects<z.ZodObject<{
    name: z.ZodOptional<z.ZodString>;
    description: z.ZodOptional<z.ZodString>;
    price: z.ZodOptional<z.ZodNumber>;
    imageUrl: z.ZodOptional<z.ZodString>;
    category: z.ZodOptional<z.ZodString>;
    isAvailable: z.ZodOptional<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    name?: string | undefined;
    description?: string | undefined;
    price?: number | undefined;
    imageUrl?: string | undefined;
    category?: string | undefined;
    isAvailable?: boolean | undefined;
}, {
    name?: string | undefined;
    description?: string | undefined;
    price?: number | undefined;
    imageUrl?: string | undefined;
    category?: string | undefined;
    isAvailable?: boolean | undefined;
}>, {
    name?: string | undefined;
    description?: string | undefined;
    price?: number | undefined;
    imageUrl?: string | undefined;
    category?: string | undefined;
    isAvailable?: boolean | undefined;
}, {
    name?: string | undefined;
    description?: string | undefined;
    price?: number | undefined;
    imageUrl?: string | undefined;
    category?: string | undefined;
    isAvailable?: boolean | undefined;
}>;
export declare const orderItemSchema: z.ZodObject<{
    productId: z.ZodString;
    quantity: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    productId: string;
    quantity: number;
}, {
    productId: string;
    quantity: number;
}>;
export declare const createOrderSchema: z.ZodObject<{
    items: z.ZodArray<z.ZodObject<{
        productId: z.ZodString;
        quantity: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        productId: string;
        quantity: number;
    }, {
        productId: string;
        quantity: number;
    }>, "many">;
    deliveryAddress: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    items: {
        productId: string;
        quantity: number;
    }[];
    deliveryAddress?: string | undefined;
}, {
    items: {
        productId: string;
        quantity: number;
    }[];
    deliveryAddress?: string | undefined;
}>;
export declare const updateOrderSchema: z.ZodEffects<z.ZodObject<{
    status: z.ZodOptional<z.ZodEnum<["pending", "processing", "completed", "cancelled"]>>;
    deliveryAddress: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    status?: "pending" | "processing" | "completed" | "cancelled" | undefined;
    deliveryAddress?: string | undefined;
}, {
    status?: "pending" | "processing" | "completed" | "cancelled" | undefined;
    deliveryAddress?: string | undefined;
}>, {
    status?: "pending" | "processing" | "completed" | "cancelled" | undefined;
    deliveryAddress?: string | undefined;
}, {
    status?: "pending" | "processing" | "completed" | "cancelled" | undefined;
    deliveryAddress?: string | undefined;
}>;
export declare const paginationSchema: z.ZodObject<{
    page: z.ZodDefault<z.ZodNumber>;
    pageSize: z.ZodDefault<z.ZodNumber>;
    sort: z.ZodDefault<z.ZodString>;
    direction: z.ZodDefault<z.ZodEnum<["asc", "desc"]>>;
}, "strip", z.ZodTypeAny, {
    sort: string;
    page: number;
    pageSize: number;
    direction: "asc" | "desc";
}, {
    sort?: string | undefined;
    page?: number | undefined;
    pageSize?: number | undefined;
    direction?: "asc" | "desc" | undefined;
}>;
//# sourceMappingURL=validation.schemas.d.ts.map