# Azure Deployment Guide

This guide provides detailed steps for deploying the MT103 system to Azure.

## Prerequisites

- Azure subscription (ID: `MT103-PROD-SUB`)
- GitHub account with access to the repository
- Azure CLI installed

## Deployment Steps

### 1. Configure Azure Resources

Use our automated setup script to provision all required resources:

```bash
# Clone the repository if you haven't already
git clone https://github.com/yourusername/Electronic-MT103-Hard-Copy.git
cd Electronic-MT103-Hard-Copy

# Make the setup script executable
chmod +x scripts/setup-azure-mt103.sh

# Configure with your subscription ID
export AZURE_SUBSCRIPTION_ID="f8d7c0a9-2b3e-4a5f-9d6c-7e8f9a0b1c2d"

# Run the setup script
./scripts/setup-azure-mt103.sh
```

### 2. Configure GitHub Actions

After running the setup script, you'll receive the output needed for GitHub Actions.

1. Go to your GitHub repository Settings > Secrets and variables > Actions
2. Add the following secrets:
   - `AZURE_CREDENTIALS`: The JSON output from the script
   - `AZURE_SUBSCRIPTION_ID`: Your subscription ID
   - `AZURE_RG_NAME`: The resource group name (e.g., "rg-mt103")
   - `AZURE_LOCATION`: The Azure region (e.g., "eastus")
   - `AZURE_WEBAPP_NAME`: The Web App name (e.g., "mt103-production")

### 3. CI/CD Pipeline

The GitHub Actions workflow automatically:
- Builds the application
- Runs tests
- Deploys to Azure
- Configures production settings

### 4. Verify Deployment

After successful deployment:

1. Access your application at `https://mt103-production.azurewebsites.net`
2. Check Azure Application Insights for monitoring
3. Verify that logs are being properly collected

## Monitoring and Maintenance

- **Logs**: Available through Azure Portal or using:
  ```bash
  az webapp log tail --name mt103-production --resource-group rg-mt103
  ```
- **Scaling**: Adjust App Service Plan as needed:
  ```bash
  az webapp scale --name mt103-production --resource-group rg-mt103 --plan-size P1V2
  ```
- **Backup**: Automated backups are configured daily

## Troubleshooting

| Issue | Resolution |
|-------|------------|
| Deployment failure | Check GitHub Actions logs |
| App not responding | Restart the web app in Azure Portal |
| Database connection issues | Verify connection strings in app settings |

For additional support, contact the DevOps team at devops@example.com.
