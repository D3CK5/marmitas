#!/bin/sh
set -e

# Check if DB migration flag is set
if [ "$RUN_MIGRATIONS" = "true" ]; then
  echo "Running database migrations..."
  node dist/scripts/run-migrations.js
fi

# Configure connection pool based on environment variables
if [ -n "$DB_POOL_MIN" ] && [ -n "$DB_POOL_MAX" ] && [ -n "$DB_POOL_IDLE_TIMEOUT" ]; then
  echo "Configuring connection pool..."
  export DB_POOL_CONFIG="{\"min\":$DB_POOL_MIN,\"max\":$DB_POOL_MAX,\"idleTimeoutMillis\":$DB_POOL_IDLE_TIMEOUT}"
fi

# Check health endpoint
healthcheck() {
  echo "Performing initial health check..."
  timeout 10s sh -c 'until wget -q -O - http://localhost:${PORT:-3000}/api/health > /dev/null 2>&1; do sleep 1; done' || {
    echo "Initial health check failed. Check logs for details."
    # Continue anyway, as the server might still be starting up
  }
}

# Start the application
echo "Starting application in ${NODE_ENV:-production} mode..."
node dist/index.js &
APP_PID=$!

# Perform health check in background
healthcheck &

# Wait for the application to exit
wait $APP_PID 