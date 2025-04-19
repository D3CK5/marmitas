/**
 * Marmitas Infrastructure
 * Frontend Module Outputs
 */

output "frontend_url" {
  description = "URL to access the frontend application"
  value       = "https://${var.domain_name}"
}

output "cdn_distribution_id" {
  description = "ID of the CloudFront distribution"
  value       = aws_cloudfront_distribution.frontend.id
}

output "asg_name" {
  description = "Name of the auto scaling group"
  value       = aws_appautoscaling_target.frontend.resource_id
}

output "ecr_repository_url" {
  description = "URL of the ECR repository"
  value       = aws_ecr_repository.frontend.repository_url
}

output "load_balancer_dns" {
  description = "DNS name of the load balancer"
  value       = aws_lb.frontend.dns_name
}

output "s3_bucket_name" {
  description = "Name of the S3 bucket for static assets"
  value       = aws_s3_bucket.frontend_assets.bucket
} 