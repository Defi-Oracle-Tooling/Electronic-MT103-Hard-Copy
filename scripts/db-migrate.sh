#!/bin/bash
# Database migration automation script for MT103 system

set -e  # Exit immediately if a command exits with non-zero status

# Configuration
ENV="${1:-development}"  # Default to development if no environment specified
MIGRATIONS_DIR="./database/migrations"
BACKUP_DIR="./database/backups"
DATE_FORMAT=$(date +"%Y%m%d_%H%M%S")

# Make sure directories exist
mkdir -p "$MIGRATIONS_DIR"
mkdir -p "$BACKUP_DIR"

# Load environment variables
if [ -f ".env.$ENV" ]; then
    source ".env.$ENV"
elif [ -f ".env" ]; then
    source ".env"
else
    echo "Error: No environment file found"
    exit 1
fi

echo "🔄 Running database migrations for $ENV environment"

# Backup database before migration
echo "📦 Creating database backup..."
if [ "$DB_TYPE" == "postgres" ]; then
    PGPASSWORD=$DB_PASSWORD pg_dump -h $DB_HOST -U $DB_USER $DB_NAME > "$BACKUP_DIR/backup_${ENV}_${DATE_FORMAT}.sql"
elif [ "$DB_TYPE" == "mysql" ]; then
    mysqldump -h $DB_HOST -u $DB_USER -p$DB_PASSWORD $DB_NAME > "$BACKUP_DIR/backup_${ENV}_${DATE_FORMAT}.sql"
else
    echo "Unsupported database type: $DB_TYPE"
    exit 1
fi

# Run migrations
echo "🚀 Running migrations..."
NODE_ENV=$ENV npx knex migrate:latest

# Verify migration success
if [ $? -eq 0 ]; then
    echo "✅ Migrations completed successfully"
    
    # List applied migrations
    echo "Applied migrations:"
    NODE_ENV=$ENV npx knex migrate:list
else
    echo "❌ Migration failed"
    
    # Restore from backup if in production
    if [ "$ENV" == "production" ]; then
        echo "⚠️ Production environment detected. Attempting restoration from backup..."
        if [ "$DB_TYPE" == "postgres" ]; then
            PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -U $DB_USER $DB_NAME < "$BACKUP_DIR/backup_${ENV}_${DATE_FORMAT}.sql"
        elif [ "$DB_TYPE" == "mysql" ]; then
            mysql -h $DB_HOST -u $DB_USER -p$DB_PASSWORD $DB_NAME < "$BACKUP_DIR/backup_${ENV}_${DATE_FORMAT}.sql"
        fi
        echo "✅ Database restored from backup"
    fi
    
    exit 1
fi

# Run seeds if specified
if [ "$2" == "--seed" ]; then
    echo "🌱 Seeding database..."
    NODE_ENV=$ENV npx knex seed:run
fi

echo "🎉 Database migration process completed"
