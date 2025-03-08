#!/bin/bash

WORKFLOW_DIR=".github/workflows"
ACTIONS_DIR=".github/actions"

# Check if directories exist
if [ -d "$WORKFLOW_DIR" ]; then
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

git add .
git commit -m "chore: consolidate workflows and cleanup old files"
