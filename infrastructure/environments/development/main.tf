/**
 * Marmitas Infrastructure
 * Development Environment
 */

# Include the root module
module "marmitas" {
  source = "../../"
  
  # Set environment-specific variables
  environment          = "development"
  aws_region           = "us-east-1"
  
  # Networking
  vpc_cidr             = "10.0.0.0/16"
  availability_zones   = ["us-east-1a", "us-east-1b"]
  public_subnet_cidrs  = ["10.0.1.0/24", "10.0.2.0/24"]
  private_subnet_cidrs = ["10.0.3.0/24", "10.0.4.0/24"]
  
  # Frontend
  domain_name              = "dev.example.com"
  certificate_arn          = "arn:aws:acm:us-east-1:123456789012:certificate/abcd1234-example"
  frontend_container_image = "123456789012.dkr.ecr.us-east-1.amazonaws.com/marmitas-frontend:latest"
  frontend_desired_capacity = 1
  frontend_min_capacity     = 1
  frontend_max_capacity     = 3
  
  # Backend
  backend_container_image  = "123456789012.dkr.ecr.us-east-1.amazonaws.com/marmitas-backend:latest"
  backend_desired_capacity = 1
  backend_min_capacity     = 1
  backend_max_capacity     = 3
  
  # Database
  db_name          = "marmitas_dev"
  db_username      = "marmitas_dev_user"
  db_password      = "Password-will-be-provided-by-env-var"
  db_instance_class = "db.t3.small"
} 