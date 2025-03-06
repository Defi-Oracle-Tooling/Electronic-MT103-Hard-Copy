#!/usr/bin/env bash

PROJECT_ROOT="$(pwd)"
DOCS_DIR="$PROJECT_ROOT/docs"

echo "Creating documentation structure..."

# Create necessary directories
mkdir -p "$DOCS_DIR"
mkdir -p "$PROJECT_ROOT/scripts"
mkdir -p "$PROJECT_ROOT/.github/workflows"

# Core documentation files
DOCS=(
    "Project_Master_Plan.md"
    "Detailed_Technical_Plan.md"
    "Standards_Compliance_Checklist.md"
    "Standards_Citations.md"
)

# Existing MT103 documentation files
MT103_DOCS=(
    "01_MT103_Hard_Copy_Process_Overview.md"
    "02_Electronic_MT103_Processing_and_Compliance_Guide.md"
    "03_Fully_Formatted_Electronic_MT103_Template.md"
    "04_Fully_Customized_MT103_HTML_Form_with_JavaScript_Validation.md"
    "05_MT103_Compliance_Checklist.md"
    "06_MT103_Data_Fields_Explained.md"
    "07_SWIFT_MT103_Best_Practices.md"
    "08_Example_MT103_Transactions.md"
    "09_MT103_Validation_Scripts.md"
    "10_MT103_Audit_and_Log_Storage.md"
    "11_MT103_Encryption_and_Security.md"
    "12_MT103_Regulatory_References.md"
    "13_MT103_Submission_Workflow.md"
    "14_MT103_Error_Handling.md"
    "15_MT103_Integration_with_APIs.md"
    "16_FAQ_MT103_Transactions.md"
)

# Create core documentation files
for file in "${DOCS[@]}"; do
    if [ ! -f "$DOCS_DIR/$file" ]; then
        echo "# $file" > "$DOCS_DIR/$file"
        echo "Created $file"
    else
        echo "$file already exists"
    fi
done

# Move and create MT103 documentation files
for file in "${MT103_DOCS[@]}"; do
    if [ -f "$PROJECT_ROOT/$file" ]; then
        mv "$PROJECT_ROOT/$file" "$DOCS_DIR/$file"
        echo "Moved $file to docs/"
    elif [ ! -f "$DOCS_DIR/$file" ]; then
        echo "# $file" > "$DOCS_DIR/$file"
        echo "Created $file"
    else
        echo "$file already exists in docs/"
    fi
done

echo "Documentation structure is now in place."