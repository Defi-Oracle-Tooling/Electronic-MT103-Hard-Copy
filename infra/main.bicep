@description('Environment name')
param environment string = 'production'

@description('Azure region')
param location string = resourceGroup().location

@description('Tags for resources')
param tags object = {
  environment: environment
  project: 'MT103'
}

// App Service Plan
resource appServicePlan 'Microsoft.Web/serverfarms@2021-03-01' = {
  name: 'asp-mt103-${environment}'
  location: location
  tags: tags
  sku: {
    name: environment == 'production' ? 'P1v3' : 'B1'
    tier: environment == 'production' ? 'PremiumV3' : 'Basic'
  }
  properties: {
    reserved: true
  }
}

// Web App
resource webApp 'Microsoft.Web/sites@2021-03-01' = {
  name: 'app-mt103-${environment}'
  location: location
  tags: tags
  properties: {
    serverFarmId: appServicePlan.id
    httpsOnly: true
    siteConfig: {
      linuxFxVersion: 'NODE|18-lts'
      minTlsVersion: '1.2'
      http20Enabled: true
      appSettings: [
        {
          name: 'WEBSITE_NODE_DEFAULT_VERSION'
          value: '~18'
        }
      ]
    }
  }
}

// Key Vault for secrets
resource keyVault 'Microsoft.KeyVault/vaults@2021-06-01-preview' = {
  name: 'kv-mt103-${environment}'
  location: location
  tags: tags
  properties: {
    sku: {
      family: 'A'
      name: 'standard'
    }
    tenantId: subscription().tenantId
    accessPolicies: []
    enableRbacAuthorization: true
  }
}
