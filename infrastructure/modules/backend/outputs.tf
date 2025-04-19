/**
 * Marmitas Infrastructure
 * Backend Module Outputs
 */

output "backend_url" {
  description = "URL to access the backend API"
  value       = "http://${aws_lb.backend.dns_name}"
}

output "asg_name" {
  description = "Name of the auto scaling group"
  value       = aws_appautoscaling_target.backend.resource_id
}

output "ecr_repository_url" {
  description = "URL of the ECR repository"
  value       = aws_ecr_repository.backend.repository_url
}

output "load_balancer_dns" {
  description = "DNS name of the load balancer"
  value       = aws_lb.backend.dns_name
}

output "log_group_name" {
  description = "Name of the CloudWatch log group"
  value       = aws_cloudwatch_log_group.backend.name
} 