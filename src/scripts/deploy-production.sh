#!/bin/bash
set -e

# Configuration
APP_NAME="nextjs-app"
DOCKER_IMAGE="$APP_NAME:$(git rev-parse --short HEAD)"
BACKUP_IMAGE="$APP_NAME:backup"
HEALTH_CHECK_URL="http://localhost:3000/api/health"
ROLLBACK_TIMEOUT=300 # 5 minutes

echo "🚀 Starting production deployment..."

# Pre-deployment checks
echo "🔍 Running pre-deployment checks..."
npm run test
npm run lint
npm audit --audit-level high

# Build and tag new image
echo "🏗️ Building new Docker image..."
docker build -t $DOCKER_IMAGE .
docker tag $DOCKER_IMAGE $APP_NAME:latest

# Backup current running container
echo "💾 Creating backup of current deployment..."
if docker ps --format 'table {{.Names}}' | grep -q $APP_NAME; then
    docker tag $APP_NAME:latest $BACKUP_IMAGE
    echo "Backup created as $BACKUP_IMAGE"
else
    echo "No existing container found to backup"
fi

# Stop current container
echo "🛑 Stopping current container..."
docker stop $APP_NAME || true
docker rm $APP_NAME || true

# Start new container
echo "▶️ Starting new container..."
docker run -d \
  --name $APP_NAME \
  --restart unless-stopped \
  -p 3000:3000 \
  --env-file .env.production \
  $DOCKER_IMAGE

# Health check with timeout
echo "🏥 Performing health checks..."
timeout_counter=0
while [ $timeout_counter -lt $ROLLBACK_TIMEOUT ]; do
    if curl -f $HEALTH_CHECK_URL > /dev/null 2>&1; then
        echo "✅ Health check passed!"
        break
    fi
    
    echo "⏳ Waiting for application to be ready... ($timeout_counter/${ROLLBACK_TIMEOUT}s)"
    sleep 10
    timeout_counter=$((timeout_counter + 10))
done

# Check if deployment was successful
if [ $timeout_counter -ge $ROLLBACK_TIMEOUT ]; then
    echo "❌ Deployment failed - health check timeout"
    echo "🔄 Rolling back to previous version..."
    
    # Stop failed container
    docker stop $APP_NAME || true
    docker rm $APP_NAME || true
    
    # Start backup container
    if docker images --format 'table {{.Repository}}:{{.Tag}}' | grep -q $BACKUP_IMAGE; then
        docker run -d \
          --name $APP_NAME \
          --restart unless-stopped \
          -p 3000:3000 \
          --env-file .env.production \
          $BACKUP_IMAGE
        echo "✅ Rollback completed"
    else
        echo "❌ No backup image found - manual intervention required"
        exit 1
    fi
    exit 1
fi

# Cleanup old images (keep last 3)
echo "🧹 Cleaning up old images..."
docker images $APP_NAME --format "table {{.CreatedAt}}\t{{.ID}}" | \
  tail -n +4 | \
  awk '{print $2}' | \
  xargs -r docker rmi || true

echo "🎉 Deployment completed successfully!"
echo "🔗 Application is running at: http://localhost:3000"