param profileName string
param location string = resourceGroup().location
param environment string

resource cdnProfile 'Microsoft.Cdn/profiles@2021-06-01' = {
  name: profileName
  location: location
  sku: {
    name: environment == 'production' ? 'Premium_Verizon' : 'Standard_Microsoft'
  }
  properties: {
    originResponseTimeoutSeconds: 60
  }
}

resource cdnEndpoint 'Microsoft.Cdn/profiles/endpoints@2021-06-01' = {
  parent: cdnProfile
  name: 'mt103-${environment}'
  location: location
  properties: {
    originHostHeader: '${webApp.properties.defaultHostName}'
    isHttpAllowed: false
    isHttpsAllowed: true
    optimizationType: 'GeneralWebDelivery'
    origins: [
      {
        name: 'webapp-origin'
        properties: {
          hostName: '${webApp.properties.defaultHostName}'
          originHostHeader: '${webApp.properties.defaultHostName}'
          priority: 1
          weight: 1000
          enabled: true
        }
      }
    ]
  }
}
