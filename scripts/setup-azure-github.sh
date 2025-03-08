#!/bin/bash
set -e

# Configuration
SUBSCRIPTION_ID=""
PROJECT_NAME="mt103"
LOCATION="eastus"
ENVIRONMENT="production"
REPO_NAME="Electronic-MT103-Hard-Copy"
GITHUB_ORG="your-org-name"  # Change this to your GitHub org/username

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m'

# Check required tools
echo "Checking required tools..."
command -v az >/dev/null 2>&1 || { echo "Azure CLI is required but not installed. Aborting." >&2; exit 1; }
command -v gh >/dev/null 2>&1 || { echo "GitHub CLI is required but not installed. Aborting." >&2; exit 1; }

# Ensure Azure CLI is logged in
if ! az account show >/dev/null 2>&1; then
    echo "Please log in to Azure first using: az login"
    exit 1
fi

# Ensure GitHub CLI is logged in
if ! gh auth status >/dev/null 2>&1; then
    echo "Please log in to GitHub first using: gh auth login"
    exit 1
fi

echo -e "${BLUE}Creating Azure Resources...${NC}"

# Set subscription
az account set --subscription "$SUBSCRIPTION_ID"

# Create resource group
RG_NAME="rg-${PROJECT_NAME}-${ENVIRONMENT}"
echo "Creating resource group: $RG_NAME"
az group create \
    --name "$RG_NAME" \
    --location "$LOCATION" \
    --tags Project="$PROJECT_NAME" Environment="$ENVIRONMENT"

# Create service principal for GitHub Actions
echo "Creating service principal for GitHub Actions..."
SP_OUTPUT=$(az ad sp create-for-rbac \
    --name "sp-${PROJECT_NAME}-github" \
    --role contributor \
    --scopes "/subscriptions/$SUBSCRIPTION_ID/resourceGroups/$RG_NAME" \
    --json-auth)

# Extract values from service principal
CLIENT_ID=$(echo $SP_OUTPUT | jq -r '.clientId')
CLIENT_SECRET=$(echo $SP_OUTPUT | jq -r '.clientSecret')
TENANT_ID=$(echo $SP_OUTPUT | jq -r '.tenantId')

echo -e "${GREEN}Azure resources created successfully!${NC}"

# Set up GitHub secrets
echo -e "${BLUE}Setting up GitHub secrets...${NC}"

# Function to set GitHub secret
set_github_secret() {
    local secret_name=$1
    local secret_value=$2
    echo "$secret_value" | gh secret set "$secret_name" --repo="$GITHUB_ORG/$REPO_NAME"
}

# Set GitHub secrets
echo "Setting GitHub secrets..."
set_github_secret "AZURE_CLIENT_ID" "$CLIENT_ID"
set_github_secret "AZURE_CLIENT_SECRET" "$CLIENT_SECRET"
set_github_secret "AZURE_TENANT_ID" "$TENANT_ID"
set_github_secret "AZURE_SUBSCRIPTION_ID" "$SUBSCRIPTION_ID"

# Set GitHub variables
echo "Setting GitHub variables..."
gh variable set "AZURE_RG_NAME" --body "$RG_NAME" --repo="$GITHUB_ORG/$REPO_NAME"
gh variable set "AZURE_LOCATION" --body "$LOCATION" --repo="$GITHUB_ORG/$REPO_NAME"
gh variable set "AZURE_WEBAPP_NAME" --body "app-${PROJECT_NAME}-${ENVIRONMENT}" --repo="$GITHUB_ORG/$REPO_NAME"

echo -e "${GREEN}Setup completed successfully!${NC}"
echo -e "Resource Group: ${BLUE}$RG_NAME${NC}"
echo -e "Location: ${BLUE}$LOCATION${NC}"
echo -e "Service Principal ID: ${BLUE}$CLIENT_ID${NC}"

# Create local .env file for development
cat > .env << EOF
AZURE_CLIENT_ID=$CLIENT_ID
AZURE_TENANT_ID=$TENANT_ID
AZURE_SUBSCRIPTION_ID=$SUBSCRIPTION_ID
AZURE_RG_NAME=$RG_NAME
AZURE_LOCATION=$LOCATION
AZURE_WEBAPP_NAME=app-${PROJECT_NAME}-${ENVIRONMENT}
EOF

echo "Environment variables saved to .env file"
