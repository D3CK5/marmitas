#!/bin/bash
set -e

# This script sets up the S3 buckets and DynamoDB tables required for Terraform state management
# Usage: ./setup-terraform-state.sh <environment>

# Check for environment parameter
if [ -z "$1" ]; then
  echo "Usage: $0 <environment>"
  echo "Example: $0 development"
  exit 1
fi

ENVIRONMENT=$1
REGION="us-east-1"
STATE_BUCKET="marmitas-terraform-state-${ENVIRONMENT:0:4}"
LOCK_TABLE="marmitas-terraform-locks-${ENVIRONMENT:0:4}"

echo "Setting up Terraform state management for environment: $ENVIRONMENT"
echo "State bucket: $STATE_BUCKET"
echo "Lock table: $LOCK_TABLE"
echo ""

# Create S3 bucket if it doesn't exist
if aws s3 ls "s3://$STATE_BUCKET" 2>&1 | grep -q 'NoSuchBucket'; then
  echo "Creating S3 bucket for Terraform state: $STATE_BUCKET"
  aws s3api create-bucket \
    --bucket "$STATE_BUCKET" \
    --region "$REGION"
  
  # Enable versioning on the bucket
  echo "Enabling versioning on bucket: $STATE_BUCKET"
  aws s3api put-bucket-versioning \
    --bucket "$STATE_BUCKET" \
    --versioning-configuration Status=Enabled
  
  # Enable encryption on the bucket
  echo "Enabling encryption on bucket: $STATE_BUCKET"
  aws s3api put-bucket-encryption \
    --bucket "$STATE_BUCKET" \
    --server-side-encryption-configuration '{
      "Rules": [
        {
          "ApplyServerSideEncryptionByDefault": {
            "SSEAlgorithm": "AES256"
          }
        }
      ]
    }'
  
  # Block public access
  echo "Blocking public access to bucket: $STATE_BUCKET"
  aws s3api put-public-access-block \
    --bucket "$STATE_BUCKET" \
    --public-access-block-configuration "BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=true,RestrictPublicBuckets=true"
else
  echo "S3 bucket already exists: $STATE_BUCKET"
fi

# Create DynamoDB table if it doesn't exist
if ! aws dynamodb describe-table --table-name "$LOCK_TABLE" 2>/dev/null; then
  echo "Creating DynamoDB table for Terraform state locking: $LOCK_TABLE"
  aws dynamodb create-table \
    --region "$REGION" \
    --table-name "$LOCK_TABLE" \
    --attribute-definitions AttributeName=LockID,AttributeType=S \
    --key-schema AttributeName=LockID,KeyType=HASH \
    --provisioned-throughput ReadCapacityUnits=5,WriteCapacityUnits=5 \
    --tags Key=Environment,Value="$ENVIRONMENT" Key=Purpose,Value="Terraform"
else
  echo "DynamoDB table already exists: $LOCK_TABLE"
fi

echo ""
echo "Terraform state management setup complete for $ENVIRONMENT"
echo ""
echo "To initialize Terraform with this backend, run:"
echo "terraform init \\"
echo "  -backend-config=\"bucket=$STATE_BUCKET\" \\"
echo "  -backend-config=\"key=${ENVIRONMENT}/terraform.tfstate\" \\"
echo "  -backend-config=\"region=$REGION\" \\"
echo "  -backend-config=\"dynamodb_table=$LOCK_TABLE\" \\"
echo "  -backend-config=\"encrypt=true\"" 