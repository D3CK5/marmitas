# Stage 1: Build environment
FROM node:18-alpine AS build

WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source files
COPY . .

# Build the application
RUN npm run build

# Stage 2: Production environment
FROM node:18-alpine AS production

WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install production dependencies only
RUN npm ci --only=production

# Copy built app from build stage
COPY --from=build /app/dist ./dist

# Copy scripts directory for entrypoint script
COPY scripts/docker-entrypoint.sh ./docker-entrypoint.sh
RUN chmod +x ./docker-entrypoint.sh

# Copy configuration files if needed
COPY .env.production ./.env

# Create a non-root user to run the application
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
USER appuser

# Setup environment variables
ENV NODE_ENV=production
ENV PORT=3000

# Add health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:${PORT}/api/health || exit 1

# Configure connection pool management
ENV DB_POOL_MIN=2
ENV DB_POOL_MAX=10
ENV DB_POOL_IDLE_TIMEOUT=10000

# Expose port
EXPOSE ${PORT}

# Start application using our entrypoint script
ENTRYPOINT ["./docker-entrypoint.sh"] 