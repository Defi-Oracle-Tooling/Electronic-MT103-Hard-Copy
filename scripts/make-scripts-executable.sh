#!/bin/bash
# Makes all shell scripts in the project executable

# Find all .sh files in the scripts directory and make them executable
find $(dirname "$0") -type f -name "*.sh" -exec chmod +x {} \;

# Make the setup script executable too
chmod +x "$(dirname "$0")/../scripts/setup-azure-mt103.sh"

echo "✅ Made all shell scripts executable"
