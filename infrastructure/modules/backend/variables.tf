/**
 * Marmitas Infrastructure
 * Backend Module Variables
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

variable "private_subnets" {
  description = "IDs of the private subnets"
  type        = list(string)
}

variable "container_image" {
  description = "Docker image for backend container"
  type        = string
}

variable "container_port" {
  description = "Port the backend container listens on"
  type        = number
  default     = 3000
}

variable "desired_capacity" {
  description = "Desired number of backend instances"
  type        = number
  default     = 2
}

variable "min_capacity" {
  description = "Minimum number of backend instances"
  type        = number
  default     = 1
}

variable "max_capacity" {
  description = "Maximum number of backend instances"
  type        = number
  default     = 5
}

variable "lb_security_group_id" {
  description = "ID of the load balancer security group"
  type        = string
}

variable "backend_security_group_id" {
  description = "ID of the backend security group"
  type        = string
}

variable "database_url" {
  description = "URL for the database connection"
  type        = string
  sensitive   = true
} 