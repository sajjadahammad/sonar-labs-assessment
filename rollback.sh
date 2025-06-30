#!/bin/bash

APP_NAME="analytics-dashboard"
CONTAINER_NAME="analytics_dashboard"
PREVIOUS_IMAGE="node:18-alpine"  # Replace with your previous known good image tag
BACKUP_DIR="/app/backups"
BACKUP_FILE="indexeddb_backup_$(date -d 'yesterday' +%Y%m%d).json"
CURRENT_IMAGE=$(docker inspect --format='{{.Config.Image}}' $CONTAINER_NAME 2>/dev/null || echo "")

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
NC='\033[0m' # No Color

# Function to log messages
log() {
    echo -e "[$(date '+%Y-%m-%d %H:%M:%S')] $1"
}

# Function to check if a command failed
check_error() {
    if [ $? -ne 0 ]; then
        log "${RED}Error: $1${NC}"
        exit 1
    fi
}

# 1. Check if the container is running
log "Checking for running container: $CONTAINER_NAME"
if [ -z "$(docker ps -q -f name=$CONTAINER_NAME)" ]; then
    log "${RED}No running container found for $CONTAINER_NAME${NC}"
    exit 1
fi

# 2. Stop and remove the current container
log "Stopping current container..."
docker stop $CONTAINER_NAME
check_error "Failed to stop container"
log "Removing current container..."
docker rm $CONTAINER_NAME
check_error "Failed to remove container"

# 3. Pull the previous Docker image
log "Pulling previous image: $PREVIOUS_IMAGE..."
docker pull $PREVIOUS_IMAGE
check_error "Failed to pull previous image"

# 4. Start the container with the previous image
log "Starting container with previous image..."
docker run -d --name $CONTAINER_NAME \
    -p 3000:3000 \
    -e NODE_ENV=production \
    -e PORT=3000 \
    -e HOSTNAME="0.0.0.0" \
    $PREVIOUS_IMAGE
check_error "Failed to start container with previous image"

# 5. Restore IndexedDB backup (client-side restoration)
# Note: This assumes a backup JSON file exists and will be restored client-side
if [ -f "$BACKUP_DIR/$BACKUP_FILE" ]; then
    log "Found IndexedDB backup: $BACKUP_FILE"
    # The restoration is handled client-side via JavaScript
    # Create a temporary script to restore the backup
    cat > /tmp/restore_indexeddb.js << 'EOF'
const { saveToIndexedDB } = require('./analyticsDB');

async function restoreBackup() {
    try {
        const backupData = require('$BACKUP_DIR/$BACKUP_FILE');
        await saveToIndexedDB('analytics_data', backupData.analytics_data || []);
        await saveToIndexedDB('analytics_sites', backupData.analytics sites || []);
        console.log('IndexedDB backup restored successfully');
    } catch (error) {
        console.error('Failed to restore IndexedDB backup:', error);
        process.exit(1);
    }
}

restoreBackup();
EOF

    log "Restoring IndexedDB backup..."
    docker cp /tmp/restore_indexeddb.js $CONTAINER_NAME:/app/restore_indexeddb.js
    docker exec $CONTAINER_NAME node /app/restore_indexeddb.js
    check_error "Failed to restore IndexedDB backup"
    rm /tmp/restore_indexeddb.js
else
    log "${RED}No backup file found at $BACKUP_DIR/$BACKUP_FILE${NC}"
    log "Continuing without restoring IndexedDB data"
fi

# 6. Verify the container is running
log "Verifying container status..."
if [ -n "$(docker ps -q -f name=$CONTAINER_NAME)" ]; then
    log "${GREEN}Rollback completed successfully. Container running with image: $PREVIOUS_IMAGE${NC}"
else
    log "${RED}Rollback failed. Container not running.${NC}"
    exit 1
fi

exit 0
