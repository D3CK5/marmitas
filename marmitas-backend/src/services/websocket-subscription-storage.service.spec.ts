import { describe, expect, it, beforeEach } from 'vitest';
import { websocketSubscriptionStorageService, StoredSubscription } from './websocket-subscription-storage.service.js';

describe('WebSocketSubscriptionStorageService', () => {
  beforeEach(() => {
    // Reset state before each test
    websocketSubscriptionStorageService['clientSubscriptions'] = new Map();
    websocketSubscriptionStorageService['entitySubscriptions'] = new Map();
  });

  it('should initialize successfully', () => {
    websocketSubscriptionStorageService.initialize();
    // Mostly checking that this doesn't throw an error
    expect(true).toBeTruthy();
  });

  it('should add a valid subscription', () => {
    const subscription: StoredSubscription = {
      clientId: 'client1',
      subscriptionId: 'sub1',
      entityType: 'order',
      entityId: '123',
      eventTypes: ['created', 'updated'],
      createdAt: Date.now()
    };

    const result = websocketSubscriptionStorageService.addSubscription(subscription);
    expect(result).toBe(true);

    // Check client subscriptions map
    const clientSubs = websocketSubscriptionStorageService['clientSubscriptions'].get('client1');
    expect(clientSubs).toBeDefined();
    expect(clientSubs?.get('sub1')).toEqual(subscription);

    // Check entity index
    const entityMap = websocketSubscriptionStorageService['entitySubscriptions'].get('order');
    expect(entityMap).toBeDefined();
    expect(entityMap?.get('123')?.has('client1:sub1')).toBe(true);
  });

  it('should reject invalid subscription data', () => {
    const invalidSubscription: Partial<StoredSubscription> = {
      clientId: 'client1',
      subscriptionId: 'sub1',
      entityType: 'order'
      // Missing eventTypes
    };

    const result = websocketSubscriptionStorageService.addSubscription(invalidSubscription as StoredSubscription);
    expect(result).toBe(false);
  });

  it('should remove a subscription', () => {
    // Add a subscription first
    const subscription: StoredSubscription = {
      clientId: 'client1',
      subscriptionId: 'sub1',
      entityType: 'order',
      entityId: '123',
      eventTypes: ['created'],
      createdAt: Date.now()
    };
    websocketSubscriptionStorageService.addSubscription(subscription);

    // Now remove it
    const result = websocketSubscriptionStorageService.removeSubscription('client1', 'sub1');
    expect(result).toBe(true);

    // Check it's gone from client subscriptions
    const clientSubs = websocketSubscriptionStorageService['clientSubscriptions'].get('client1');
    expect(clientSubs?.has('sub1')).toBe(false);

    // Check it's gone from entity index
    const entityMap = websocketSubscriptionStorageService['entitySubscriptions'].get('order');
    const entitySet = entityMap?.get('123');
    expect(entitySet?.has('client1:sub1')).toBeFalsy();
  });

  it('should return false when removing non-existent subscription', () => {
    const result = websocketSubscriptionStorageService.removeSubscription('nonExistentClient', 'nonExistentSub');
    expect(result).toBe(false);
  });

  it('should remove all client subscriptions', () => {
    // Add multiple subscriptions for a client
    const sub1: StoredSubscription = {
      clientId: 'client1',
      subscriptionId: 'sub1',
      entityType: 'order',
      entityId: '123',
      eventTypes: ['created'],
      createdAt: Date.now()
    };

    const sub2: StoredSubscription = {
      clientId: 'client1',
      subscriptionId: 'sub2',
      entityType: 'product',
      entityId: '456',
      eventTypes: ['updated'],
      createdAt: Date.now()
    };

    websocketSubscriptionStorageService.addSubscription(sub1);
    websocketSubscriptionStorageService.addSubscription(sub2);

    // Remove all subscriptions for the client
    const removedCount = websocketSubscriptionStorageService.removeAllClientSubscriptions('client1');
    expect(removedCount).toBe(2);

    // Check client is gone from client subscriptions
    expect(websocketSubscriptionStorageService['clientSubscriptions'].has('client1')).toBe(false);

    // Check entity indexes are cleaned up
    const orderMap = websocketSubscriptionStorageService['entitySubscriptions'].get('order');
    const productMap = websocketSubscriptionStorageService['entitySubscriptions'].get('product');
    
    // Either maps are gone or the specific entries are gone
    expect(orderMap?.get('123')?.has('client1:sub1')).toBeFalsy();
    expect(productMap?.get('456')?.has('client1:sub2')).toBeFalsy();
  });

  it('should get subscription data', () => {
    const subscription: StoredSubscription = {
      clientId: 'client1',
      subscriptionId: 'sub1',
      entityType: 'order',
      entityId: '123',
      eventTypes: ['created'],
      createdAt: Date.now()
    };
    websocketSubscriptionStorageService.addSubscription(subscription);

    const retrieved = websocketSubscriptionStorageService.getSubscription('client1', 'sub1');
    expect(retrieved).toEqual(subscription);

    const nonExistent = websocketSubscriptionStorageService.getSubscription('client1', 'nonExistent');
    expect(nonExistent).toBeNull();
  });

  it('should get all client subscriptions', () => {
    const sub1: StoredSubscription = {
      clientId: 'client1',
      subscriptionId: 'sub1',
      entityType: 'order',
      entityId: '123',
      eventTypes: ['created'],
      createdAt: Date.now()
    };

    const sub2: StoredSubscription = {
      clientId: 'client1',
      subscriptionId: 'sub2',
      entityType: 'product',
      entityId: '456',
      eventTypes: ['updated'],
      createdAt: Date.now()
    };

    websocketSubscriptionStorageService.addSubscription(sub1);
    websocketSubscriptionStorageService.addSubscription(sub2);

    const subscriptions = websocketSubscriptionStorageService.getClientSubscriptions('client1');
    expect(subscriptions.length).toBe(2);
    expect(subscriptions).toContainEqual(sub1);
    expect(subscriptions).toContainEqual(sub2);
  });

  it('should find subscribers for an entity', () => {
    // Add multiple subscriptions
    const sub1: StoredSubscription = {
      clientId: 'client1',
      subscriptionId: 'sub1',
      entityType: 'order',
      entityId: '123',
      eventTypes: ['created'],
      createdAt: Date.now()
    };

    const sub2: StoredSubscription = {
      clientId: 'client2',
      subscriptionId: 'sub2',
      entityType: 'order', 
      // No entityId - subscribes to all orders
      eventTypes: ['updated'],
      createdAt: Date.now()
    };

    const sub3: StoredSubscription = {
      clientId: 'client3',
      subscriptionId: 'sub3',
      entityType: 'product', // Different entity type
      entityId: '456',
      eventTypes: ['deleted'],
      createdAt: Date.now()
    };

    websocketSubscriptionStorageService.addSubscription(sub1);
    websocketSubscriptionStorageService.addSubscription(sub2);
    websocketSubscriptionStorageService.addSubscription(sub3);

    // Find subscribers for specific order
    const orderSubscribers = websocketSubscriptionStorageService.findEntitySubscriptions('order', '123');
    expect(orderSubscribers.length).toBe(2);
    expect(orderSubscribers).toContain('client1:sub1');
    expect(orderSubscribers).toContain('client2:sub2'); // Client2 subscribed to all orders

    // Find subscribers for all orders
    const allOrderSubscribers = websocketSubscriptionStorageService.findEntitySubscriptions('order');
    expect(allOrderSubscribers.length).toBe(1);
    expect(allOrderSubscribers).toContain('client2:sub2');

    // Find subscribers for product
    const productSubscribers = websocketSubscriptionStorageService.findEntitySubscriptions('product', '456');
    expect(productSubscribers.length).toBe(1);
    expect(productSubscribers).toContain('client3:sub3');
  });

  it('should find client IDs and their subscriptions', () => {
    // Add multiple subscriptions for the same entity
    const sub1: StoredSubscription = {
      clientId: 'client1',
      subscriptionId: 'sub1',
      entityType: 'order',
      entityId: '123',
      eventTypes: ['created'],
      createdAt: Date.now()
    };

    const sub2: StoredSubscription = {
      clientId: 'client1',
      subscriptionId: 'sub2',
      entityType: 'order',
      entityId: '123',
      eventTypes: ['updated'],
      createdAt: Date.now()
    };

    const sub3: StoredSubscription = {
      clientId: 'client2',
      subscriptionId: 'sub3',
      entityType: 'order',
      entityId: '123',
      eventTypes: ['deleted'],
      createdAt: Date.now()
    };

    websocketSubscriptionStorageService.addSubscription(sub1);
    websocketSubscriptionStorageService.addSubscription(sub2);
    websocketSubscriptionStorageService.addSubscription(sub3);

    // Find clients for specific order
    const clients = websocketSubscriptionStorageService.findSubscribedClients('order', '123');
    expect(clients.size).toBe(2);
    
    // Client1 has two subs
    expect(clients.get('client1')?.length).toBe(2);
    expect(clients.get('client1')).toContain('sub1');
    expect(clients.get('client1')).toContain('sub2');
    
    // Client2 has one sub
    expect(clients.get('client2')?.length).toBe(1);
    expect(clients.get('client2')).toContain('sub3');
  });

  it('should get statistics', () => {
    // Add various subscriptions
    websocketSubscriptionStorageService.addSubscription({
      clientId: 'client1',
      subscriptionId: 'sub1',
      entityType: 'order',
      entityId: '123',
      eventTypes: ['created'],
      createdAt: Date.now()
    });

    websocketSubscriptionStorageService.addSubscription({
      clientId: 'client1',
      subscriptionId: 'sub2',
      entityType: 'product',
      entityId: '456',
      eventTypes: ['updated'],
      createdAt: Date.now()
    });

    websocketSubscriptionStorageService.addSubscription({
      clientId: 'client2',
      subscriptionId: 'sub3',
      entityType: 'order',
      entityId: '789',
      eventTypes: ['deleted'],
      createdAt: Date.now()
    });

    const stats = websocketSubscriptionStorageService.getStats();
    expect(stats.totalClients).toBe(2);
    expect(stats.totalSubscriptions).toBe(3);
    expect(stats.subscriptionsByEntityType).toEqual({
      order: 2,
      product: 1
    });
  });

  it('should check if a client has subscriptions', () => {
    websocketSubscriptionStorageService.addSubscription({
      clientId: 'client1',
      subscriptionId: 'sub1',
      entityType: 'order',
      entityId: '123',
      eventTypes: ['created'],
      createdAt: Date.now()
    });

    expect(websocketSubscriptionStorageService.hasSubscriptions('client1')).toBe(true);
    expect(websocketSubscriptionStorageService.hasSubscriptions('nonExistentClient')).toBe(false);
  });
}); 