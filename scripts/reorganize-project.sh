#!/bin/bash
# Reorganize project files into appropriate directories

PROJECT_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
DOCS_DIR="$PROJECT_ROOT/docs"
TEMPLATES_DIR="$DOCS_DIR/templates"
SCRIPTS_DIR="$PROJECT_ROOT/scripts"

# Create necessary directories if they don't exist
mkdir -p "$DOCS_DIR/guides"
mkdir -p "$DOCS_DIR/references"
mkdir -p "$TEMPLATES_DIR"
mkdir -p "$DOCS_DIR/compliance"

# Move MT103-related markdown files from project root to docs/
find "$PROJECT_ROOT" -maxdepth 1 -name "[0-9][0-9]_*.md" -exec mv {} "$DOCS_DIR/references/" \;

# Move error handling documentation to docs/guides
if [ -f "$PROJECT_ROOT/14_MT103_Error_Handling.md" ]; then
    mv "$PROJECT_ROOT/14_MT103_Error_Handling.md" "$DOCS_DIR/guides/error_handling.md"
fi

# Move workflow documentation to docs/guides
if [ -f "$PROJECT_ROOT/13_MT103_Submission_Workflow.md" ]; then
    mv "$PROJECT_ROOT/13_MT103_Submission_Workflow.md" "$DOCS_DIR/guides/submission_workflow.md"
fi

# Move audit documentation to docs/compliance
if [ -f "$PROJECT_ROOT/10_MT103_Audit_and_Log_Storage.md" ]; then
    mv "$PROJECT_ROOT/10_MT103_Audit_and_Log_Storage.md" "$DOCS_DIR/compliance/audit_logging.md"
fi

echo "✅ Project files have been reorganized"
