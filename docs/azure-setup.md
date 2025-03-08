# Azure Setup Instructions

## Prerequisites
1. Install Azure CLI: https://docs.microsoft.com/en-us/cli/azure/install-azure-cli

## Login and Setup
```bash
# Login to Azure
az login

# Set your subscription
az account set --subscription "$AZURE_SUBSCRIPTION_ID"

# Create a service principal and configure its access
az ad sp create-for-rbac \
  --name "mt103-app-sp" \
  --role contributor \
  --scopes /subscriptions/$AZURE_SUBSCRIPTION_ID \
  --json-auth

# Create Resource Group
az group create \
  --name $AZURE_RG_NAME \
  --location $AZURE_LOCATION

# Create App Service Plan
az appservice plan create \
  --name mt103-service-plan \
  --resource-group $AZURE_RG_NAME \
  --sku B1 \
  --is-linux

# Create Web App
az webapp create \
  --name $AZURE_WEBAPP_NAME \
  --resource-group $AZURE_RG_NAME \
  --plan mt103-service-plan \
  --runtime "NODE:18-lts"
```

## Required Environment Variables
Set these values in your GitHub repository secrets:
```bash
# Azure Configuration
AZURE_CLIENT_ID=<service-principal-client-id>
AZURE_TENANT_ID=<service-principal-tenant-id>
AZURE_SUBSCRIPTION_ID=<your-subscription-id>
AZURE_RG_NAME=<resource-group-name>
AZURE_LOCATION=<azure-region>
AZURE_WEBAPP_NAME=<web-app-name>

# Security Scanning Configuration
SNYK_TOKEN=<your-snyk-auth-token>  # Get this from your Snyk account settings
```

## Useful Commands
```bash
# List all resource groups
az group list --output table

# List web apps in resource group
az webapp list --resource-group $AZURE_RG_NAME --output table

# Get web app deployment logs
az webapp log tail --name $AZURE_WEBAPP_NAME --resource-group $AZURE_RG_NAME

# Scale web app
az webapp scale --name $AZURE_WEBAPP_NAME \
  --resource-group $AZURE_RG_NAME \
  --plan-size S1

# Configure web app settings
az webapp config appsettings set \
  --name $AZURE_WEBAPP_NAME \
  --resource-group $AZURE_RG_NAME \
  --settings NODE_ENV=production
```

## Cleanup
```bash
# Delete resource group and all resources
az group delete --name $AZURE_RG_NAME --yes --no-wait

# Delete service principal
az ad sp delete --id $AZURE_CLIENT_ID
```
