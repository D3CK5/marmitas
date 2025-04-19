# Frontend Authentication Implementation

## Overview

This document describes the frontend authentication implementation for the Marmitas application, which uses JWT (JSON Web Tokens) for secure authentication across separate frontend and backend components.

## Authentication Flow

The frontend authentication system follows these principles:

1. **Access Token Storage**: Access tokens are kept in memory only (React state)
2. **Refresh Token Storage**: Refresh tokens are stored in HTTP-only cookies
3. **Automatic Token Refresh**: Axios interceptors handle token expiration and refresh
4. **Secure State Management**: Authentication state is managed through React Context

## Implementation Components

### 1. API Client (src/lib/api.ts)

The API client is built on Axios and configured to:
- Include credentials (cookies) with all requests
- Set default content type headers
- Handle API responses in a type-safe way

```typescript
import axios from 'axios';

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3001/api',
  withCredentials: true, // Important for cookies
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

// Type-safe wrapper methods...
```

### 2. Authentication Context (src/contexts/AuthContext.tsx)

The AuthContext provides:
- User state management
- Authentication methods (login, register, logout)
- Token refresh handling
- Automatic API request authentication

```typescript
// Usage example
import { useAuth } from '@/contexts/AuthContext';

function MyComponent() {
  const { user, signIn, signOut, loading, error } = useAuth();
  
  // Use authentication state and methods
}
```

## Security Features

### Token Management

1. **No Local/Session Storage**: Access tokens are never stored in localStorage or sessionStorage
2. **Memory-Only Access Tokens**: Access tokens kept in React state only, cleared on page refresh
3. **HTTP-Only Cookies**: Refresh tokens stored in HTTP-only, secure cookies
4. **Token Rotation**: New refresh token issued on each refresh operation
5. **Automatic Refresh**: Expired tokens are refreshed automatically via interceptors

### Request Security

1. **Bearer Authentication**: Access tokens sent via Authorization header
2. **CORS Compliance**: All requests follow proper CORS protocol
3. **Error Handling**: Authentication errors properly handled and reported to user

## Using Authentication in Components

### Protected Routes

Use the PrivateRoute component to protect routes that require authentication:

```typescript
import { PrivateRoute } from '@/components/PrivateRoute';

<Route 
  path="/profile" 
  element={
    <PrivateRoute>
      <ProfilePage />
    </PrivateRoute>
  } 
/>
```

### Authentication State in Components

Access authentication state using the useAuth hook:

```typescript
import { useAuth } from '@/contexts/AuthContext';

function ProfileButton() {
  const { user, isAuthenticated, signOut } = useAuth();
  
  if (!isAuthenticated) {
    return <LoginButton />;
  }
  
  return (
    <div>
      <span>Welcome, {user.name}</span>
      <button onClick={signOut}>Logout</button>
    </div>
  );
}
```

### Making Authenticated API Requests

The API client automatically adds the authentication token to requests:

```typescript
import { apiClient } from '@/lib/api';

async function fetchUserData() {
  try {
    // Token is automatically added by interceptors
    const data = await apiClient.get('/user/profile');
    return data;
  } catch (error) {
    // Handle errors
  }
}
```

## Security Best Practices

1. **Never** store tokens in localStorage or sessionStorage
2. **Never** include sensitive user data in the frontend state
3. **Always** use HTTPS in production
4. **Always** validate user input before sending to the API
5. **Always** handle authentication errors gracefully
6. **Consider** implementing auto-logout after period of inactivity
7. **Consider** adding device fingerprinting for additional security

## Handling Authentication Events

### Login/Signup Success

```typescript
const { signIn, signUp } = useAuth();

// Login
const handleLogin = async (credentials) => {
  const success = await signIn(credentials.email, credentials.password);
  if (success) {
    // Redirect or show success message
  }
};

// Signup
const handleSignup = async (userData) => {
  const success = await signUp(userData.name, userData.email, userData.password);
  if (success) {
    // Redirect or show success message
  }
};
```

### Logout

```typescript
const { signOut, signOutAll } = useAuth();

// Normal logout
const handleLogout = async () => {
  await signOut();
  // Redirect to login page
};

// Logout from all devices
const handleLogoutAll = async () => {
  await signOutAll();
  // Redirect to login page
};
```

## Environment Configuration

Make sure to set these environment variables:

```
# API URL for authentication endpoints
VITE_API_URL=https://api.yourdomain.com/api
```

## Common Issues and Solutions

### CORS Issues

If experiencing CORS errors:
1. Verify the backend CORS configuration allows your frontend origin
2. Ensure withCredentials is set to true in API client
3. Check that your API requests use the correct URL

### Token Refresh Problems

If token refresh isn't working:
1. Verify the refresh cookie is being set properly
2. Check the refresh endpoint is working correctly
3. Ensure the interceptors are properly configured

### Authentication State Reset

If authentication state is lost unexpectedly:
1. Check for any code that might clear the state
2. Verify the AuthContext is properly wrapping your application
3. Ensure no component is causing unnecessary re-renders of the AuthProvider 