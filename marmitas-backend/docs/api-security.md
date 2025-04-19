# API Security Documentation

This document outlines the security measures implemented in the Marmitas API to protect against common web vulnerabilities and ensure secure communication between frontend and backend components.

## Security Architecture

The API security architecture is built around the following components:

1. **API Gateway**: Central security control point that applies security policies to all endpoints
2. **TLS Configuration**: Secure communication using TLS 1.3 with strong cipher suites
3. **Authentication & Authorization**: JWT-based token system with role-based access control
4. **Rate Limiting**: Protection against brute force and DoS attacks
5. **Request Validation**: Input validation and sanitization to prevent injection attacks
6. **Security Headers**: Comprehensive security headers including CSP, HSTS, etc.
7. **Audit Logging**: Detailed logging of security-relevant events for compliance and incident response

## API Gateway

All API requests pass through the API Gateway, which applies appropriate security policies based on the endpoint's sensitivity and requirements. The gateway:

- Enforces authentication requirements for protected routes
- Applies rate limiting based on endpoint sensitivity
- Logs all requests for security audit
- Ensures consistent security headers across all responses

## TLS Configuration

All API communication is secured using TLS 1.3 with the following security measures:

- TLS 1.3 only (older versions disabled)
- Strong cipher suites prioritized:
  - TLS_AES_256_GCM_SHA384
  - TLS_AES_128_GCM_SHA256
  - TLS_CHACHA20_POLY1305_SHA256
- HSTS headers with long expiration and includeSubDomains
- Certificate rotation policies for different environments

## Authentication & Authorization

The API uses a JWT-based authentication system with:

- Short-lived access tokens (15 minutes by default)
- Refresh token mechanism for extended sessions
- Role-based access control for protected resources
- Secure token storage recommendations for frontend
- Token validation on all protected endpoints

## Rate Limiting

Protection against abuse through tiered rate limiting:

- Default rate limiting for all endpoints: 100 requests per 15 minutes
- Strict rate limiting for sensitive endpoints: 25 requests per 15 minutes
- Very strict rate limiting for highly sensitive endpoints: 3 requests per minute
- Custom rate limiting available per endpoint
- IP-based rate limiting with appropriate headers
- Logging of rate limit violations for security monitoring

## Request Validation & Sanitization

Multiple layers of validation:

- Schema-based validation using Zod for request payloads
- Input sanitization to prevent XSS and injection attacks
- Strict content type checking
- Parameter validation and sanitization
- Rejection of malformed requests with appropriate error responses

## Security Headers

Comprehensive security headers applied to all responses:

- Content-Security-Policy with strict directives
- Strict-Transport-Security for HTTPS enforcement
- X-Content-Type-Options: nosniff
- X-Frame-Options: DENY
- X-XSS-Protection: 1; mode=block
- Referrer-Policy: strict-origin-when-cross-origin
- X-Permitted-Cross-Domain-Policies: none

## Audit Logging

Detailed security logging for incident response and compliance:

- All API requests logged with security-relevant information
- Authentication events logged (success/failure)
- Rate limiting violations logged
- Sensitive operations logged
- Separate security audit logs for compliance
- Log rotation and retention policies
- PII redaction in logs

## CORS Configuration

Cross-origin resource sharing is carefully configured:

- Restriction to known origins in production
- Appropriate CORS headers for required operations
- Credentials support for authenticated requests
- Pre-flight request handling

## Error Handling

Secure error handling practices:

- Generic error messages to clients (no internal details leaked)
- Detailed internal logging of errors
- Structured error responses
- No stack traces or sensitive information in production responses

## Security Recommendations for API Consumers

- Store tokens securely (HttpOnly cookies recommended)
- Implement token refresh mechanism
- Validate all server responses
- Implement client-side input validation
- Use HTTPS for all communications
- Follow the principle of least privilege when requesting resources 