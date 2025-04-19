/**
 * Marmitas Infrastructure 
 * Backend Module
 */

# Create ECR repository for backend container images
resource "aws_ecr_repository" "backend" {
  name                 = "${var.environment}-marmitas-backend"
  image_tag_mutability = "MUTABLE"
  
  image_scanning_configuration {
    scan_on_push = true
  }
  
  tags = {
    Name = "${var.environment}-marmitas-backend-ecr"
  }
}

# Create Application Load Balancer for backend
resource "aws_lb" "backend" {
  name               = "${var.environment}-marmitas-backend-alb"
  internal           = true
  load_balancer_type = "application"
  security_groups    = [var.lb_security_group_id]
  subnets            = var.private_subnets
  
  enable_deletion_protection = false
  
  tags = {
    Name = "${var.environment}-marmitas-backend-alb"
  }
}

# Create Target Group for backend containers
resource "aws_lb_target_group" "backend" {
  name     = "${var.environment}-marmitas-backend-tg"
  port     = var.container_port
  protocol = "HTTP"
  vpc_id   = var.vpc_id
  
  health_check {
    path                = "/api/health"
    interval            = 30
    timeout             = 5
    healthy_threshold   = 2
    unhealthy_threshold = 3
    matcher             = "200"
  }
  
  tags = {
    Name = "${var.environment}-marmitas-backend-tg"
  }
}

# Create Load Balancer Listener
resource "aws_lb_listener" "backend" {
  load_balancer_arn = aws_lb.backend.arn
  port              = 80
  protocol          = "HTTP"
  
  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.backend.arn
  }
}

# Create ECS Cluster
resource "aws_ecs_cluster" "backend" {
  name = "${var.environment}-marmitas-backend-cluster"
  
  setting {
    name  = "containerInsights"
    value = "enabled"
  }
  
  tags = {
    Name = "${var.environment}-marmitas-backend-cluster"
  }
}

# Create ECS Task Definition
resource "aws_ecs_task_definition" "backend" {
  family                   = "${var.environment}-marmitas-backend"
  network_mode             = "awsvpc"
  requires_compatibilities = ["FARGATE"]
  cpu                      = 512
  memory                   = 1024
  execution_role_arn       = aws_iam_role.ecs_execution.arn
  task_role_arn            = aws_iam_role.ecs_task.arn
  
  container_definitions = jsonencode([
    {
      name      = "backend"
      image     = var.container_image
      essential = true
      
      portMappings = [
        {
          containerPort = var.container_port
          hostPort      = var.container_port
          protocol      = "tcp"
        }
      ]
      
      environment = [
        {
          name  = "NODE_ENV"
          value = var.environment
        },
        {
          name  = "PORT"
          value = tostring(var.container_port)
        },
        {
          name  = "DATABASE_URL"
          value = var.database_url
        },
        {
          name  = "DB_POOL_MIN"
          value = "2"
        },
        {
          name  = "DB_POOL_MAX"
          value = "10"
        },
        {
          name  = "DB_POOL_IDLE_TIMEOUT"
          value = "10000"
        }
      ]
      
      logConfiguration = {
        logDriver = "awslogs"
        options = {
          "awslogs-group"         = "/ecs/${var.environment}-marmitas-backend"
          "awslogs-region"        = var.aws_region
          "awslogs-stream-prefix" = "ecs"
        }
      }
      
      healthCheck = {
        command     = ["CMD-SHELL", "wget --no-verbose --tries=1 --spider http://localhost:${var.container_port}/api/health || exit 1"]
        interval    = 30
        timeout     = 5
        retries     = 3
        startPeriod = 60
      }
    }
  ])
  
  tags = {
    Name = "${var.environment}-marmitas-backend-task"
  }
}

# Create CloudWatch Log Group
resource "aws_cloudwatch_log_group" "backend" {
  name              = "/ecs/${var.environment}-marmitas-backend"
  retention_in_days = 30
  
  tags = {
    Name        = "${var.environment}-marmitas-backend-logs"
    Environment = var.environment
  }
}

# Create IAM roles for ECS
resource "aws_iam_role" "ecs_execution" {
  name = "${var.environment}-marmitas-backend-ecs-execution-role"
  
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          Service = "ecs-tasks.amazonaws.com"
        }
        Action = "sts:AssumeRole"
      }
    ]
  })
  
  tags = {
    Name = "${var.environment}-marmitas-backend-ecs-execution-role"
  }
}

resource "aws_iam_role" "ecs_task" {
  name = "${var.environment}-marmitas-backend-ecs-task-role"
  
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          Service = "ecs-tasks.amazonaws.com"
        }
        Action = "sts:AssumeRole"
      }
    ]
  })
  
  tags = {
    Name = "${var.environment}-marmitas-backend-ecs-task-role"
  }
}

# Attach policies to IAM roles
resource "aws_iam_role_policy_attachment" "ecs_execution" {
  role       = aws_iam_role.ecs_execution.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy"
}

# Create ECS Service
resource "aws_ecs_service" "backend" {
  name            = "${var.environment}-marmitas-backend-service"
  cluster         = aws_ecs_cluster.backend.id
  task_definition = aws_ecs_task_definition.backend.arn
  desired_count   = var.desired_capacity
  launch_type     = "FARGATE"
  
  network_configuration {
    subnets          = var.private_subnets
    security_groups  = [var.backend_security_group_id]
    assign_public_ip = false
  }
  
  load_balancer {
    target_group_arn = aws_lb_target_group.backend.arn
    container_name   = "backend"
    container_port   = var.container_port
  }
  
  depends_on = [
    aws_lb_listener.backend
  ]
  
  tags = {
    Name = "${var.environment}-marmitas-backend-service"
  }
}

# Create Auto Scaling for ECS
resource "aws_appautoscaling_target" "backend" {
  max_capacity       = var.max_capacity
  min_capacity       = var.min_capacity
  resource_id        = "service/${aws_ecs_cluster.backend.name}/${aws_ecs_service.backend.name}"
  scalable_dimension = "ecs:service:DesiredCount"
  service_namespace  = "ecs"
}

# Auto scaling based on CPU utilization
resource "aws_appautoscaling_policy" "backend_cpu" {
  name               = "${var.environment}-marmitas-backend-cpu-scaling"
  policy_type        = "TargetTrackingScaling"
  resource_id        = aws_appautoscaling_target.backend.resource_id
  scalable_dimension = aws_appautoscaling_target.backend.scalable_dimension
  service_namespace  = aws_appautoscaling_target.backend.service_namespace
  
  target_tracking_scaling_policy_configuration {
    predefined_metric_specification {
      predefined_metric_type = "ECSServiceAverageCPUUtilization"
    }
    
    target_value       = 70.0
    scale_in_cooldown  = 300
    scale_out_cooldown = 60
  }
}

# Auto scaling based on memory utilization
resource "aws_appautoscaling_policy" "backend_memory" {
  name               = "${var.environment}-marmitas-backend-memory-scaling"
  policy_type        = "TargetTrackingScaling"
  resource_id        = aws_appautoscaling_target.backend.resource_id
  scalable_dimension = aws_appautoscaling_target.backend.scalable_dimension
  service_namespace  = aws_appautoscaling_target.backend.service_namespace
  
  target_tracking_scaling_policy_configuration {
    predefined_metric_specification {
      predefined_metric_type = "ECSServiceAverageMemoryUtilization"
    }
    
    target_value       = 70.0
    scale_in_cooldown  = 300
    scale_out_cooldown = 60
  }
}

# Create CloudWatch Alarms for monitoring
resource "aws_cloudwatch_metric_alarm" "backend_high_cpu" {
  alarm_name          = "${var.environment}-marmitas-backend-high-cpu"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "CPUUtilization"
  namespace           = "AWS/ECS"
  period              = 60
  statistic           = "Average"
  threshold           = 85
  alarm_description   = "This metric monitors high CPU utilization for backend service"
  
  dimensions = {
    ClusterName = aws_ecs_cluster.backend.name
    ServiceName = aws_ecs_service.backend.name
  }
  
  alarm_actions = []
  ok_actions    = []
  
  tags = {
    Name = "${var.environment}-marmitas-backend-high-cpu-alarm"
  }
}

resource "aws_cloudwatch_metric_alarm" "backend_high_memory" {
  alarm_name          = "${var.environment}-marmitas-backend-high-memory"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "MemoryUtilization"
  namespace           = "AWS/ECS"
  period              = 60
  statistic           = "Average"
  threshold           = 85
  alarm_description   = "This metric monitors high memory utilization for backend service"
  
  dimensions = {
    ClusterName = aws_ecs_cluster.backend.name
    ServiceName = aws_ecs_service.backend.name
  }
  
  alarm_actions = []
  ok_actions    = []
  
  tags = {
    Name = "${var.environment}-marmitas-backend-high-memory-alarm"
  }
} 