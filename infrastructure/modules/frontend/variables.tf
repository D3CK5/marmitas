/**
 * Marmitas Infrastructure
 * Frontend Module Variables
 */

variable "environment" {
  description = "Environment name (e.g., development, testing, production)"
  type        = string
}

variable "aws_region" {
  description = "AWS region to deploy resources"
  type        = string
  default     = "us-east-1"
}

variable "vpc_id" {
  description = "ID of the VPC"
  type        = string
}

variable "public_subnets" {
  description = "IDs of the public subnets"
  type        = list(string)
}

variable "domain_name" {
  description = "Domain name for the application"
  type        = string
}

variable "certificate_arn" {
  description = "ARN of the SSL certificate for HTTPS"
  type        = string
}

variable "container_image" {
  description = "Docker image for frontend container"
  type        = string
}

variable "container_port" {
  description = "Port the frontend container listens on"
  type        = number
  default     = 80
}

variable "desired_capacity" {
  description = "Desired number of frontend instances"
  type        = number
  default     = 2
}

variable "min_capacity" {
  description = "Minimum number of frontend instances"
  type        = number
  default     = 1
}

variable "max_capacity" {
  description = "Maximum number of frontend instances"
  type        = number
  default     = 5
}

variable "lb_security_group_id" {
  description = "ID of the load balancer security group"
  type        = string
}

variable "frontend_security_group_id" {
  description = "ID of the frontend security group"
  type        = string
}

variable "api_url" {
  description = "URL for the backend API"
  type        = string
} 