#!/bin/bash

# Configuration
SUBSCRIPTION_ID=""
RESOURCE_GROUP="rg-mt103"
LOCATION="westeurope"
APP_NAME="mt103"
ENV_NAME="production"

# Login to Azure
echo "Logging in to Azure..."
az login

# Set subscription
az account set --subscription "$SUBSCRIPTION_ID"

# Create resource group
echo "Creating resource group..."
az group create --name "$RESOURCE_GROUP" --location "$LOCATION"

# Create service principal
echo "Creating service principal..."
SP_INFO=$(az ad sp create-for-rbac --name "sp-$APP_NAME" --role contributor \
    --scopes /subscriptions/$SUBSCRIPTION_ID/resourceGroups/$RESOURCE_GROUP \
    -o json)

# Extract credentials
SP_CLIENT_ID=$(echo $SP_INFO | jq -r '.appId')
SP_CLIENT_SECRET=$(echo $SP_INFO | jq -r '.password')
SP_TENANT_ID=$(echo $SP_INFO | jq -r '.tenant')

# Create GitHub secrets
echo "Add these secrets to your GitHub repository:"
echo "AZURE_CREDENTIALS:"
echo $SP_INFO
echo "AZURE_SUBSCRIPTION_ID: $SUBSCRIPTION_ID"
echo "AZURE_RG_NAME: $RESOURCE_GROUP"
echo "AZURE_LOCATION: $LOCATION"
