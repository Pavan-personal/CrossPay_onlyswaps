# Payment Backend API - Complete Documentation

## Base URL
```
http://localhost:3000
```

---

## Table of Contents
1. [Health Check](#1-health-check)
2. [Payment Links](#2-payment-links)
3. [Transactions](#3-transactions)
4. [Payment Attempts](#4-payment-attempts)
5. [Response Formats](#5-response-formats)
6. [Error Handling](#6-error-handling)
7. [Filtering Guide](#7-filtering-guide)

---

## 1. Health Check

### GET /health
Check if the API is running.

**Request:**
```bash
GET /health
```

**Response:**
```json
{
  "success": true,
  "message": "Payment Backend API is running",
  "timestamp": "2025-09-25T03:36:49.988Z"
}
```

---

## 2. Payment Links

### 2.1 Create Payment Link

**POST /api/payment/create**

Create a new payment link.

**Request Body:**
```json
{
  "creatorAddress": "0xECdcaE213E26397D63837380bA8f40AfCA97Eb99",
  "recipientAddress": "0x46E9A9F61d21d1d8EbBA21155B5394E2C8E16D2A",
  "amount": "1000000000000000000",
  "solverFee": "100000000000000000",
  "sourceChainId": 43113,
  "destinationChainId": 43113,
  "expiresInHours": 24
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "paymentId": "6ee424f4-d2c9-40cb-93ed-e173e45a5af9",
    "paymentLink": "http://localhost:3000/payment/6ee424f4-d2c9-40cb-93ed-e173e45a5af9",
    "expiresAt": "2025-09-25T18:09:40.004Z",
    "status": "pending"
  }
}
```

### 2.2 Get Payment Details

**GET /api/payment/{paymentId}**

Get details of a specific payment link.

**Request:**
```bash
GET /api/payment/6ee424f4-d2c9-40cb-93ed-e173e45a5af9
```

**Response:**
```json
{
  "success": true,
  "data": {
    "paymentId": "6ee424f4-d2c9-40cb-93ed-e173e45a5af9",
    "amount": "2000000000000000000",
    "solverFee": "1000000000000000000",
    "sourceChainId": 43113,
    "destinationChainId": 43113,
    "status": "pending",
    "expiresAt": "2025-09-25T18:09:40.004Z",
    "createdAt": "2025-09-24T18:09:40.006Z"
  }
}
```

### 2.3 Get Payment Links by Creator

**GET /api/payment/creator/{address}**

Get all payment links created by a specific address.

**Query Parameters:**
- `status` (optional): `pending`, `paid`
- `limit` (optional): Number of results (default: 50)
- `offset` (optional): Skip results (default: 0)

**Request:**
```bash
GET /api/payment/creator/0xECdcaE213E26397D63837380bA8f40AfCA97Eb99?status=pending&limit=10
```

**Response:**
```json
{
  "success": true,
  "data": {
    "paymentLinks": [
      {
        "paymentId": "6ee424f4-d2c9-40cb-93ed-e173e45a5af9",
        "creatorAddress": "0xECdcaE213E26397D63837380bA8f40AfCA97Eb99",
        "recipientAddress": "0x46E9A9F61d21d1d8EbBA21155B5394E2C8E16D2A",
        "amount": "2000000000000000000",
        "solverFee": "1000000000000000000",
        "sourceChainId": 43113,
        "destinationChainId": 43113,
        "status": "completed",
        "originalStatus": "paid",
        "createdAt": "2025-09-24T18:09:40.006Z",
        "expiresAt": "2025-09-25T18:09:40.004Z",
        "paidAt": "2025-09-24T18:12:17.730Z",
        "transactionHash": "0xb6d091332696f3136ac87b0699b1cb13022020b70394054bd24cfeefdc55805a",
        "paymentUrl": "http://localhost:3000/payment/6ee424f4-d2c9-40cb-93ed-e173e45a5af9",
        "attemptCount": 6,
        "successfulAttempts": 6,
        "failedAttempts": 0,
        "lastAttempt": {
          "timestamp": "2025-09-24T18:12:17.648Z",
          "address": "0x46E9A9F61d21d1d8EbBA21155B5394E2C8E16D2A",
          "chainId": 84532,
          "success": true,
          "errorMessage": null,
          "transactionHash": "0xb6d091332696f3136ac87b0699b1cb13022020b70394054bd24cfeefdc55805a"
        },
        "completionDetails": {
          "completedAt": "2025-09-24T18:12:17.648Z",
          "transactionHash": "0xb6d091332696f3136ac87b0699b1cb13022020b70394054bd24cfeefdc55805a",
          "attemptAddress": "0x46E9A9F61d21d1d8EbBA21155B5394E2C8E16D2A",
          "attemptChainId": 84532
        },
        "allAttempts": [...]
      }
    ],
    "pagination": {
      "total": 7,
      "limit": 50,
      "offset": 0,
      "hasMore": false
    }
  }
}
```

### 2.4 Validate Payment

**POST /api/payment/validate**

Validate a payment link before processing.

**Request Body:**
```json
{
  "paymentId": "6ee424f4-d2c9-40cb-93ed-e173e45a5af9",
  "recipientAddress": "0x46E9A9F61d21d1d8EbBA21155B5394E2C8E16D2A"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "paymentId": "6ee424f4-d2c9-40cb-93ed-e173e45a5af9",
    "amount": "2000000000000000000",
    "solverFee": "1000000000000000000",
    "sourceChainId": 43113,
    "destinationChainId": 43113,
    "creatorAddress": "0xECdcaE213E26397D63837380bA8f40AfCA97Eb99",
    "expiresAt": "2025-09-25T18:09:40.004Z",
    "metadata": {}
  }
}
```

---

## 3. Transactions

### 3.1 Create Transaction

**POST /api/transaction**

Create a new transaction (send/swap).

#### Send Transaction
**Request Body:**
```json
{
  "type": "send",
  "walletAddress": "0xECdcaE213E26397D63837380bA8f40AfCA97Eb99",
  "fromChainId": 43113,
  "toChainId": 43113,
  "amount": "1000000000000000000",
  "recipientAddress": "0x46E9A9F61d21d1d8EbBA21155B5394E2C8E16D2A",
  "success": true,
  "transactionHash": "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef"
}
```

#### Swap Transaction
**Request Body:**
```json
{
  "type": "swap",
  "walletAddress": "0xECdcaE213E26397D63837380bA8f40AfCA97Eb99",
  "fromChainId": 43113,
  "toChainId": 43113,
  "amount": "2000000000000000000",
  "tokenIn": "0x0000000000000000000000000000000000000000",
  "tokenOut": "0x1234567890123456789012345678901234567890",
  "success": true,
  "transactionHash": "0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "f418943c-b1ab-46e0-b59c-cea201482004",
    "type": "send",
    "walletAddress": "0xECdcaE213E26397D63837380bA8f40AfCA97Eb99",
    "fromChainId": 43113,
    "toChainId": 43113,
    "amount": "1000000000000000000",
    "recipientAddress": "0x46E9A9F61d21d1d8EbBA21155B5394E2C8E16D2A",
    "tokenIn": null,
    "tokenOut": null,
    "success": true,
    "errorMessage": null,
    "transactionHash": "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
    "timestamp": "2025-09-25T03:37:45.635Z",
    "metadata": {}
  }
}
```

### 3.2 Get Transactions by Wallet

**GET /api/transaction/wallet/{address}**

Get all transactions for a specific wallet address.

**Query Parameters:**
- `type` (optional): `send`, `swap`, `received`
- `success` (optional): `true`, `false`
- `direction` (optional): `sent`, `received`
- `limit` (optional): Number of results (default: 50)
- `offset` (optional): Skip results (default: 0)

**Sample Requests:**
```bash
# All transactions (sent + received)
GET /api/transaction/wallet/0xECdcaE213E26397D63837380bA8f40AfCA97Eb99

# Only sent transactions
GET /api/transaction/wallet/0xECdcaE213E26397D63837380bA8f40AfCA97Eb99?type=send

# Only received transactions
GET /api/transaction/wallet/0x46E9A9F61d21d1d8EbBA21155B5394E2C8E16D2A?type=received

# Only successful swap transactions
GET /api/transaction/wallet/0xECdcaE213E26397D63837380bA8f40AfCA97Eb99?type=swap&success=true

# Only sent transactions (alternative)
GET /api/transaction/wallet/0xECdcaE213E26397D63837380bA8f40AfCA97Eb99?direction=sent
```

**Response:**
```json
{
  "success": true,
  "data": {
    "transactions": [
      {
        "id": "54e978b6-5f9a-4ac9-a2b7-44f6766b9fa7",
        "type": "send",
        "walletAddress": "0xECdcaE213E26397D63837380bA8f40AfCA97Eb99",
        "fromChainId": 84532,
        "toChainId": null,
        "amount": "2500000000000000000",
        "recipientAddress": "0x46E9A9F61d21d1d8EbBA21155B5394E2C8E16D2A",
        "tokenIn": null,
        "tokenOut": null,
        "success": true,
        "errorMessage": null,
        "transactionHash": "0x1d711ae14cbee2776434346ba64ba45b3ba3479653ee374a40fa0dc014bfeaf1",
        "timestamp": "2025-09-25T06:16:56.400Z",
        "metadata": {}
      },
      {
        "id": "f418943c-b1ab-46e0-b59c-cea201482004",
        "type": "received",
        "walletAddress": "0xECdcaE213E26397D63837380bA8f40AfCA97Eb99",
        "fromChainId": 43113,
        "toChainId": 43113,
        "amount": "5000000000000000000",
        "recipientAddress": "0x46E9A9F61d21d1d8EbBA21155B5394E2C8E16D2A",
        "tokenIn": null,
        "tokenOut": null,
        "success": true,
        "errorMessage": null,
        "transactionHash": "0xswap1234567890abcdef1234567890abcdef1234567890abcdef1234567890",
        "timestamp": "2025-09-25T03:37:45.635Z",
        "metadata": {}
      }
    ],
    "pagination": {
      "total": 5,
      "limit": 50,
      "offset": 0,
      "hasMore": false
    }
  }
}
```

---

## 4. Payment Attempts

### 4.1 Record Payment Attempt

**POST /api/payment/attempt**

Record a payment attempt for a specific payment link.

**Request Body:**
```json
{
  "paymentId": "6ee424f4-d2c9-40cb-93ed-e173e45a5af9",
  "attemptAddress": "0x46E9A9F61d21d1d8EbBA21155B5394E2C8E16D2A",
  "attemptChainId": 43113,
  "success": true,
  "errorMessage": null,
  "transactionHash": "0xb6d091332696f3136ac87b0699b1cb13022020b70394054bd24cfeefdc55805a"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "ba005824-c87a-48ff-9dca-e7696e433fd4",
    "paymentId": "6ee424f4-d2c9-40cb-93ed-e173e45a5af9",
    "attemptAddress": "0x46E9A9F61d21d1d8EbBA21155B5394E2C8E16D2A",
    "attemptChainId": 43113,
    "attemptTimestamp": "2025-09-24T18:12:17.648Z",
    "success": true,
    "errorMessage": null,
    "transactionHash": "0xb6d091332696f3136ac87b0699b1cb13022020b70394054bd24cfeefdc55805a"
  }
}
```

---

## 5. Response Formats

### Success Response
All successful API calls return:
```json
{
  "success": true,
  "data": { ... },
  "pagination": {
    "total": 10,
    "limit": 50,
    "offset": 0,
    "hasMore": false
  }
}
```

### Error Response
All error responses return:
```json
{
  "success": false,
  "error": "Error message describing what went wrong"
}
```

---

## 6. Error Handling

### Common HTTP Status Codes
- `200` - Success
- `400` - Bad Request (validation errors)
- `403` - Forbidden (unauthorized access)
- `404` - Not Found (resource doesn't exist)
- `500` - Internal Server Error

### Validation Errors
```json
{
  "success": false,
  "error": "Validation error",
  "details": "creatorAddress must be a valid Ethereum address"
}
```

---

## 7. Filtering Guide

### Transaction Filters

#### Type Filter
- **`type=send`** - Shows only sent send transactions
- **`type=swap`** - Shows only sent swap transactions
- **`type=received`** - Shows only received transactions

#### Success Filter
- **`success=true`** - Shows only successful transactions
- **`success=false`** - Shows only failed transactions

#### Direction Filter (Alternative)
- **`direction=sent`** - Shows only sent transactions
- **`direction=received`** - Shows only received transactions

### Payment Link Filters

#### Status Filter
- **`status=pending`** - Shows only pending payment links
- **`status=paid`** - Shows only paid payment links

### Combined Filters
You can combine multiple filters:
```bash
# Successful sent send transactions
GET /api/transaction/wallet/0x...?type=send&success=true

# Pending payment links with pagination
GET /api/payment/creator/0x...?status=pending&limit=10&offset=0
```

---

## 8. Data Types & Formats

### Addresses
- **Format**: Ethereum addresses (0x followed by 40 hex characters)
- **Example**: `0xECdcaE213E26397D63837380bA8f40AfCA97Eb99`

### Amounts
- **Format**: Wei (smallest unit of ETH)
- **Example**: `1000000000000000000` (1 ETH)

### Chain IDs
- **43113** - Avalanche Testnet
- **84532** - Base Testnet

### Timestamps
- **Format**: ISO 8601 UTC
- **Example**: `2025-09-25T03:37:45.635Z`

### Transaction Types
- **`send`** - Direct transfer to another address
- **`swap`** - Token swap transaction
- **`received`** - Received transaction (converted from send)

---

## 9. Rate Limiting

Currently no rate limiting is implemented. Consider implementing rate limiting for production use.

---

## 10. CORS

CORS is enabled for all origins. Configure appropriately for production.

---

## 11. Database

- **Type**: PostgreSQL
- **ORM**: Prisma
- **Tables**: `payment_links`, `payment_attempts`, `transactions`

---

## 12. Development

### Starting the Server
```bash
npm start
```

### Database Setup
```bash
npx prisma db push
npx prisma generate
```

### Health Check
```bash
curl http://localhost:3000/health
```

---

## 13. Production Considerations

1. **Environment Variables**: Set up proper environment variables
2. **Rate Limiting**: Implement rate limiting
3. **CORS**: Configure CORS for specific origins
4. **Logging**: Add proper logging
5. **Monitoring**: Add health checks and monitoring
6. **Security**: Implement proper authentication/authorization
7. **Database**: Use connection pooling for production

---

*Last Updated: September 25, 2025*
