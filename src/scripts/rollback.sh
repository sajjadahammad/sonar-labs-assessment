#!/bin/bash
set -e

APP_NAME="nextjs-app"
BACKUP_IMAGE="$APP_NAME:backup"
HEALTH_CHECK_URL="http://localhost:3000/api/health"

echo "🔄 Starting rollback procedure..."

# Check if backup exists
if ! docker images --format 'table {{.Repository}}:{{.Tag}}' | grep -q $BACKUP_IMAGE; then
    echo "❌ No backup image found"
    echo "Available images:"
    docker images $APP_NAME
    exit 1
fi

# Stop current container
echo "🛑 Stopping current container..."
docker stop $APP_NAME || true
docker rm $APP_NAME || true

# Start backup container
echo "▶️ Starting backup container..."
docker run -d \
  --name $APP_NAME \
  --restart unless-stopped \
  -p 3000:3000 \
  --env-file .env.production \
  $BACKUP_IMAGE

# Health check
echo "🏥 Performing health check..."
sleep 30 # Give container time to start

if curl -f $HEALTH_CHECK_URL > /dev/null 2>&1; then
    echo "✅ Rollback completed successfully!"
    echo "🔗 Application is running at: http://localhost:3000"
else
    echo "❌ Rollback failed - health check failed"
    docker logs $APP_NAME
    exit 1
fi