# End-to-End (E2E) Testing Framework

This directory contains the end-to-end tests for validating the core user flows within the Marmitas application. The tests ensure that critical business processes work correctly from a user's perspective, interacting with both the frontend and backend.

## Testing Tools

The E2E testing framework uses two complementary tools:

1. **Cypress** - For standard E2E tests with good developer experience
2. **Playwright** - For cross-browser testing and more advanced scenarios

## Directory Structure

```
e2e/
├── cypress/                # Cypress tests
│   ├── support/            # Support files and custom commands
│   │   ├── e2e.ts          # Main support file
│   │   └── commands.ts     # Custom Cypress commands
│   └── specs/              # Test specifications
│       ├── auth/           # Authentication flow tests
│       ├── dashboard/      # Dashboard functionality tests
│       └── critical-flows/ # Tests for business-critical user flows
├── playwright/             # Playwright tests
│   ├── utils/              # Test utilities
│   │   ├── auth.ts         # Authentication helpers
│   │   └── navigation.ts   # Navigation helpers
│   └── tests/              # Test specifications for Playwright
└── fixtures/               # Shared test data for both frameworks
```

## Running Tests

### Cypress Tests

```bash
# Run all Cypress tests headlessly
npm run test:e2e

# Open Cypress Test Runner
npm run test:e2e:open
```

### Playwright Tests

```bash
# Run all Playwright tests headlessly
npm run test:e2e:pw

# Run with specific browser
npx playwright test --project=chromium

# Debug tests
npx playwright test --debug
```

## Best Practices

1. **Test critical user flows** - Focus on business-critical paths rather than testing every UI detail
2. **Use realistic data** - Create test fixtures that mimic real-world scenarios
3. **Keep tests independent** - Each test should be able to run in isolation
4. **Minimize test flakiness** - Use proper waiting strategies and reliable selectors
5. **Use data-testid attributes** - Add `data-testid` attributes to important UI elements for stable selectors

## Test Coverage Goals

The E2E tests should cover the following critical user flows:

1. User authentication (registration, login, logout)
2. Core business operations specific to the application
3. Integration between frontend and backend components
4. Error handling and edge cases for critical paths

## Maintenance

When making changes to the application:

1. Update tests if UI or workflow changes affect existing tests
2. Add new tests for new features or user flows
3. Regularly run the full test suite to catch regressions 