/**
 * API Specification
 * 
 * This file documents the structure and endpoints of the API
 */

export const apiSpec = {
  info: {
    title: 'Marmitas API',
    version: '1.0.0',
    description: 'API for the Marmitas application'
  },
  basePath: '/api',
  endpoints: [
    {
      path: '/auth',
      methods: {
        post: {
          login: {
            description: 'Authenticate user and return token',
            request: {
              body: {
                email: 'string',
                password: 'string'
              }
            },
            response: {
              200: {
                user: {
                  id: 'string',
                  email: 'string',
                  name: 'string'
                },
                token: 'string'
              }
            }
          },
          register: {
            description: 'Register a new user',
            request: {
              body: {
                email: 'string',
                password: 'string',
                name: 'string'
              }
            },
            response: {
              201: {
                user: {
                  id: 'string',
                  email: 'string',
                  name: 'string'
                },
                token: 'string'
              }
            }
          }
        }
      }
    },
    {
      path: '/users',
      methods: {
        get: {
          description: 'Get list of users (admin only)',
          auth: true,
          role: 'admin',
          query: {
            page: 'number?',
            pageSize: 'number?',
            sort: 'string?',
            direction: 'asc|desc?'
          },
          response: {
            200: {
              data: [
                {
                  id: 'string',
                  email: 'string',
                  name: 'string',
                  createdAt: 'string',
                  updatedAt: 'string'
                }
              ],
              pagination: {
                total: 'number',
                page: 'number',
                pageSize: 'number',
                totalPages: 'number'
              }
            }
          }
        }
      },
      subpaths: {
        '/:id': {
          methods: {
            get: {
              description: 'Get user by ID',
              auth: true,
              params: {
                id: 'string'
              },
              response: {
                200: {
                  id: 'string',
                  email: 'string',
                  name: 'string',
                  createdAt: 'string',
                  updatedAt: 'string'
                }
              }
            },
            put: {
              description: 'Update user',
              auth: true,
              params: {
                id: 'string'
              },
              request: {
                body: {
                  name: 'string?',
                  email: 'string?'
                }
              },
              response: {
                200: {
                  id: 'string',
                  email: 'string',
                  name: 'string',
                  createdAt: 'string',
                  updatedAt: 'string'
                }
              }
            },
            delete: {
              description: 'Delete user',
              auth: true,
              params: {
                id: 'string'
              },
              response: {
                204: 'No content'
              }
            }
          }
        },
        '/me': {
          methods: {
            get: {
              description: 'Get current user profile',
              auth: true,
              response: {
                200: {
                  id: 'string',
                  email: 'string',
                  name: 'string',
                  createdAt: 'string',
                  updatedAt: 'string'
                }
              }
            },
            put: {
              description: 'Update current user profile',
              auth: true,
              request: {
                body: {
                  name: 'string?',
                  email: 'string?'
                }
              },
              response: {
                200: {
                  id: 'string',
                  email: 'string',
                  name: 'string',
                  createdAt: 'string',
                  updatedAt: 'string'
                }
              }
            }
          }
        }
      }
    },
    {
      path: '/products',
      methods: {
        get: {
          description: 'Get list of products',
          query: {
            page: 'number?',
            pageSize: 'number?',
            sort: 'string?',
            direction: 'asc|desc?',
            category: 'string?'
          },
          response: {
            200: {
              data: [
                {
                  id: 'string',
                  name: 'string',
                  description: 'string',
                  price: 'number',
                  imageUrl: 'string?',
                  category: 'string',
                  isAvailable: 'boolean',
                  createdAt: 'string',
                  updatedAt: 'string'
                }
              ],
              pagination: {
                total: 'number',
                page: 'number',
                pageSize: 'number',
                totalPages: 'number'
              }
            }
          }
        },
        post: {
          description: 'Create a new product',
          auth: true,
          role: 'admin',
          request: {
            body: {
              name: 'string',
              description: 'string',
              price: 'number',
              imageUrl: 'string?',
              category: 'string',
              isAvailable: 'boolean?'
            }
          },
          response: {
            201: {
              id: 'string',
              name: 'string',
              description: 'string',
              price: 'number',
              imageUrl: 'string?',
              category: 'string',
              isAvailable: 'boolean',
              createdAt: 'string',
              updatedAt: 'string'
            }
          }
        }
      },
      subpaths: {
        '/:id': {
          methods: {
            get: {
              description: 'Get product by ID',
              params: {
                id: 'string'
              },
              response: {
                200: {
                  id: 'string',
                  name: 'string',
                  description: 'string',
                  price: 'number',
                  imageUrl: 'string?',
                  category: 'string',
                  isAvailable: 'boolean',
                  createdAt: 'string',
                  updatedAt: 'string'
                }
              }
            },
            put: {
              description: 'Update product',
              auth: true,
              role: 'admin',
              params: {
                id: 'string'
              },
              request: {
                body: {
                  name: 'string?',
                  description: 'string?',
                  price: 'number?',
                  imageUrl: 'string?',
                  category: 'string?',
                  isAvailable: 'boolean?'
                }
              },
              response: {
                200: {
                  id: 'string',
                  name: 'string',
                  description: 'string',
                  price: 'number',
                  imageUrl: 'string?',
                  category: 'string',
                  isAvailable: 'boolean',
                  createdAt: 'string',
                  updatedAt: 'string'
                }
              }
            },
            delete: {
              description: 'Delete product',
              auth: true,
              role: 'admin',
              params: {
                id: 'string'
              },
              response: {
                204: 'No content'
              }
            }
          }
        }
      }
    },
    {
      path: '/orders',
      methods: {
        get: {
          description: 'Get list of orders for current user',
          auth: true,
          query: {
            page: 'number?',
            pageSize: 'number?',
            sort: 'string?',
            direction: 'asc|desc?',
            status: 'string?'
          },
          response: {
            200: {
              data: [
                {
                  id: 'string',
                  userId: 'string',
                  status: 'string',
                  totalAmount: 'number',
                  items: [
                    {
                      id: 'string',
                      orderId: 'string',
                      productId: 'string',
                      quantity: 'number',
                      unitPrice: 'number',
                      subtotal: 'number'
                    }
                  ],
                  deliveryAddress: 'string?',
                  createdAt: 'string',
                  updatedAt: 'string'
                }
              ],
              pagination: {
                total: 'number',
                page: 'number',
                pageSize: 'number',
                totalPages: 'number'
              }
            }
          }
        },
        post: {
          description: 'Create a new order',
          auth: true,
          request: {
            body: {
              items: [
                {
                  productId: 'string',
                  quantity: 'number'
                }
              ],
              deliveryAddress: 'string?'
            }
          },
          response: {
            201: {
              id: 'string',
              userId: 'string',
              status: 'string',
              totalAmount: 'number',
              items: [
                {
                  id: 'string',
                  orderId: 'string',
                  productId: 'string',
                  quantity: 'number',
                  unitPrice: 'number',
                  subtotal: 'number'
                }
              ],
              deliveryAddress: 'string?',
              createdAt: 'string',
              updatedAt: 'string'
            }
          }
        }
      },
      subpaths: {
        '/:id': {
          methods: {
            get: {
              description: 'Get order by ID',
              auth: true,
              params: {
                id: 'string'
              },
              response: {
                200: {
                  id: 'string',
                  userId: 'string',
                  status: 'string',
                  totalAmount: 'number',
                  items: [
                    {
                      id: 'string',
                      orderId: 'string',
                      productId: 'string',
                      quantity: 'number',
                      unitPrice: 'number',
                      subtotal: 'number'
                    }
                  ],
                  deliveryAddress: 'string?',
                  createdAt: 'string',
                  updatedAt: 'string'
                }
              }
            },
            put: {
              description: 'Update order status',
              auth: true,
              params: {
                id: 'string'
              },
              request: {
                body: {
                  status: 'string?',
                  deliveryAddress: 'string?'
                }
              },
              response: {
                200: {
                  id: 'string',
                  userId: 'string',
                  status: 'string',
                  totalAmount: 'number',
                  items: [
                    {
                      id: 'string',
                      orderId: 'string',
                      productId: 'string',
                      quantity: 'number',
                      unitPrice: 'number',
                      subtotal: 'number'
                    }
                  ],
                  deliveryAddress: 'string?',
                  createdAt: 'string',
                  updatedAt: 'string'
                }
              }
            },
            delete: {
              description: 'Cancel order',
              auth: true,
              params: {
                id: 'string'
              },
              response: {
                204: 'No content'
              }
            }
          }
        }
      }
    }
  ]
}; 