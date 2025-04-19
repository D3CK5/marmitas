/**
 * Marmitas Infrastructure
 * Output Variables
 */

# Networking Outputs
output "vpc_id" {
  description = "ID of the VPC"
  value       = module.networking.vpc_id
}

output "public_subnet_ids" {
  description = "IDs of the public subnets"
  value       = module.networking.public_subnet_ids
}

output "private_subnet_ids" {
  description = "IDs of the private subnets"
  value       = module.networking.private_subnet_ids
}

# Frontend Outputs
output "frontend_url" {
  description = "URL to access the frontend application"
  value       = module.frontend.frontend_url
}

output "cdn_distribution_id" {
  description = "ID of the CloudFront distribution"
  value       = module.frontend.cdn_distribution_id
}

output "frontend_asg_name" {
  description = "Name of the frontend auto scaling group"
  value       = module.frontend.asg_name
}

# Backend Outputs
output "backend_url" {
  description = "URL to access the backend API"
  value       = module.backend.backend_url
}

output "backend_asg_name" {
  description = "Name of the backend auto scaling group"
  value       = module.backend.asg_name
}

# Database Outputs
output "database_endpoint" {
  description = "Endpoint of the database"
  value       = module.database.database_endpoint
}

output "database_name" {
  description = "Name of the database"
  value       = module.database.database_name
}

# Note: Sensitive information like database credentials are not exposed in outputs 