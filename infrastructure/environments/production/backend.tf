/**
 * Marmitas Infrastructure
 * Production Environment State Configuration
 */

terraform {
  backend "s3" {
    bucket         = "marmitas-terraform-state-prod"
    key            = "production/terraform.tfstate"
    region         = "us-east-1"
    dynamodb_table = "marmitas-terraform-locks-prod"
    encrypt        = true
  }
} 