#!/bin/bash
# Script to handle backup and restore operations for the MT103 system

set -e  # Exit immediately if a command exits with non-zero status

# Configuration
ACTION="${1:-backup}"  # Default to backup if no action specified
ENV="${2:-development}"  # Default to development if no environment specified
BACKUP_DIR="./backups"
DATE_FORMAT=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="$BACKUP_DIR/mt103_${ENV}_${DATE_FORMAT}.tar.gz"
DATA_DIR="./data"
CONFIG_DIR="./config"
RESTORE_FILE="${3:-}"  # Optional restore file path

# Create backup directory if it doesn't exist
mkdir -p "$BACKUP_DIR"

# Load environment variables
if [ -f ".env.$ENV" ]; then
    source ".env.$ENV"
elif [ -f ".env" ]; then
    source ".env"
fi

# Function to perform backup
function perform_backup() {
    echo "🔄 Performing backup for $ENV environment..."
    
    # Create temp directory
    local TEMP_DIR=$(mktemp -d)
    trap 'rm -rf "$TEMP_DIR"' EXIT
    
    echo "📦 Backing up database..."
    mkdir -p "$TEMP_DIR/database"
    
    if [ "$DB_TYPE" == "postgres" ]; then
        PGPASSWORD=$DB_PASSWORD pg_dump -h $DB_HOST -U $DB_USER $DB_NAME > "$TEMP_DIR/database/db_dump.sql"
    elif [ "$DB_TYPE" == "mysql" ]; then
        mysqldump -h $DB_HOST -u $DB_USER -p$DB_PASSWORD $DB_NAME > "$TEMP_DIR/database/db_dump.sql"
    elif [ "$DB_TYPE" == "mongodb" ]; then
        mongodump --host $DB_HOST --port $DB_PORT --db $DB_NAME --username $DB_USER --password $DB_PASSWORD --out "$TEMP_DIR/database"
    else
        echo "Unsupported database type: $DB_TYPE"
        exit 1
    fi
    
    echo "📦 Backing up configuration files..."
    cp -r "$CONFIG_DIR" "$TEMP_DIR/"
    
    echo "📦 Backing up data files..."
    if [ -d "$DATA_DIR" ]; then
        cp -r "$DATA_DIR" "$TEMP_DIR/"
    fi
    
    # Create a metadata file with backup information
    cat > "$TEMP_DIR/backup-metadata.json" << EOF
{
  "version": "$(grep '"version"' package.json | head -1 | sed -E 's/.*"version": "([^"]+)".*/\1/')",
  "environment": "$ENV",
  "date": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")",
  "hostname": "$(hostname)",
  "db_type": "$DB_TYPE",
  "db_name": "$DB_NAME"
}
EOF
    
    echo "📦 Creating compressed backup archive..."
    tar -czf "$BACKUP_FILE" -C "$TEMP_DIR" .
    
    echo "✅ Backup completed: $BACKUP_FILE ($(du -h "$BACKUP_FILE" | cut -f1))"
}

# Function to perform restore
function perform_restore() {
    if [ -z "$RESTORE_FILE" ]; then
        echo "❌ Error: No restore file specified"
        echo "Usage: $0 restore <environment> <backup-file>"
        exit 1
    fi
    
    if [ ! -f "$RESTORE_FILE" ]; then
        echo "❌ Error: Restore file not found: $RESTORE_FILE"
        exit 1
    fi
    
    echo "🔄 Performing restore for $ENV environment using $RESTORE_FILE..."
    
    # Create temp directory
    local TEMP_DIR=$(mktemp -d)
    trap 'rm -rf "$TEMP_DIR"' EXIT
    
    echo "📦 Extracting backup archive..."
    tar -xzf "$RESTORE_FILE" -C "$TEMP_DIR"
    
    # Check metadata for compatibility
    if [ -f "$TEMP_DIR/backup-metadata.json" ]; then
        BACKUP_ENV=$(grep -o '"environment":"[^"]*"' "$TEMP_DIR/backup-metadata.json" | sed 's/"environment":"\([^"]*\)"/\1/')
        if [ "$BACKUP_ENV" != "$ENV" ]; then
            echo "⚠️  Warning: Backup environment ($BACKUP_ENV) doesn't match target environment ($ENV)"
            read -p "Continue anyway? (y/N): " CONFIRM
            if [[ ! "$CONFIRM" =~ ^[Yy]$ ]]; then
                echo "❌ Restore canceled"
                exit 1
            fi
        fi
    else
        echo "⚠️  Warning: No metadata found in backup"
    fi
    
    echo "📦 Restoring database..."
    if [ "$DB_TYPE" == "postgres" ]; then
        PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -U $DB_USER $DB_NAME < "$TEMP_DIR/database/db_dump.sql"
    elif [ "$DB_TYPE" == "mysql" ]; then
        mysql -h $DB_HOST -u $DB_USER -p$DB_PASSWORD $DB_NAME < "$TEMP_DIR/database/db_dump.sql"
    elif [ "$DB_TYPE" == "mongodb" ]; then
        mongorestore --host $DB_HOST --port $DB_PORT --db $DB_NAME --username $DB_USER --password $DB_PASSWORD "$TEMP_DIR/database/$DB_NAME"
    else
        echo "Unsupported database type: $DB_TYPE"
        exit 1
    fi
    
    echo "📦 Restoring configuration files..."
    cp -r "$TEMP_DIR/config/"* "$CONFIG_DIR/"
    
    echo "📦 Restoring data files..."
    if [ -d "$TEMP_DIR/data" ]; then
        mkdir -p "$DATA_DIR"
        cp -r "$TEMP_DIR/data/"* "$DATA_DIR/"
    fi
    
    echo "✅ Restore completed successfully"
}

# Main execution
case "$ACTION" in
    "backup")
        perform_backup
        ;;
    "restore")
        perform_restore
        ;;
    "list")
        echo "Available backups:"
        ls -lh "$BACKUP_DIR" | grep "mt103_${ENV}"
        ;;
    *)
        echo "Unknown action: $ACTION"
        echo "Usage: $0 [backup|restore|list] [environment] [restore-file]"
        exit 1
        ;;
esac
