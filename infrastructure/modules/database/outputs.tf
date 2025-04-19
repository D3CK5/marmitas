/**
 * Marmitas Infrastructure
 * Database Module Outputs
 */

output "database_endpoint" {
  description = "Endpoint of the database"
  value       = aws_db_instance.postgres.address
}

output "database_port" {
  description = "Port of the database"
  value       = aws_db_instance.postgres.port
}

output "database_name" {
  description = "Name of the database"
  value       = aws_db_instance.postgres.db_name
}

output "database_url" {
  description = "Connection URL for the database"
  value       = "postgresql://${var.db_username}:${var.db_password}@${aws_db_instance.postgres.address}:${aws_db_instance.postgres.port}/${var.db_name}"
  sensitive   = true
}

output "secret_arn" {
  description = "ARN of the database credentials secret"
  value       = aws_secretsmanager_secret.db_credentials.arn
} 