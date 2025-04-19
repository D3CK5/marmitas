/**
 * Marmitas Infrastructure
 * Development Environment State Configuration
 */

terraform {
  backend "s3" {
    bucket         = "marmitas-terraform-state-dev"
    key            = "development/terraform.tfstate"
    region         = "us-east-1"
    dynamodb_table = "marmitas-terraform-locks-dev"
    encrypt        = true
  }
} 