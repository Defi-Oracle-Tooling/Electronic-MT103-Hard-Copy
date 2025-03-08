#!/bin/bash

WORKFLOW_DIR=".github/workflows"
ACTIONS_DIR=".github/actions"

# Backup before removal
BACKUP_DIR="backups/workflows/$(date +%Y%m%d)"
mkdir -p "$BACKUP_DIR"

# Check if directories exist
if [ -d "$WORKFLOW_DIR" ]; then
    cp -r "$WORKFLOW_DIR"/* "$BACKUP_DIR/" 2>/dev/null || true
    cd "$WORKFLOW_DIR"
    for file in generate-pdf.yml send-email.yml pdf-workflow.yml email-workflow.yml; do
        if [ -f "$file" ]; then
            rm "$file"
            echo "Removed $file"
        fi
    done
    cd ../..
fi

if [ -d "$ACTIONS_DIR" ]; then
    cd "$ACTIONS_DIR"
    for file in generate-pdf-action.yml send-email-action.yml; do
        if [ -f "$file" ]; then
            rm "$file"
            echo "Removed $file"
        fi
    done
    cd ../..
fi

# Validate consolidated workflow
if [ -f ".github/workflows/mt103-workflow.yml" ]; then
    node scripts/validate-workflow.js .github/workflows/mt103-workflow.yml
else
    echo "Error: Consolidated workflow missing"
    exit 1
fi

git add .
git commit -m "chore: consolidate workflows and cleanup old files"
