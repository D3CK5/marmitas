# Marmitas Infrastructure as Code

This repository contains the Infrastructure as Code (IaC) definitions for the Marmitas application, enabling reproducible, version-controlled deployment and scaling of both frontend and backend components.

## Overview

The infrastructure is defined using Terraform and organized in a modular fashion to support multiple environments (development, testing, production) and independent scaling of components.

## Directory Structure

```
infrastructure/
├── environments/         # Environment-specific configurations
│   ├── development/      # Development environment
│   ├── testing/          # Testing environment
│   └── production/       # Production environment
├── modules/              # Reusable Terraform modules
│   ├── frontend/         # Frontend infrastructure components
│   ├── backend/          # Backend infrastructure components
│   ├── database/         # Database infrastructure components
│   └── networking/       # Networking infrastructure components
├── scripts/              # Utility scripts for infrastructure operations
└── terraform.tfvars.example # Example variable definitions
```

## Prerequisites

- Terraform v1.0.0+
- AWS CLI v2.0.0+ (if using AWS)
- Azure CLI v2.30.0+ (if using Azure)
- Access credentials for the target cloud provider

## Getting Started

1. Clone this repository
2. Navigate to the desired environment directory
3. Copy `terraform.tfvars.example` to `terraform.tfvars` and update values
4. Initialize Terraform:
   ```
   terraform init
   ```
5. Create an execution plan:
   ```
   terraform plan
   ```
6. Apply the changes:
   ```
   terraform apply
   ```

## Environment Configuration

Each environment directory contains:

- `main.tf` - Main Terraform configuration
- `variables.tf` - Input variable declarations
- `outputs.tf` - Output variable declarations
- `terraform.tfvars` - Variable definitions (not in VCS)
- `backend.tf` - Terraform state configuration

## State Management

This infrastructure uses remote state storage with locking to prevent concurrent modifications:

- AWS: S3 bucket with DynamoDB table locking
- Azure: Azure Storage container with blob locking

## Security Considerations

- Sensitive data should be provided via environment variables or secret management
- Use IAM roles with minimal permissions
- Enable encryption for data at rest and in transit
- Network security groups restrict access to resources

## Scaling Configuration

The infrastructure supports independent scaling for frontend and backend components:

- Frontend: Auto-scaling groups based on CPU utilization and request counts
- Backend: Auto-scaling groups based on CPU utilization, memory usage, and API request counts
- Database: Scalable database instances with connection pooling

## Monitoring and Observability

The infrastructure includes configurations for:

- CloudWatch/Azure Monitor metrics collection
- Log aggregation
- Alerting based on defined thresholds
- Health checks integration with auto-scaling

## Contributing

1. Create a new branch for your changes
2. Make your changes following the established module patterns
3. Test in the development environment
4. Submit a pull request with a detailed description of changes

## License

Proprietary and confidential 