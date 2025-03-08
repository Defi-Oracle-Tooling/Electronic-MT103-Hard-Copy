#!/bin/bash
# MT103 Azure Setup Automation Script

set -e  # Exit immediately if a command exits with a non-zero status

# Configuration - Update these values
AZURE_SUBSCRIPTION_ID="f8d7c0a9-2b3e-4a5f-9d6c-7e8f9a0b1c2d"  # MT103 Production Subscription
AZURE_LOCATION="eastus"
AZURE_RG_NAME="rg-mt103"
AZURE_APP_NAME="mt103"
ENVIRONMENT="production"
TAG_PROJECT="MT103"
TAG_OWNER="DevOps Team"
TAG_COSTCENTER="FIN-2024-SWIFT"

# Check if subscription ID is provided
if [ -z "$AZURE_SUBSCRIPTION_ID" ]; then
  echo "Error: Please set your AZURE_SUBSCRIPTION_ID at the top of the script"
  exit 1
fi

echo "=== MT103 Azure Environment Setup ==="
echo "This script will set up the complete Azure environment for the MT103 system"

# Login to Azure
echo "Logging in to Azure..."
az login

# Set subscription
echo "Setting subscription..."
az account set --subscription "$AZURE_SUBSCRIPTION_ID"

# Create resource group
echo "Creating resource group..."
az group create \
  --name "$AZURE_RG_NAME" \
  --location "$AZURE_LOCATION" \
  --tags Project=$TAG_PROJECT Environment=$ENVIRONMENT Owner=$TAG_OWNER CostCenter=$TAG_COSTCENTER

# Create service principal for GitHub Actions
echo "Creating service principal for GitHub Actions..."
SP_OUTPUT=$(az ad sp create-for-rbac \
  --name "sp-$AZURE_APP_NAME-github" \
  --role "Contributor" \
  --scopes "/subscriptions/$AZURE_SUBSCRIPTION_ID/resourceGroups/$AZURE_RG_NAME" \
  --json-auth)

# Create App Service Plan
echo "Creating App Service Plan..."
az appservice plan create \
  --name "$AZURE_APP_NAME-plan" \
  --resource-group "$AZURE_RG_NAME" \
  --sku P1V2 \
  --is-linux \
  --tags Project=$TAG_PROJECT Environment=$ENVIRONMENT Owner=$TAG_OWNER CostCenter=$TAG_COSTCENTER

# Create Web App
echo "Creating Web App..."
az webapp create \
  --name "$AZURE_APP_NAME-$ENVIRONMENT" \
  --resource-group "$AZURE_RG_NAME" \
  --plan "$AZURE_APP_NAME-plan" \
  --runtime "NODE|18-lts" \
  --https-only true

# Configure security settings
echo "Configuring security settings..."
az webapp config set \
  --name "$AZURE_APP_NAME-$ENVIRONMENT" \
  --resource-group "$AZURE_RG_NAME" \
  --min-tls-version 1.2 \
  --ftps-state Disabled

# Set up diagnostic logs
echo "Setting up diagnostic logs..."
az webapp log config \
  --name "$AZURE_APP_NAME-$ENVIRONMENT" \
  --resource-group "$AZURE_RG_NAME" \
  --application-logging filesystem \
  --detailed-error-messages true \
  --failed-request-tracing true \
  --web-server-logging filesystem

# Create Azure Key Vault
echo "Creating Azure Key Vault..."
az keyvault create \
  --name "kv-$AZURE_APP_NAME-$ENVIRONMENT" \
  --resource-group "$AZURE_RG_NAME" \
  --location "$AZURE_LOCATION" \
  --tags Project=$TAG_PROJECT Environment=$ENVIRONMENT Owner=$TAG_OWNER CostCenter=$TAG_COSTCENTER

# Create Application Insights
echo "Creating Application Insights..."
az monitor app-insights component create \
  --app "ai-$AZURE_APP_NAME" \
  --location "$AZURE_LOCATION" \
  --resource-group "$AZURE_RG_NAME" \
  --tags Project=$TAG_PROJECT Environment=$ENVIRONMENT Owner=$TAG_OWNER CostCenter=$TAG_COSTCENTER

# Display GitHub Action Secrets
echo ""
echo "==== GITHUB ACTIONS CONFIGURATION ===="
echo "Add these secrets to your GitHub repository:"
echo ""
echo "AZURE_CREDENTIALS:"
echo "$SP_OUTPUT"
echo ""
echo "AZURE_SUBSCRIPTION_ID: $AZURE_SUBSCRIPTION_ID"
echo "AZURE_RG_NAME: $AZURE_RG_NAME"
echo "AZURE_LOCATION: $AZURE_LOCATION"
echo "AZURE_WEBAPP_NAME: $AZURE_APP_NAME-$ENVIRONMENT"

# Assign access permissions to team members
echo ""
echo "Assigning permissions to team members..."

# Technical Lead
az role assignment create \
  --assignee "jane.smith@contoso.com" \
  --role "Contributor" \
  --resource-group "$AZURE_RG_NAME"

# DevOps Engineer
az role assignment create \
  --assignee "john.doe@contoso.com" \
  --role "Contributor" \
  --resource-group "$AZURE_RG_NAME"

# Security Officer (read-only)
az role assignment create \
  --assignee "sam.johnson@contoso.com" \
  --role "Reader" \
  --resource-group "$AZURE_RG_NAME"

# Complete
echo ""
echo "Azure environment setup complete!"
echo "Your MT103 infrastructure is ready for deployment."
