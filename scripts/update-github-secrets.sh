#!/bin/bash
set -e

# Configuration
REPO_NAME="Electronic-MT103-Hard-Copy"
GITHUB_ORG="your-org-name"  # Change this to your GitHub org/username

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m'

# Check if GitHub CLI is installed and logged in
if ! gh auth status >/dev/null 2>&1; then
    echo -e "${RED}Please log in to GitHub first using: gh auth login${NC}"
    exit 1
fi

# Function to update a GitHub secret
update_secret() {
    local secret_name=$1
    local prompt_text=$2
    echo -e "${GREEN}Enter new value for $secret_name${NC}"
    echo -n "$prompt_text: "
    read -s secret_value
    echo
    echo "$secret_value" | gh secret set "$secret_name" --repo="$GITHUB_ORG/$REPO_NAME"
    echo -e "${GREEN}Updated $secret_name successfully${NC}"
}

# Function to update a GitHub variable
update_variable() {
    local var_name=$1
    local prompt_text=$2
    echo -e "${GREEN}Enter new value for $var_name${NC}"
    echo -n "$prompt_text: "
    read var_value
    gh variable set "$var_name" --body "$var_value" --repo="$GITHUB_ORG/$REPO_NAME"
    echo -e "${GREEN}Updated $var_name successfully${NC}"
}

# Menu for secret/variable selection
PS3="Select secret/variable to update (or 0 to exit): "
options=(
    "AZURE_CLIENT_ID (Secret)" 
    "AZURE_CLIENT_SECRET (Secret)" 
    "AZURE_TENANT_ID (Secret)" 
    "AZURE_SUBSCRIPTION_ID (Secret)"
    "AZURE_RG_NAME (Variable)"
    "AZURE_LOCATION (Variable)"
    "AZURE_WEBAPP_NAME (Variable)"
    "Exit"
)

select opt in "${options[@]}"
do
    case $opt in
        "AZURE_CLIENT_ID (Secret)")
            update_secret "AZURE_CLIENT_ID" "Enter Client ID"
            ;;
        "AZURE_CLIENT_SECRET (Secret)")
            update_secret "AZURE_CLIENT_SECRET" "Enter Client Secret"
            ;;
        "AZURE_TENANT_ID (Secret)")
            update_secret "AZURE_TENANT_ID" "Enter Tenant ID"
            ;;
        "AZURE_SUBSCRIPTION_ID (Secret)")
            update_secret "AZURE_SUBSCRIPTION_ID" "Enter Subscription ID"
            ;;
        "AZURE_RG_NAME (Variable)")
            update_variable "AZURE_RG_NAME" "Enter Resource Group Name"
            ;;
        "AZURE_LOCATION (Variable)")
            update_variable "AZURE_LOCATION" "Enter Azure Location"
            ;;
        "AZURE_WEBAPP_NAME (Variable)")
            update_variable "AZURE_WEBAPP_NAME" "Enter Web App Name"
            ;;
        "Exit")
            break
            ;;
        *) 
            echo "Invalid option"
            ;;
    esac
done
