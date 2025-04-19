/**
 * API Specification
 *
 * This file documents the structure and endpoints of the API
 */
export declare const apiSpec: {
    info: {
        title: string;
        version: string;
        description: string;
    };
    basePath: string;
    endpoints: ({
        path: string;
        methods: {
            post: {
                login: {
                    description: string;
                    request: {
                        body: {
                            email: string;
                            password: string;
                        };
                    };
                    response: {
                        200: {
                            user: {
                                id: string;
                                email: string;
                                name: string;
                            };
                            token: string;
                        };
                    };
                };
                register: {
                    description: string;
                    request: {
                        body: {
                            email: string;
                            password: string;
                            name: string;
                        };
                    };
                    response: {
                        201: {
                            user: {
                                id: string;
                                email: string;
                                name: string;
                            };
                            token: string;
                        };
                    };
                };
                description?: undefined;
                auth?: undefined;
                role?: undefined;
                request?: undefined;
                response?: undefined;
            };
            get?: undefined;
        };
        subpaths?: undefined;
    } | {
        path: string;
        methods: {
            get: {
                description: string;
                auth: boolean;
                role: string;
                query: {
                    page: string;
                    pageSize: string;
                    sort: string;
                    direction: string;
                    category?: undefined;
                    status?: undefined;
                };
                response: {
                    200: {
                        data: {
                            id: string;
                            email: string;
                            name: string;
                            createdAt: string;
                            updatedAt: string;
                        }[];
                        pagination: {
                            total: string;
                            page: string;
                            pageSize: string;
                            totalPages: string;
                        };
                    };
                };
            };
            post?: undefined;
        };
        subpaths: {
            '/:id': {
                methods: {
                    get: {
                        description: string;
                        auth: boolean;
                        params: {
                            id: string;
                        };
                        response: {
                            200: {
                                id: string;
                                email: string;
                                name: string;
                                createdAt: string;
                                updatedAt: string;
                                description?: undefined;
                                price?: undefined;
                                imageUrl?: undefined;
                                category?: undefined;
                                isAvailable?: undefined;
                                userId?: undefined;
                                status?: undefined;
                                totalAmount?: undefined;
                                items?: undefined;
                                deliveryAddress?: undefined;
                            };
                        };
                    };
                    put: {
                        description: string;
                        auth: boolean;
                        params: {
                            id: string;
                        };
                        request: {
                            body: {
                                name: string;
                                email: string;
                                description?: undefined;
                                price?: undefined;
                                imageUrl?: undefined;
                                category?: undefined;
                                isAvailable?: undefined;
                                status?: undefined;
                                deliveryAddress?: undefined;
                            };
                        };
                        response: {
                            200: {
                                id: string;
                                email: string;
                                name: string;
                                createdAt: string;
                                updatedAt: string;
                                description?: undefined;
                                price?: undefined;
                                imageUrl?: undefined;
                                category?: undefined;
                                isAvailable?: undefined;
                                userId?: undefined;
                                status?: undefined;
                                totalAmount?: undefined;
                                items?: undefined;
                                deliveryAddress?: undefined;
                            };
                        };
                        role?: undefined;
                    };
                    delete: {
                        description: string;
                        auth: boolean;
                        params: {
                            id: string;
                        };
                        response: {
                            204: string;
                        };
                        role?: undefined;
                    };
                };
            };
            '/me': {
                methods: {
                    get: {
                        description: string;
                        auth: boolean;
                        response: {
                            200: {
                                id: string;
                                email: string;
                                name: string;
                                createdAt: string;
                                updatedAt: string;
                            };
                        };
                    };
                    put: {
                        description: string;
                        auth: boolean;
                        request: {
                            body: {
                                name: string;
                                email: string;
                            };
                        };
                        response: {
                            200: {
                                id: string;
                                email: string;
                                name: string;
                                createdAt: string;
                                updatedAt: string;
                            };
                        };
                    };
                };
            };
        };
    } | {
        path: string;
        methods: {
            get: {
                description: string;
                query: {
                    page: string;
                    pageSize: string;
                    sort: string;
                    direction: string;
                    category: string;
                    status?: undefined;
                };
                response: {
                    200: {
                        data: {
                            id: string;
                            name: string;
                            description: string;
                            price: string;
                            imageUrl: string;
                            category: string;
                            isAvailable: string;
                            createdAt: string;
                            updatedAt: string;
                        }[];
                        pagination: {
                            total: string;
                            page: string;
                            pageSize: string;
                            totalPages: string;
                        };
                    };
                };
                auth?: undefined;
                role?: undefined;
            };
            post: {
                description: string;
                auth: boolean;
                role: string;
                request: {
                    body: {
                        name: string;
                        description: string;
                        price: string;
                        imageUrl: string;
                        category: string;
                        isAvailable: string;
                        items?: undefined;
                        deliveryAddress?: undefined;
                    };
                };
                response: {
                    201: {
                        id: string;
                        name: string;
                        description: string;
                        price: string;
                        imageUrl: string;
                        category: string;
                        isAvailable: string;
                        createdAt: string;
                        updatedAt: string;
                        userId?: undefined;
                        status?: undefined;
                        totalAmount?: undefined;
                        items?: undefined;
                        deliveryAddress?: undefined;
                    };
                };
                login?: undefined;
                register?: undefined;
            };
        };
        subpaths: {
            '/:id': {
                methods: {
                    get: {
                        description: string;
                        params: {
                            id: string;
                        };
                        response: {
                            200: {
                                id: string;
                                name: string;
                                description: string;
                                price: string;
                                imageUrl: string;
                                category: string;
                                isAvailable: string;
                                createdAt: string;
                                updatedAt: string;
                                email?: undefined;
                                userId?: undefined;
                                status?: undefined;
                                totalAmount?: undefined;
                                items?: undefined;
                                deliveryAddress?: undefined;
                            };
                        };
                        auth?: undefined;
                    };
                    put: {
                        description: string;
                        auth: boolean;
                        role: string;
                        params: {
                            id: string;
                        };
                        request: {
                            body: {
                                name: string;
                                description: string;
                                price: string;
                                imageUrl: string;
                                category: string;
                                isAvailable: string;
                                email?: undefined;
                                status?: undefined;
                                deliveryAddress?: undefined;
                            };
                        };
                        response: {
                            200: {
                                id: string;
                                name: string;
                                description: string;
                                price: string;
                                imageUrl: string;
                                category: string;
                                isAvailable: string;
                                createdAt: string;
                                updatedAt: string;
                                email?: undefined;
                                userId?: undefined;
                                status?: undefined;
                                totalAmount?: undefined;
                                items?: undefined;
                                deliveryAddress?: undefined;
                            };
                        };
                    };
                    delete: {
                        description: string;
                        auth: boolean;
                        role: string;
                        params: {
                            id: string;
                        };
                        response: {
                            204: string;
                        };
                    };
                };
            };
            '/me'?: undefined;
        };
    } | {
        path: string;
        methods: {
            get: {
                description: string;
                auth: boolean;
                query: {
                    page: string;
                    pageSize: string;
                    sort: string;
                    direction: string;
                    status: string;
                    category?: undefined;
                };
                response: {
                    200: {
                        data: {
                            id: string;
                            userId: string;
                            status: string;
                            totalAmount: string;
                            items: {
                                id: string;
                                orderId: string;
                                productId: string;
                                quantity: string;
                                unitPrice: string;
                                subtotal: string;
                            }[];
                            deliveryAddress: string;
                            createdAt: string;
                            updatedAt: string;
                        }[];
                        pagination: {
                            total: string;
                            page: string;
                            pageSize: string;
                            totalPages: string;
                        };
                    };
                };
                role?: undefined;
            };
            post: {
                description: string;
                auth: boolean;
                request: {
                    body: {
                        items: {
                            productId: string;
                            quantity: string;
                        }[];
                        deliveryAddress: string;
                        name?: undefined;
                        description?: undefined;
                        price?: undefined;
                        imageUrl?: undefined;
                        category?: undefined;
                        isAvailable?: undefined;
                    };
                };
                response: {
                    201: {
                        id: string;
                        userId: string;
                        status: string;
                        totalAmount: string;
                        items: {
                            id: string;
                            orderId: string;
                            productId: string;
                            quantity: string;
                            unitPrice: string;
                            subtotal: string;
                        }[];
                        deliveryAddress: string;
                        createdAt: string;
                        updatedAt: string;
                        name?: undefined;
                        description?: undefined;
                        price?: undefined;
                        imageUrl?: undefined;
                        category?: undefined;
                        isAvailable?: undefined;
                    };
                };
                login?: undefined;
                register?: undefined;
                role?: undefined;
            };
        };
        subpaths: {
            '/:id': {
                methods: {
                    get: {
                        description: string;
                        auth: boolean;
                        params: {
                            id: string;
                        };
                        response: {
                            200: {
                                id: string;
                                userId: string;
                                status: string;
                                totalAmount: string;
                                items: {
                                    id: string;
                                    orderId: string;
                                    productId: string;
                                    quantity: string;
                                    unitPrice: string;
                                    subtotal: string;
                                }[];
                                deliveryAddress: string;
                                createdAt: string;
                                updatedAt: string;
                                email?: undefined;
                                name?: undefined;
                                description?: undefined;
                                price?: undefined;
                                imageUrl?: undefined;
                                category?: undefined;
                                isAvailable?: undefined;
                            };
                        };
                    };
                    put: {
                        description: string;
                        auth: boolean;
                        params: {
                            id: string;
                        };
                        request: {
                            body: {
                                status: string;
                                deliveryAddress: string;
                                name?: undefined;
                                email?: undefined;
                                description?: undefined;
                                price?: undefined;
                                imageUrl?: undefined;
                                category?: undefined;
                                isAvailable?: undefined;
                            };
                        };
                        response: {
                            200: {
                                id: string;
                                userId: string;
                                status: string;
                                totalAmount: string;
                                items: {
                                    id: string;
                                    orderId: string;
                                    productId: string;
                                    quantity: string;
                                    unitPrice: string;
                                    subtotal: string;
                                }[];
                                deliveryAddress: string;
                                createdAt: string;
                                updatedAt: string;
                                email?: undefined;
                                name?: undefined;
                                description?: undefined;
                                price?: undefined;
                                imageUrl?: undefined;
                                category?: undefined;
                                isAvailable?: undefined;
                            };
                        };
                        role?: undefined;
                    };
                    delete: {
                        description: string;
                        auth: boolean;
                        params: {
                            id: string;
                        };
                        response: {
                            204: string;
                        };
                        role?: undefined;
                    };
                };
            };
            '/me'?: undefined;
        };
    })[];
};
//# sourceMappingURL=api-spec.d.ts.map