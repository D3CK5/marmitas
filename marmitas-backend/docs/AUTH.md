# Authentication Service Documentation

## Overview

This document describes the authentication system implemented for the Marmitas application, which uses JWT (JSON Web Tokens) for secure authentication across separated frontend and backend components.

## Architecture

The authentication system follows a token-based approach using JWT:

1. **Access Token**: Short-lived token used for API authorization
2. **Refresh Token**: Long-lived token used to obtain new access tokens
3. **HTTP-only Cookies**: Secure storage of refresh tokens
4. **Bearer Authentication**: Access tokens sent in Authorization header

## Security Features

### Token Security

- **Access Token**: Short expiration (default: 15 minutes)
- **Refresh Token**: Longer expiration (default: 7 days)
- **Signing**: Both tokens are cryptographically signed with separate secrets
- **Stateful Refresh Tokens**: Refresh tokens are tracked server-side for invalidation
- **Token Rotation**: New refresh token issued when refreshing access token

### Storage Security

- **Refresh Tokens**: Stored in HTTP-only, secure cookies with strict SameSite policy
- **Access Tokens**: Stored in memory on client-side, never in localStorage/sessionStorage
- **Server Storage**: Refresh tokens tracked in-memory (moves to Redis in production)

### Communication Security

- **HTTPS Required**: All token transmission must occur over HTTPS
- **CORS Protection**: Configured to only allow specific origins
- **Credentials**: Cross-origin requests require credentials: true

## Implementation

### Backend Implementation

Key components:

1. **JWT Service**: Handles token generation, validation, and refresh
2. **Auth Middleware**: Validates tokens on protected routes
3. **Auth Controller**: Handles authentication endpoints
4. **Auth Routes**: Exposes authentication API endpoints

### Frontend Implementation

Requirements:

1. Use HTTP-only cookies for refresh tokens (set automatically by the backend)
2. Store access tokens in memory only
3. Implement token refresh mechanism when access token expires
4. Clear tokens on logout

## API Endpoints

### Registration

```
POST /api/auth/register
Content-Type: application/json

{
  "name": "User Name",
  "email": "user@example.com",
  "password": "secure_password"
}
```

Response:

```
Status: 201 Created
{
  "success": true,
  "data": {
    "user": {
      "id": "user_id",
      "email": "user@example.com",
      "name": "User Name",
      "createdAt": "timestamp",
      "updatedAt": "timestamp"
    },
    "accessToken": "jwt_access_token"
  }
}
```

### Login

```
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "secure_password"
}
```

Response:

```
Status: 200 OK
{
  "success": true,
  "data": {
    "user": {
      "id": "user_id",
      "email": "user@example.com",
      "name": "User Name",
      "createdAt": "timestamp",
      "updatedAt": "timestamp"
    },
    "accessToken": "jwt_access_token"
  }
}
```

### Refresh Token

```
POST /api/auth/refresh
```

Response:

```
Status: 200 OK
{
  "success": true,
  "data": {
    "accessToken": "new_jwt_access_token"
  }
}
```

### Logout

```
POST /api/auth/logout
```

Response:

```
Status: 200 OK
{
  "success": true,
  "data": {
    "message": "Logged out successfully"
  }
}
```

### Logout All Devices

```
POST /api/auth/logout-all
Authorization: Bearer jwt_access_token
```

Response:

```
Status: 200 OK
{
  "success": true,
  "data": {
    "message": "Logged out from all devices"
  }
}
```

## Security Guidelines

### Token Management

1. **Never** store access tokens in localStorage or sessionStorage (vulnerable to XSS)
2. **Always** use the Authorization header with Bearer scheme for access tokens
3. **Never** include sensitive data in token payload
4. Implement proper error handling for token expiration
5. Use automated token refresh mechanism

### Password Security

1. Enforce strong password requirements
2. Never store plain-text passwords
3. Use bcrypt for password hashing
4. Implement rate limiting on login endpoints
5. Consider implementing multi-factor authentication for sensitive operations

### General Security

1. Always use HTTPS for all authentication-related communications
2. Implement proper CORS policy
3. Consider IP-based rate limiting for authentication endpoints
4. Log authentication events for security monitoring
5. Implement account lockout after multiple failed attempts

## Environment Configuration

Configure these environment variables:

```
# JWT Configuration
JWT_ACCESS_SECRET=your_secure_access_token_secret
JWT_REFRESH_SECRET=your_secure_refresh_token_secret
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_EXPIRY=7d

# Security
CORS_ORIGIN=https://your-frontend-domain.com
NODE_ENV=production
```

## Testing Authentication

The authentication system can be tested using tools like Postman or curl:

```bash
# Register
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Test User","email":"test@example.com","password":"Password123"}'

# Login
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Password123"}' \
  -c cookies.txt

# Using Access Token
curl -X GET http://localhost:3001/api/auth/profile \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -b cookies.txt

# Refresh Token
curl -X POST http://localhost:3001/api/auth/refresh \
  -b cookies.txt

# Logout
curl -X POST http://localhost:3001/api/auth/logout \
  -b cookies.txt
``` 