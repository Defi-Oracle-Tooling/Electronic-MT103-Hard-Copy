# Azure Setup Guide

## Prerequisites
1. Install Azure CLI: https://docs.microsoft.com/en-us/cli/azure/install-azure-cli

## Creating Azure Credentials for GitHub Actions

1. Install the Azure CLI and login:
   ```
   az login
   ```

2. Set environment variables for your Azure resources:
   ```
   # Set these variables to your actual values
   export AZURE_SUBSCRIPTION_ID="your-subscription-id"
   export AZURE_RG_NAME="mt103-resource-group"
   
   # Verify the variables are set
   echo $AZURE_SUBSCRIPTION_ID
   echo $AZURE_RG_NAME
   ```

3. Create a service principal and generate credentials:
   ```
   # First create the resource group if it doesn't exist
   az group create --name $AZURE_RG_NAME --location eastus
   
   # Then create the service principal with access to the resource group
   az ad sp create-for-rbac --name "mt103-github-actions-sp" \
                            --role "Contributor" \
                            --scopes /subscriptions/$AZURE_SUBSCRIPTION_ID/resourceGroups/$AZURE_RG_NAME \
                            --json-auth
   ```

4. Copy the JSON output from the command above.

5. In your GitHub repository, go to Settings > Secrets and variables > Actions.

6. Click on "New repository secret".

7. Name the secret `AZURE_CREDENTIALS` and paste the JSON output as its value.

8. Click "Add secret".

Now the workflow can use these credentials to authenticate with Azure.

## Login and Setup
```bash
# Login to Azure
az login

# Set environment variables for your deployment
export AZURE_SUBSCRIPTION_ID="your-subscription-id"
export AZURE_RG_NAME="mt103-resource-group"
export AZURE_LOCATION="eastus"
export AZURE_WEBAPP_NAME="mt103-webapp"

# Set your subscription
az account set --subscription "$AZURE_SUBSCRIPTION_ID"

# Create a service principal and configure its access
az ad sp create-for-rbac \
  --name "mt103-app-sp" \
  --role "Contributor" \
  --scopes /subscriptions/$AZURE_SUBSCRIPTION_ID/resourceGroups/$AZURE_RG_NAME \
  --json-auth

# Create Resource Group (if it doesn't exist)
az group create \
  --name $AZURE_RG_NAME \
  --location $AZURE_LOCATION \
  --tags Project=MT103 Environment=Production

# Create App Service Plan
az appservice plan create \
  --name mt103-service-plan \
  --resource-group $AZURE_RG_NAME \
  --sku P1V2 \
  --is-linux \
  --tags Project=MT103 Environment=Production

# Create Web App
az webapp create \
  --name $AZURE_WEBAPP_NAME \
  --resource-group $AZURE_RG_NAME \
  --plan mt103-service-plan \
  --runtime "NODE|18-lts" \
  --https-only true

# Configure Web App settings for secure deployment
az webapp config set \
  --name $AZURE_WEBAPP_NAME \
  --resource-group $AZURE_RG_NAME \
  --min-tls-version 1.2 \
  --ftps-state Disabled

# Set up diagnostic logs
az webapp log config \
  --name $AZURE_WEBAPP_NAME \
  --resource-group $AZURE_RG_NAME \
  --application-logging filesystem \
  --detailed-error-messages true \
  --failed-request-tracing true \
  --web-server-logging filesystem
```

## Automated Setup Script

For a more streamlined setup experience, you can use the following script to automate the entire Azure infrastructure deployment for the MT103 system:

```bash
#!/bin/bash
# Save this as setup-azure-mt103.sh

set -e  # Exit immediately if a command exits with a non-zero status

# Configuration - Update these values
AZURE_SUBSCRIPTION_ID=""  # Your Azure subscription ID
AZURE_LOCATION="eastus"
AZURE_RG_NAME="rg-mt103"
AZURE_APP_NAME="mt103"
ENVIRONMENT="production"
TAG_PROJECT="MT103"

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
  --tags Project=$TAG_PROJECT Environment=$ENVIRONMENT

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
  --tags Project=$TAG_PROJECT Environment=$ENVIRONMENT

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
  --tags Project=$TAG_PROJECT Environment=$ENVIRONMENT

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

# Complete
echo ""
echo "Azure environment setup complete!"
echo "Your MT103 infrastructure is ready for deployment."
```

Make the script executable with `chmod +x setup-azure-mt103.sh` and run it. The script will create all the necessary Azure resources and output the GitHub secrets you need to configure.

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

## Additional Resources

- [Azure Login Action Documentation](https://github.com/marketplace/actions/azure-login)
- [Azure CLI Documentation](https://docs.microsoft.com/en-us/cli/azure/)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)

## Current Configuration

### Azure Resources

Our MT103 system currently uses the following Azure resources:

| Resource Type | Name | Region | Purpose |
|--------------|------|--------|---------|
| Resource Group | rg-mt103 | East US | Contains all MT103 resources |
| App Service Plan | mt103-plan | East US | Hosts web applications |
| Web App | mt103-production | East US | Production application |
| Key Vault | kv-mt103-production | East US | Secrets management |
| Application Insights | ai-mt103 | East US | Application monitoring |

### Current Users & Access

| Name | Role | GitHub Username | Azure Username |
|------|------|----------------|----------------|
| Jane Smith | Technical Lead | @janesmith | jane.smith@contoso.com |
| John Doe | DevOps Engineer | @johndoe | john.doe@contoso.com |
| Sam Johnson | Security Officer | @samjohnson | sam.johnson@contoso.com |
