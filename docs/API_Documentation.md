# MT103 API Documentation

## Authentication
All endpoints require JWT authentication using Bearer token format.

```javascript
Authorization: Bearer <your-jwt-token>
```

## Rate Limiting
- 100 requests per 15 minutes per IP
- Status 429 returned when limit exceeded

## Endpoints

### 1. Validate MT103 Message
POST /api/v1/mt103/validate

**Request Body:**
```json
{
  "messageId": "MSG123456",
  "senderBIC": "BOFAUS3NXXX",
  "amount": "1000,00",
  "currency": "USD",
  "valueDate": "240305"
}
```

**Response:**
```json
{
  "isValid": true,
  "validationDetails": {
    "messageId": { "isValid": true, "format": "MessageId" },
    "swift": { "isValid": true, "format": "BIC/SWIFT" }
  }
}
```

### 2. Submit MT103 Transaction
POST /api/v1/mt103/submit

**Headers:**
```
x-message-signature: <hmac-signature>
```

**Response:**
```json
{
  "messageId": "MSG123456",
  "status": "accepted",
  "timestamp": "2024-03-05T12:34:56Z"
}
```

### 3. Monitoring Endpoints

#### Get System Metrics
GET /api/v1/mt103/metrics
Role Required: ADMIN

**Response:**
```json
{
  "totalTransactions": 1000,
  "averageProcessingTime": 150,
  "errorRate": 0.02
}
```

#### Get Performance Metrics
GET /api/v1/mt103/performance
Role Required: ADMIN

#### Get System Health
GET /api/v1/mt103/health

## Error Handling

### Standard Error Response
```json
{
  "error": "Error message",
  "code": "ERROR_CODE",
  "details": {}
}
```

### HTTP Status Codes
- 200: Success
- 400: Invalid request
- 401: Unauthorized
- 403: Forbidden
- 429: Rate limit exceeded
- 500: Server error
