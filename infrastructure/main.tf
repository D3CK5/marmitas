/**
 * Marmitas Infrastructure
 * Main Terraform configuration
 */

terraform {
  required_version = ">= 1.0.0"
  
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 4.0"
    }
  }
}

# Configure the AWS Provider
provider "aws" {
  region = var.aws_region
  
  default_tags {
    tags = {
      Environment = var.environment
      Project     = "Marmitas"
      ManagedBy   = "Terraform"
    }
  }
}

# Remote backend configuration is in backend.tf

# Use modules for component-specific infrastructure
module "networking" {
  source = "./modules/networking"
  
  environment         = var.environment
  vpc_cidr            = var.vpc_cidr
  availability_zones  = var.availability_zones
  public_subnet_cidrs = var.public_subnet_cidrs
  private_subnet_cidrs = var.private_subnet_cidrs
}

module "frontend" {
  source = "./modules/frontend"
  
  environment      = var.environment
  vpc_id           = module.networking.vpc_id
  public_subnets   = module.networking.public_subnet_ids
  domain_name      = var.domain_name
  certificate_arn  = var.certificate_arn
  container_image  = var.frontend_container_image
  container_port   = var.frontend_container_port
  desired_capacity = var.frontend_desired_capacity
  min_capacity     = var.frontend_min_capacity
  max_capacity     = var.frontend_max_capacity
  
  depends_on = [module.networking]
}

module "backend" {
  source = "./modules/backend"
  
  environment      = var.environment
  vpc_id           = module.networking.vpc_id
  private_subnets  = module.networking.private_subnet_ids
  container_image  = var.backend_container_image
  container_port   = var.backend_container_port
  desired_capacity = var.backend_desired_capacity
  min_capacity     = var.backend_min_capacity
  max_capacity     = var.backend_max_capacity
  database_url     = module.database.database_url
  
  depends_on = [module.networking, module.database]
}

module "database" {
  source = "./modules/database"
  
  environment      = var.environment
  vpc_id           = module.networking.vpc_id
  private_subnets  = module.networking.private_subnet_ids
  db_name          = var.db_name
  db_username      = var.db_username
  db_password      = var.db_password
  db_instance_class = var.db_instance_class
  
  depends_on = [module.networking]
} 