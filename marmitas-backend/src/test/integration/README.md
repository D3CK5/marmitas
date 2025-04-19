# Integration Test Framework

This directory contains the integration tests for validating the communication between the frontend and backend components of the separated Marmitas system. These tests ensure that the API contracts and authentication flows between the separated components function correctly.

## Overview

The integration test framework is built using Jest and Supertest to test the backend API endpoints. The tests focus on:

1. **API Contract Validation**: Ensuring that API responses follow the expected structure and data types.
2. **Authentication Flows**: Testing the full authentication flow from registration through login, accessing protected resources, and logout.
3. **Authorization Validation**: Ensuring that role-based access controls are properly enforced.

## Test Structure

- `setup.ts`: Contains the test framework setup, including utilities for creating test servers, authentication tokens, and test request helpers.
- `api-contract.test.ts`: Tests the structure and contracts of API responses.
- `auth-flow.test.ts`: Tests the authentication and authorization flows.
- `index.test.ts`: Entry point for running all integration tests.

## Running Tests

To run the integration tests, use the following command from the project root:

```bash
npm test -- src/test/integration
```

For running a specific test file:

```bash
npm test -- src/test/integration/api-contract.test.ts
```

## Test Coverage

The integration tests are designed to validate:

- Response structure and data types match the expected contracts
- Authentication flows work correctly across the separation boundary
- Authorization rules are correctly enforced
- Error handling is consistent and properly formatted

## Extending the Tests

When adding new API endpoints or modifying existing ones, be sure to:

1. Add corresponding contract tests to ensure the API structure is maintained
2. Update auth flow tests if authentication or authorization requirements change
3. Follow the existing patterns for test organization and structure

## Best Practices

- Keep tests focused on integration concerns between frontend and backend
- Use the shared type definitions from `marmitas-types` to validate API contracts
- Test both success and error cases for each endpoint
- Ensure tests can run in isolation and don't depend on specific database state 