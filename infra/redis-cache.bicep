param name string
param location string = resourceGroup().location
param skuName string = 'Premium'
param skuFamily string = 'P'
param skuCapacity int = 1

resource redisCache 'Microsoft.Cache/Redis@2021-06-01' = {
  name: name
  location: location
  properties: {
    sku: {
      name: skuName
      family: skuFamily
      capacity: skuCapacity
    }
    enableNonSslPort: false
    minimumTlsVersion: '1.2'
    publicNetworkAccess: 'Disabled'
    redisConfiguration: {
      'maxmemory-policy': 'allkeys-lru'
    }
  }
}

output hostName string = redisCache.properties.hostName
output sslPort int = redisCache.properties.sslPort
