# MT103 API Documentation

## Overview

The Electronic MT103 Hard Copy System provides a RESTful API for interacting with MT103 messages. This document details the available endpoints, authentication requirements, and example usage.

## Base URL

Production: `https://mt103-production.azurewebsites.net/api/v1`  
Development: `https://mt103-dev.azurewebsites.net/api/v1`

## Authentication

All API requests require authentication using JWT Bearer tokens:

```http
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

To obtain a token, use the `/auth/token` endpoint.

## Endpoints

### MT103 Message Operations

#### Create MT103 Message

```http
POST /mt103
Content-Type: application/json

{
  "messageId": "EXAMPLE20240501001",
  "senderBIC": "BANKFRPPXXX",
  "amount": 50000,
  "currency": "USD",
  "valueDate": "2024-05-03",
  "reference": "REF123456789",
  "beneficiaryName": "ACME Corporation",
  "beneficiaryAccount": "FR7630006000011234567890189"
}
```

**Response:**

```json
{
  "id": "8f7d6e5c-4b3a-2d1c-9f8e-7d6c5b4a3f2e",
  "status": "created",
  "timestamp": "2024-05-01T12:34:56Z",
  "referenceNumber": "MT103-20240501-001234"
}
```

#### Get MT103 Message

```http
GET /mt103/{id}
```

**Response:**

```json
{
  "id": "8f7d6e5c-4b3a-2d1c-9f8e-7d6c5b4a3f2e",
  "messageId": "EXAMPLE20240501001",
  "senderBIC": "BANKFRPPXXX",
  "amount": 50000,
  "currency": "USD",
  "valueDate": "2024-05-03",
  "reference": "REF123456789",
  "beneficiaryName": "ACME Corporation",
  "beneficiaryAccount": "FR7630006000011234567890189",
  "status": "processed",
  "createdAt": "2024-05-01T12:34:56Z",
  "updatedAt": "2024-05-01T12:35:15Z"
}
```

#### List MT103 Messages

```http
GET /mt103?page=1&limit=20&status=processed
```

**Response:**

```json
{
  "items": [
    {
      "id": "8f7d6e5c-4b3a-2d1c-9f8e-7d6c5b4a3f2e",
      "messageId": "EXAMPLE20240501001",
      "senderBIC": "BANKFRPPXXX",
      "amount": 50000,
      "currency": "USD",
      "status": "processed"
    },
    // More items...
  ],
  "page": 1,
  "limit": 20,
  "total": 157
}
```

### Validation Operations

#### Validate MT103 Format

```http
POST /validate/format
Content-Type: application/json

{
  "messageId": "EXAMPLE20240501001",
  // Other MT103 fields...
}
```

**Response:**

```json
{
  "isValid": true,
  "validationDetails": {
    "messageId": { "isValid": true },
    "senderBIC": { "isValid": true },
    "amount": { "isValid": true },
    "currency": { "isValid": true },
    "valueDate": { "isValid": true }
  }
}
```

## Error Handling

All errors follow a standard format:

```json
{
  "error": "VALIDATION_ERROR",
  "message": "Invalid BIC code format",
  "fields": [
    {
      "field": "senderBIC",
      "error": "BIC must be 8 or 11 characters"
    }
  ],
  "timestamp": "2024-05-01T13:45:30Z",
  "traceId": "abcd1234efgh5678"
}
```

## Rate Limiting

API requests are limited to 100 requests per minute per client. Rate limit information is included in response headers:
