/**
 * Marmitas Infrastructure 
 * Database Module
 */

# Create RDS PostgreSQL instance
resource "aws_db_instance" "postgres" {
  identifier            = "${var.environment}-marmitas-db"
  engine                = "postgres"
  engine_version        = "13.7"
  instance_class        = var.db_instance_class
  allocated_storage     = 20
  max_allocated_storage = 100
  storage_type          = "gp2"
  
  db_name     = var.db_name
  username    = var.db_username
  password    = var.db_password
  port        = 5432
  
  multi_az               = var.environment == "production" ? true : false
  publicly_accessible    = false
  db_subnet_group_name   = aws_db_subnet_group.main.name
  vpc_security_group_ids = [var.database_security_group_id]
  
  parameter_group_name = aws_db_parameter_group.postgres.name
  
  backup_retention_period = 7
  backup_window           = "03:00-04:00"
  maintenance_window      = "Mon:04:00-Mon:05:00"
  
  skip_final_snapshot     = var.environment != "production"
  final_snapshot_identifier = var.environment == "production" ? "${var.environment}-marmitas-db-final-snapshot" : null
  
  deletion_protection = var.environment == "production" ? true : false
  
  enabled_cloudwatch_logs_exports = ["postgresql", "upgrade"]
  
  performance_insights_enabled          = true
  performance_insights_retention_period = 7
  
  # Configure auto scaling with provisioned IOPS
  storage_encrypted = true
  
  tags = {
    Name = "${var.environment}-marmitas-database"
  }
}

# Create DB Subnet Group
resource "aws_db_subnet_group" "main" {
  name       = "${var.environment}-marmitas-db-subnet-group"
  subnet_ids = var.private_subnets
  
  tags = {
    Name = "${var.environment}-marmitas-db-subnet-group"
  }
}

# Create Parameter Group
resource "aws_db_parameter_group" "postgres" {
  name   = "${var.environment}-marmitas-postgres-params"
  family = "postgres13"
  
  parameter {
    name  = "log_connections"
    value = "1"
  }
  
  parameter {
    name  = "log_disconnections"
    value = "1"
  }
  
  parameter {
    name  = "log_statement"
    value = "ddl"
  }
  
  parameter {
    name  = "log_min_duration_statement"
    value = "1000"
  }
  
  parameter {
    name  = "max_connections"
    value = "100"
  }
  
  parameter {
    name  = "shared_buffers"
    value = "{DBInstanceClassMemory/32768}MB"
  }
  
  tags = {
    Name = "${var.environment}-marmitas-postgres-params"
  }
}

# Create CloudWatch alarms for database monitoring
resource "aws_cloudwatch_metric_alarm" "db_cpu" {
  alarm_name          = "${var.environment}-marmitas-db-cpu-high"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "CPUUtilization"
  namespace           = "AWS/RDS"
  period              = 300
  statistic           = "Average"
  threshold           = 80
  alarm_description   = "This metric monitors high database CPU utilization"
  
  dimensions = {
    DBInstanceIdentifier = aws_db_instance.postgres.id
  }
  
  alarm_actions = []
  ok_actions    = []
  
  tags = {
    Name = "${var.environment}-marmitas-db-cpu-alarm"
  }
}

resource "aws_cloudwatch_metric_alarm" "db_memory_free" {
  alarm_name          = "${var.environment}-marmitas-db-memory-low"
  comparison_operator = "LessThanThreshold"
  evaluation_periods  = 2
  metric_name         = "FreeableMemory"
  namespace           = "AWS/RDS"
  period              = 300
  statistic           = "Average"
  threshold           = 1000000000  # 1 GB in bytes
  alarm_description   = "This metric monitors low database memory"
  
  dimensions = {
    DBInstanceIdentifier = aws_db_instance.postgres.id
  }
  
  alarm_actions = []
  ok_actions    = []
  
  tags = {
    Name = "${var.environment}-marmitas-db-memory-alarm"
  }
}

resource "aws_cloudwatch_metric_alarm" "db_storage" {
  alarm_name          = "${var.environment}-marmitas-db-storage-low"
  comparison_operator = "LessThanThreshold"
  evaluation_periods  = 2
  metric_name         = "FreeStorageSpace"
  namespace           = "AWS/RDS"
  period              = 300
  statistic           = "Average"
  threshold           = 5000000000  # 5 GB in bytes
  alarm_description   = "This metric monitors low database storage"
  
  dimensions = {
    DBInstanceIdentifier = aws_db_instance.postgres.id
  }
  
  alarm_actions = []
  ok_actions    = []
  
  tags = {
    Name = "${var.environment}-marmitas-db-storage-alarm"
  }
}

# Create a Secret in AWS Secrets Manager to store database credentials securely
resource "aws_secretsmanager_secret" "db_credentials" {
  name        = "${var.environment}/marmitas/db-credentials"
  description = "Database credentials for Marmitas application"
  
  tags = {
    Name = "${var.environment}-marmitas-db-credentials"
  }
}

resource "aws_secretsmanager_secret_version" "db_credentials" {
  secret_id = aws_secretsmanager_secret.db_credentials.id
  secret_string = jsonencode({
    username = var.db_username
    password = var.db_password
    engine   = "postgres"
    host     = aws_db_instance.postgres.address
    port     = aws_db_instance.postgres.port
    dbname   = var.db_name
    url      = "postgresql://${var.db_username}:${var.db_password}@${aws_db_instance.postgres.address}:${aws_db_instance.postgres.port}/${var.db_name}"
  })
} 