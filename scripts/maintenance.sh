#!/bin/bash
# Central maintenance script to run all project maintenance tasks

set -e  # Exit immediately if a command exits with non-zero status

SCRIPT_DIR="$(dirname "$0")"
ACTION="${1:-all}"  # Default to running all maintenance tasks if none specified

# Print welcome message
echo "🛠️  MT103 System Maintenance Script"
echo "======================================"

# Make all scripts executable
chmod +x "$SCRIPT_DIR"/*.sh

# Function to run a script with proper error handling
run_script() {
    echo -e "\n📋 Running: $1"
    echo "----------------------------------------"
    
    if "$SCRIPT_DIR/$1"; then
        echo -e "✅ Successfully executed: $1\n"
        return 0
    else
        echo -e "❌ Failed executing: $1\n"
        if [ "$2" = "critical" ]; then
            echo "Critical script failed, aborting maintenance..."
            exit 1
        fi
        return 1
    fi
}

# Execute maintenance tasks based on the action parameter
case "$ACTION" in
    "update-deps")
        run_script "update-dependencies.js" "non-critical"
        ;;
    "test")
        run_script "run-tests.sh" "critical"
        ;;
    "docs")
        run_script "update-docs.sh" "non-critical"
        ;;
    "compliance")
        run_script "compliance-check.sh" "critical"
        ;;
    "security")
        run_script "security-scan.sh" "critical"
        ;;
    "monitoring")
        run_script "setup-monitoring.sh" "non-critical"
        ;;
    "info")
        run_script "project-info.sh" "non-critical"
        ;;
    "organize")
        run_script "reorganize-project.sh" "non-critical"
        ;;
    "db")
        run_script "db-migrate.sh" "critical"
        ;;
    "backup")
        run_script "backup-restore.sh backup" "critical"
        ;;
    "docker")
        echo "Starting development Docker environment..."
        docker-compose -f docker-compose.dev.yml up -d
        ;;
    "ai-test")
        run_script "setup-ai-integration.sh" "non-critical"
        echo "Running AI integration tests..."
        pnpm test tests/ai/
        ;;
    "ai-setup")
        run_script "setup-ai-integration.sh" "non-critical"
        ;;
    "all")
        echo -e "\n🚀 Running all maintenance tasks..."
        run_script "make-scripts-executable.sh" "critical"
        run_script "update-dependencies.js" "non-critical"
        run_script "reorganize-project.sh" "non-critical"
        run_script "update-docs.sh" "non-critical"
        run_script "project-info.sh" "non-critical"
        run_script "run-tests.sh" "critical"
        run_script "compliance-check.sh" "critical"
        run_script "security-scan.sh" "critical"
        run_script "backup-restore.sh backup" "non-critical"
        run_script "setup-ai-integration.sh" "non-critical"
        echo -e "\n✨ All maintenance tasks completed!"
        ;;
    *)
        echo "Unknown action: $ACTION"
        echo "Available actions: update-deps, test, docs, compliance, security, monitoring, info, organize, db, backup, docker, ai-test, ai-setup, all"
        exit 1
        ;;
esac
