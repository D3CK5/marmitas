/**
 * Marmitas Infrastructure
 * Terraform State Configuration
 */

terraform {
  backend "s3" {
    # These values must be provided via CLI or environment variables
    # Alternatively, use partial configuration with a backend.hcl file
    
    # bucket         = "marmitas-terraform-state"
    # key            = "environment/terraform.tfstate"
    # region         = "us-east-1"
    # dynamodb_table = "marmitas-terraform-locks"
    # encrypt        = true
  }
}

# Usage:
# terraform init -backend-config="bucket=marmitas-terraform-state" \
#                -backend-config="key=environment/terraform.tfstate" \
#                -backend-config="region=us-east-1" \
#                -backend-config="dynamodb_table=marmitas-terraform-locks" \
#                -backend-config="encrypt=true" 