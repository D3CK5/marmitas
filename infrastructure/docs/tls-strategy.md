# TLS Certificate Strategy

## Overview

This document outlines the Transport Layer Security (TLS) implementation strategy for the Marmitas application, ensuring secure communication between frontend and backend components. We are enforcing TLS 1.3 across all environments to provide the highest level of security for data in transit.

## Certificate Strategy by Environment

### Development Environment

- **Certificate Type**: Self-signed certificates
- **Renewal**: Manual renewal (every 12 months)
- **Domain**: localhost or development domain
- **Implementation**: Local certificate generation using OpenSSL
- **Storage**: Local secure storage, not committed to version control

### Testing Environment

- **Certificate Type**: Let's Encrypt staging certificates
- **Renewal**: Automated via Certbot (90 days)
- **Domain**: test.marmitas.com
- **Implementation**: Certbot with DNS challenge
- **Storage**: Secured in CI/CD secrets management

### Production Environment

- **Certificate Type**: Let's Encrypt production certificates
- **Renewal**: Automated via cert-manager in Kubernetes (60 days)
- **Domain**: marmitas.com and *.marmitas.com
- **Implementation**: cert-manager with DNS challenge
- **Storage**: Kubernetes secrets with encryption at rest

## Certificate Requirements

All TLS certificates must comply with the following requirements:

1. **TLS Version**: TLS 1.3 only (TLS 1.2 disabled)
2. **Key Type**: RSA 4096-bit or ECC 256-bit
3. **Certificate Lifespan**: Maximum 90 days in production
4. **Signature Algorithm**: SHA-256 or higher
5. **Extended Validation**: Required for production

## Cipher Suite Configuration

The following cipher suites are allowed in order of preference:

```
TLS_AES_256_GCM_SHA384
TLS_AES_128_GCM_SHA256
TLS_CHACHA20_POLY1305_SHA256
```

All other cipher suites are explicitly disabled.

## Termination Points

1. **Frontend**:
   - TLS terminates at CDN (Cloudflare) edge
   - CDN to origin communication uses TLS 1.3

2. **Backend API**:
   - TLS terminates at API Gateway/Load Balancer
   - Gateway to service communication uses mTLS

3. **Database**:
   - TLS with mutual authentication
   - Certificate rotation every 30 days

## Certificate Deployment Process

### Manual Deployment (Development)

```bash
# Generate self-signed certificate
openssl req -x509 -nodes -newkey rsa:4096 -keyout key.pem -out cert.pem -days 365 -subj "/CN=localhost"

# Configure in local environment
cp key.pem cert.pem ./certs/
```

### Automated Deployment (Production)

Certificates are automatically deployed and renewed using cert-manager in Kubernetes:

```yaml
apiVersion: cert-manager.io/v1
kind: Certificate
metadata:
  name: marmitas-tls
  namespace: marmitas
spec:
  secretName: marmitas-tls-secret
  issuerRef:
    name: letsencrypt-prod
    kind: ClusterIssuer
  commonName: marmitas.com
  dnsNames:
  - marmitas.com
  - www.marmitas.com
  - api.marmitas.com
```

## HSTS Configuration

HTTP Strict Transport Security (HSTS) is enabled with the following configuration:

```
Strict-Transport-Security: max-age=31536000; includeSubDomains; preload
```

## Certificate Monitoring

- Certificates are monitored for expiration (alerts at 30, 14, and 7 days before expiry)
- Certificate validity is checked hourly via automated health check
- TLS configuration is tested weekly against security best practices

## Emergency Certificate Revocation

In case of private key compromise:

1. Revoke the compromised certificate immediately
2. Generate new key pair and certificate
3. Deploy new certificate to all termination points
4. Conduct security audit to identify potential exploitation

## Responsible Roles

- **Security Engineer**: Overall TLS strategy and configuration review
- **DevOps Engineer**: Certificate deployment and automation
- **Site Reliability Engineer**: Certificate monitoring and incident response

## Compliance Requirements

This TLS implementation meets or exceeds the following compliance requirements:

- PCI DSS v4.0 (Section 4.2.1)
- GDPR Article 32 (Security of processing)
- HIPAA Security Rule (Technical Safeguards) 