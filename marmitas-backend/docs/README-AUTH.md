# JWT Authentication System

## Overview

This JWT authentication system provides a secure, token-based authentication mechanism for the Marmitas application. It implements a stateful refresh token approach with HTTP-only cookies for enhanced security.

## Features

- **JWT-based authentication** with access and refresh tokens
- **Stateful refresh tokens** for enhanced security
- **HTTP-only cookies** for secure token storage
- **Automatic token refresh** mechanism
- **Role-based authorization** support
- **Comprehensive security measures** following best practices

## Implementation

The authentication system consists of several key components:

### Backend Components

1. **JWT Service** (`jwt.service.ts`)
   - Manages token generation, validation, and refresh
   - Implements secure token storage and rotation
   - Handles token expiration and cleanup

2. **Auth Service** (`auth.service.ts`)
   - Provides user authentication and registration
   - Manages user profile information
   - Integrates with Supabase and JWT service

3. **Auth Middleware** (`auth.middleware.ts`)
   - Validates tokens for protected routes
   - Implements role-based authorization
   - Provides backward compatibility with legacy authentication

4. **Auth Controller** (`auth.controller.ts`)
   - Handles authentication API endpoints
   - Manages HTTP-only cookies for secure token storage
   - Implements proper error handling

5. **Auth Routes** (`auth.routes.ts`)
   - Defines API endpoints for authentication operations
   - Implements validation for request payloads

### Frontend Components

1. **Auth Context** (`AuthContext.tsx`)
   - Manages authentication state
   - Provides authentication methods (login, register, logout)
   - Handles automatic token refresh

2. **API Client** (`api.ts`)
   - Configures Axios for secure communication
   - Automatically attaches tokens to requests
   - Handles token refresh on 401 errors

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/auth/register` | POST | Register a new user |
| `/api/auth/login` | POST | Login a user |
| `/api/auth/refresh` | POST | Refresh the access token |
| `/api/auth/logout` | POST | Logout a user |
| `/api/auth/logout-all` | POST | Logout from all devices |
| `/api/auth/profile` | GET | Get user profile |
| `/api/auth/profile` | PUT | Update user profile |

## Security Considerations

This implementation follows security best practices:

1. **Access tokens:**
   - Short-lived (15 minutes by default)
   - Contains minimal user information
   - Transmitted via Authorization header
   - Stored only in memory on frontend

2. **Refresh tokens:**
   - Longer-lived (7 days by default)
   - Stored in HTTP-only, secure cookies
   - Tracked server-side for revocation
   - Rotated on each use

3. **Additional security measures:**
   - CSRF protection through SameSite cookie policy
   - CORS restrictions for API access
   - Secure, HTTP-only cookies for token storage
   - TLS required for production use

## Configuration

Configure the authentication system using environment variables:

```env
# JWT Configuration
JWT_ACCESS_SECRET=your_secure_access_token_secret
JWT_REFRESH_SECRET=your_secure_refresh_token_secret
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_EXPIRY=7d

# Security
CORS_ORIGIN=https://your-frontend-domain.com
NODE_ENV=production
```

## Getting Started

### Prerequisites

- Node.js 14+ and npm/yarn
- Redis (recommended for production refresh token storage)

### Installation

1. Install dependencies:
   ```bash
   npm install
   ```

2. Configure environment variables:
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

3. Start the server:
   ```bash
   npm run dev
   ```

## Running in Production

For production deployment:

1. Set secure, randomly-generated secrets for JWT tokens:
   ```bash
   JWT_ACCESS_SECRET=$(openssl rand -hex 32)
   JWT_REFRESH_SECRET=$(openssl rand -hex 32)
   ```

2. Configure proper CORS settings:
   ```
   CORS_ORIGIN=https://your-production-domain.com
   ```

3. Use a Redis store for refresh tokens (recommended)

4. Ensure all communication uses HTTPS

## Testing

Run authentication tests:

```bash
npm run test
```

## Documentation

For more detailed information, see:

- [AUTH.md](./AUTH.md) - Detailed API documentation
- [AUTH_CLIENT.md](../frontend/docs/AUTH_CLIENT.md) - Frontend authentication guide

## License

This project is licensed under the MIT License - see the LICENSE file for details. 