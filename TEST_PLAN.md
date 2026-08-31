# Expense Tracker - Comprehensive Test Plan

**Version:** 1.0  
**Last Updated:** 2026-08-31  
**API Base URL:** `http://localhost:5001`

## Quick Reference

- **Visual Test Plan:** See the interactive HTML artifact for formatted test cases with curl commands
- **Testing Sequence:** Follow the suggested test order at the end of this document
- **Authentication:** All protected endpoints require `Authorization: Bearer {accessToken}` header

---

## 1. AUTHENTICATION TESTS

### 1.1 Signup with New Email (T-AUTH-001)

**Objective:** Create a new user account  
**Endpoint:** `POST /api/auth/signup`  
**Rate Limit:** 5 requests per 15 minutes

#### Failure Points
- Invalid email format (missing @, invalid domain)
- Password < 6 characters
- Empty name field
- Email already exists (duplicate signup)
- Missing required fields
- Rate limiting exceeded (429)

#### Sample Data
```json
{
  "email": "alice@example.com",
  "password": "SecurePass123",
  "name": "Alice Johnson"
}
```

#### Test Cases

**Case 1.1.1: Success - New User**
```bash
curl -X POST http://localhost:5001/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "alice@example.com",
    "password": "SecurePass123",
    "name": "Alice Johnson"
  }'
```

Expected: `201 Created`
```json
{
  "success": true,
  "data": {
    "_id": "user_id_here",
    "email": "alice@example.com",
    "name": "Alice Johnson",
    "currency": "INR",
    "timezone": "Asia/Kolkata",
    "language": "en",
    "accessToken": "...",
    "refreshToken": "..."
  }
}
```

**Case 1.1.2: Duplicate Email**
```bash
curl -X POST http://localhost:5001/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "alice@example.com",
    "password": "Pass123",
    "name": "Alice"
  }'
```

Expected: `400 Bad Request`
```json
{
  "success": false,
  "error": {
    "code": "EMAIL_EXISTS",
    "message": "Email already registered"
  }
}
```

**Case 1.1.3: Invalid Password (< 6 chars)**
```bash
curl -X POST http://localhost:5001/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "12345",
    "name": "Test"
  }'
```

Expected: `400 Bad Request`
```json
{
  "success": false,
  "error": {
    "code": "WEAK_PASSWORD",
    "message": "Password must be at least 6 characters"
  }
}
```

---

### 1.2 Login with Credentials (T-AUTH-002)

**Objective:** Authenticate and receive JWT tokens  
**Endpoint:** `POST /api/auth/login`  
**Rate Limit:** 5 requests per 15 minutes

#### Failure Points
- Wrong password
- User doesn't exist
- Missing email or password
- Rate limiting exceeded (429)

#### Sample Data
```json
{
  "email": "alice@example.com",
  "password": "SecurePass123"
}
```

#### Test Cases

**Case 1.2.1: Success - Valid Credentials**
```bash
curl -X POST http://localhost:5001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "alice@example.com",
    "password": "SecurePass123"
  }'
```

Expected: `200 OK`
```json
{
  "success": true,
  "data": {
    "user": {
      "_id": "507f1f77bcf86cd799439001",
      "email": "alice@example.com",
      "name": "Alice Johnson",
      "currency": "INR"
    },
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expiresIn": 900
  }
}
```

**Case 1.2.2: Wrong Password**
```bash
curl -X POST http://localhost:5001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "alice@example.com",
    "password": "WrongPassword"
  }'
```

Expected: `401 Unauthorized`
```json
{
  "success": false,
  "error": {
    "code": "INVALID_CREDENTIALS",
    "message": "Invalid email or password"
  }
}
```

**Case 1.2.3: Missing Fields**
```bash
curl -X POST http://localhost:5001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "alice@example.com"
  }'
```

Expected: `400 Bad Request`
```json
{
  "success": false,
  "error": {
    "code": "INVALID_INPUT",
    "message": "Email and password required"
  }
}
```

---

### 1.3 Token Refresh (T-AUTH-003)

**Objective:** Get new access token using refresh token  
**Endpoint:** `POST /api/auth/refresh`  
**Access Token Expiry:** 15 minutes  
**Refresh Token Expiry:** 7 days

#### Failure Points
- Invalid refresh token
- Expired refresh token (>7 days)
- Missing refresh token
- Tampered token
- Rate limiting exceeded

#### Sample Data
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

#### Test Cases

**Case 1.3.1: Success - Valid Refresh Token**
```bash
curl -X POST http://localhost:5001/api/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }'
```

Expected: `200 OK`
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expiresIn": 900
  }
}
```

---

### 1.4 Get User Profile (T-AUTH-004)

**Objective:** Retrieve authenticated user's profile  
**Endpoint:** `GET /api/auth/profile`  
**Authentication:** Required

#### Failure Points
- Missing or invalid access token (401)
- Expired access token (>15 min)
- Malformed Authorization header
- User doesn't exist (deleted)

#### Test Cases

**Case 1.4.1: Success - Get Profile**
```bash
curl -X GET http://localhost:5001/api/auth/profile \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

Expected: `200 OK`
```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439001",
    "email": "alice@example.com",
    "name": "Alice Johnson",
    "currency": "INR",
    "language": "en",
    "timezone": "Asia/Kolkata",
    "isVerified": false,
    "familyIds": ["507f1f77bcf86cd799439100"],
    "twoFactorEnabled": false,
    "createdAt": "2026-08-31T12:00:00Z"
  }
}
```

**Case 1.4.2: Missing Token**
```bash
curl -X GET http://localhost:5001/api/auth/profile \
  -H "Authorization: Bearer invalid_token"
```

Expected: `401 Unauthorized`
```json
{
  "success": false,
  "error": {
    "code": "INVALID_TOKEN",
    "message": "Invalid or expired token"
  }
}
```

---

## 2. CATEGORY TESTS

### 2.1 Load All Categories (T-CAT-001)

**Objective:** Fetch hierarchical category structure (3 levels)  
**Endpoint:** `GET /api/categories`  
**Authentication:** Not required

#### Failure Points
- Database connectivity issue
- N+1 query problem (slow response)
- Missing categories in seed data
- Inactive categories being returned
- Incorrect ordering
- Missing children/subcategories

#### Test Cases

**Case 2.1.1: Success - Get Hierarchical Structure**
```bash
curl -X GET http://localhost:5001/api/categories \
  -H "Content-Type: application/json"
```

Expected: `200 OK`
```json
{
  "success": true,
  "data": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "name": "Food & Dining",
      "level": 1,
      "order": 1,
      "isActive": true,
      "children": [
        {
          "_id": "507f1f77bcf86cd799439012",
          "name": "Groceries",
          "level": 2,
          "order": 1,
          "parentId": "507f1f77bcf86cd799439011",
          "isActive": true,
          "children": [
            {
              "_id": "507f1f77bcf86cd799439013",
              "name": "Vegetables",
              "level": 3,
              "parentId": "507f1f77bcf86cd799439012",
              "isActive": true
            }
          ]
        }
      ]
    }
  ]
}
```

**Validation Checklist:**
- [ ] Response contains 15+ main categories (level 1)
- [ ] Each main category has level 2 subcategories
- [ ] Level 2 categories have level 3 children
- [ ] Categories ordered by `order` field
- [ ] All categories have `isActive: true`
- [ ] Response time < 2 seconds

---

### 2.2 Get Flat Category List (T-CAT-002)

**Objective:** Fetch all categories in flat format for dropdowns  
**Endpoint:** `GET /api/categories/flat`

#### Test Cases

**Case 2.2.1: Success - Flat List**
```bash
curl -X GET http://localhost:5001/api/categories/flat \
  -H "Content-Type: application/json"
```

Expected: `200 OK`
```json
{
  "success": true,
  "data": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "name": "Food & Dining",
      "level": 1,
      "parentName": null,
      "isActive": true
    },
    {
      "_id": "507f1f77bcf86cd799439012",
      "name": "Groceries",
      "level": 2,
      "parentName": "Food & Dining",
      "isActive": true
    }
  ]
}
```

---

## 3. EXPENSE TESTS

### 3.1 Create Expense (T-EXP-001)

**Objective:** Create new expense with category and splits  
**Endpoint:** `POST /api/expenses/{familyId}`  
**Authentication:** Required  
**Authorization:** User must be family member

#### Failure Points
- Missing required fields (description, amount, date)
- Invalid amount (negative, non-numeric)
- Invalid date format or future date
- Category doesn't exist
- Family doesn't exist
- User not member of family
- Splits total > expense amount
- Missing authentication token

#### Sample Data
```json
{
  "description": "Weekly groceries",
  "amount": 2500,
  "currency": "INR",
  "categoryId": "507f1f77bcf86cd799439012",
  "date": "2026-08-31T10:30:00Z",
  "paymentMethod": "cash",
  "tags": ["shopping", "weekly"],
  "splits": [
    {
      "userId": "507f1f77bcf86cd799439001",
      "amount": 1250
    },
    {
      "userId": "507f1f77bcf86cd799439002",
      "amount": 1250
    }
  ]
}
```

#### Test Cases

**Case 3.1.1: Success - Create Expense**
```bash
curl -X POST http://localhost:5001/api/expenses/507f1f77bcf86cd799439100 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -d '{
    "description": "Weekly groceries",
    "amount": 2500,
    "currency": "INR",
    "categoryId": "507f1f77bcf86cd799439012",
    "date": "2026-08-31T10:30:00Z",
    "paymentMethod": "cash"
  }'
```

Expected: `201 Created`
```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439200",
    "familyId": "507f1f77bcf86cd799439100",
    "description": "Weekly groceries",
    "amount": 2500,
    "currency": "INR",
    "category": "Groceries",
    "categoryId": "507f1f77bcf86cd799439012",
    "paidBy": {
      "_id": "507f1f77bcf86cd799439001",
      "name": "Alice Johnson"
    },
    "date": "2026-08-31T10:30:00Z",
    "paymentMethod": "cash",
    "tags": [],
    "splits": [],
    "createdAt": "2026-08-31T12:00:00Z",
    "updatedAt": "2026-08-31T12:00:00Z"
  }
}
```

**Case 3.1.2: Invalid Amount**
```bash
curl -X POST http://localhost:5001/api/expenses/507f1f77bcf86cd799439100 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -d '{
    "description": "Test",
    "amount": -100,
    "date": "2026-08-31T10:30:00Z"
  }'
```

Expected: `400 Bad Request`
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Amount must be positive"
  }
}
```

**Case 3.1.3: Not Family Member**
```bash
curl -X POST http://localhost:5001/api/expenses/507f1f77bcf86cd799439999 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -d '{
    "description": "Test",
    "amount": 100,
    "date": "2026-08-31T10:30:00Z"
  }'
```

Expected: `403 Forbidden`
```json
{
  "success": false,
  "error": {
    "code": "FORBIDDEN",
    "message": "You are not a member of this family"
  }
}
```

---

### 3.2 List Expenses (T-EXP-002)

**Objective:** Get paginated expenses with optional filters  
**Endpoint:** `GET /api/expenses/{familyId}`  
**Query Parameters:**
- `page` (default: 1, min: 1)
- `limit` (default: 20, max: 100)
- `category` (filter by category name)
- `tag` (filter by tag)
- `startDate` (ISO format)
- `endDate` (ISO format)
- `minAmount` / `maxAmount` (numeric filters)

#### Test Cases

**Case 3.2.1: Success - Get All Expenses**
```bash
curl -X GET "http://localhost:5001/api/expenses/507f1f77bcf86cd799439100" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

Expected: `200 OK`
```json
{
  "success": true,
  "data": {
    "expenses": [...],
    "total": 15,
    "page": 1,
    "limit": 20,
    "pages": 1
  }
}
```

**Case 3.2.2: Filter by Date Range**
```bash
curl -X GET "http://localhost:5001/api/expenses/507f1f77bcf86cd799439100?startDate=2026-08-01&endDate=2026-08-31" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

Expected: `200 OK` with filtered expenses

**Case 3.2.3: Invalid Date Range (startDate > endDate)**
```bash
curl -X GET "http://localhost:5001/api/expenses/507f1f77bcf86cd799439100?startDate=2026-08-31&endDate=2026-08-01" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

Expected: `400 Bad Request`
```json
{
  "success": false,
  "error": {
    "code": "INVALID_DATE_RANGE",
    "message": "startDate must be before endDate"
  }
}
```

**Case 3.2.4: Pagination Out of Range (page > total pages)**
```bash
curl -X GET "http://localhost:5001/api/expenses/507f1f77bcf86cd799439100?page=999&limit=20" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

Expected: `200 OK` with empty expenses array

---

### 3.3 Get Single Expense (T-EXP-003)

**Objective:** Retrieve details of a specific expense  
**Endpoint:** `GET /api/expenses/{familyId}/{expenseId}`

#### Test Cases

**Case 3.3.1: Success**
```bash
curl -X GET http://localhost:5001/api/expenses/507f1f77bcf86cd799439100/507f1f77bcf86cd799439200 \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

Expected: `200 OK`

**Case 3.3.2: Expense Not Found**
```bash
curl -X GET http://localhost:5001/api/expenses/507f1f77bcf86cd799439100/nonexistent \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

Expected: `404 Not Found`
```json
{
  "success": false,
  "error": {
    "code": "EXPENSE_NOT_FOUND",
    "message": "Expense not found"
  }
}
```

---

### 3.4 Update Expense (T-EXP-004)

**Objective:** Modify an existing expense  
**Endpoint:** `PUT /api/expenses/{familyId}/{expenseId}`

#### Test Cases

**Case 3.4.1: Success - Update Amount**
```bash
curl -X PUT http://localhost:5001/api/expenses/507f1f77bcf86cd799439100/507f1f77bcf86cd799439200 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -d '{
    "amount": 3000
  }'
```

Expected: `200 OK` with updated expense

---

### 3.5 Delete Expense (T-EXP-005)

**Objective:** Permanently remove an expense  
**Endpoint:** `DELETE /api/expenses/{familyId}/{expenseId}`

#### Test Cases

**Case 3.5.1: Success - Delete**
```bash
curl -X DELETE http://localhost:5001/api/expenses/507f1f77bcf86cd799439100/507f1f77bcf86cd799439200 \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

Expected: `200 OK`
```json
{
  "success": true,
  "data": {
    "success": true
  }
}
```

**Verification:** Try to retrieve deleted expense, should get 404

---

## 4. FAMILY TESTS

### 4.1 Create Family (T-FAM-001)

**Objective:** Create new family group  
**Endpoint:** `POST /api/families`  
**Authentication:** Required

#### Failure Points
- Missing family name
- Empty or whitespace-only name
- Invalid currency code
- Invalid timezone
- User not authenticated

#### Sample Data
```json
{
  "name": "Johnson Family",
  "currency": "INR",
  "timezone": "Asia/Kolkata"
}
```

#### Test Cases

**Case 4.1.1: Success - Create Family**
```bash
curl -X POST http://localhost:5001/api/families \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -d '{
    "name": "Johnson Family",
    "currency": "INR",
    "timezone": "Asia/Kolkata"
  }'
```

Expected: `201 Created`
```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439100",
    "name": "Johnson Family",
    "ownerId": "507f1f77bcf86cd799439001",
    "currency": "INR",
    "timezone": "Asia/Kolkata",
    "members": [
      {
        "userId": {
          "_id": "507f1f77bcf86cd799439001",
          "name": "Alice Johnson"
        },
        "role": "owner",
        "joinedAt": "2026-08-31T12:00:00Z"
      }
    ],
    "createdAt": "2026-08-31T12:00:00Z"
  }
}
```

**Case 4.1.2: Empty Name**
```bash
curl -X POST http://localhost:5001/api/families \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -d '{
    "name": "   ",
    "currency": "INR"
  }'
```

Expected: `400 Bad Request`
```json
{
  "success": false,
  "error": {
    "code": "INVALID_INPUT",
    "message": "Family name is required"
  }
}
```

---

### 4.2 Get User Families (T-FAM-002)

**Objective:** Retrieve all families user is member of  
**Endpoint:** `GET /api/families`  
**Authentication:** Required

#### Test Cases

**Case 4.2.1: Success - Get All Families**
```bash
curl -X GET http://localhost:5001/api/families \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

Expected: `200 OK`
```json
{
  "success": true,
  "data": [
    {
      "_id": "507f1f77bcf86cd799439100",
      "name": "Johnson Family",
      "ownerId": "507f1f77bcf86cd799439001",
      "members": [...],
      "currency": "INR"
    }
  ]
}
```

---

### 4.3 Add Member (T-FAM-003)

**Objective:** Add user to family (owner-only)  
**Endpoint:** `POST /api/families/{familyId}/members`  
**Authorization:** Must be family owner

#### Failure Points
- User not family owner (403)
- Member already exists in family
- User to add doesn't exist
- Invalid role value
- Missing email and userId

#### Sample Data
```json
{
  "email": "bob@example.com",
  "role": "member"
}
```

#### Test Cases

**Case 4.3.1: Success - Add by Email**
```bash
curl -X POST http://localhost:5001/api/families/507f1f77bcf86cd799439100/members \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -d '{
    "email": "bob@example.com",
    "role": "member"
  }'
```

Expected: `201 Created`

**Case 4.3.2: Duplicate Member**
```bash
curl -X POST http://localhost:5001/api/families/507f1f77bcf86cd799439100/members \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -d '{
    "email": "bob@example.com",
    "role": "member"
  }'
```

Expected: `400 Bad Request`
```json
{
  "success": false,
  "error": {
    "code": "MEMBER_EXISTS",
    "message": "Member already in family"
  }
}
```

**Case 4.3.3: User Not Owner**
```bash
# Login as Bob (member, not owner) and try to add another member
curl -X POST http://localhost:5001/api/families/507f1f77bcf86cd799439100/members \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer bob_token_here" \
  -d '{
    "email": "charlie@example.com",
    "role": "member"
  }'
```

Expected: `403 Forbidden`
```json
{
  "success": false,
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Only family owner can add members"
  }
}
```

---

### 4.4 Remove Member (T-FAM-004)

**Objective:** Remove member from family (owner-only)  
**Endpoint:** `DELETE /api/families/{familyId}/members/{userId}`

#### Failure Points
- User not family owner (403)
- Attempting to remove owner (400)
- Member doesn't exist in family
- Database sync failure (user.familyIds not updated)

#### Test Cases

**Case 4.4.1: Success - Remove Member**
```bash
curl -X DELETE http://localhost:5001/api/families/507f1f77bcf86cd799439100/members/507f1f77bcf86cd799439002 \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

Expected: `200 OK`

**Case 4.4.2: Try to Remove Owner**
```bash
curl -X DELETE http://localhost:5001/api/families/507f1f77bcf86cd799439100/members/507f1f77bcf86cd799439001 \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

Expected: `400 Bad Request`
```json
{
  "success": false,
  "error": {
    "code": "INVALID_OPERATION",
    "message": "Cannot remove family owner"
  }
}
```

---

### 4.5 Update Member Role (T-FAM-005)

**Objective:** Change member's role (owner-only)  
**Endpoint:** `PUT /api/families/{familyId}/members/{userId}/role`  
**Valid Roles:** owner, member, viewer

#### Sample Data
```json
{
  "role": "viewer"
}
```

#### Test Cases

**Case 4.5.1: Success - Change Role**
```bash
curl -X PUT http://localhost:5001/api/families/507f1f77bcf86cd799439100/members/507f1f77bcf86cd799439002/role \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -d '{
    "role": "viewer"
  }'
```

Expected: `200 OK`

**Case 4.5.2: Invalid Role**
```bash
curl -X PUT http://localhost:5001/api/families/507f1f77bcf86cd799439100/members/507f1f77bcf86cd799439002/role \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -d '{
    "role": "admin"
  }'
```

Expected: `400 Bad Request`
```json
{
  "success": false,
  "error": {
    "code": "INVALID_ROLE",
    "message": "Invalid role"
  }
}
```

---

### 4.6 View Settlements (T-FAM-006)

**Objective:** Calculate who owes whom based on expenses  
**Endpoint:** `GET /api/families/{familyId}/settlements`

#### Failure Points
- User not member of family (403)
- Family doesn't exist (404)
- Incorrect settlement calculation
- Missing users in balance calculation

#### Test Cases

**Case 4.6.1: Success - Get Settlements**
```bash
curl -X GET http://localhost:5001/api/families/507f1f77bcf86cd799439100/settlements \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

Expected: `200 OK`
```json
{
  "success": true,
  "data": {
    "507f1f77bcf86cd799439002": {
      "507f1f77bcf86cd799439001": 1250
    },
    "507f1f77bcf86cd799439003": {
      "507f1f77bcf86cd799439001": 2500
    }
  }
}
```

**Interpretation:** User 2 owes User 1 = 1250. User 3 owes User 1 = 2500.

---

## 5. ANALYTICS TESTS

### 5.1 Dashboard Summary (T-ANA-001)

**Objective:** Get current month stats  
**Endpoint:** `GET /api/analytics/{familyId}/summary`

#### Failure Points
- User not member of family (403)
- Timezone not considered in month calculation
- Average daily calculation wrong (dividing by expense count instead of days)
- Last month comparison edge cases (January vs December)
- Division by zero in percentages

#### Test Cases

**Case 5.1.1: Success - Get Summary**
```bash
curl -X GET http://localhost:5001/api/analytics/507f1f77bcf86cd799439100/summary \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

Expected: `200 OK`
```json
{
  "success": true,
  "data": {
    "totalSpent": 12500,
    "averageDaily": 403.22,
    "comparison": "15.50",
    "transactionCount": 5,
    "categoryBreakdown": [
      {
        "category": "Groceries",
        "total": 5000,
        "count": 2,
        "percentage": "40.00"
      }
    ]
  }
}
```

**Validation Checklist:**
- [ ] `totalSpent` is sum of all August expenses
- [ ] `averageDaily` = totalSpent / 31 (days in August)
- [ ] `comparison` is % change from July
- [ ] `categoryBreakdown` percentages sum to ~100%
- [ ] No division by zero errors

---

### 5.2 Monthly Trends (T-ANA-002)

**Objective:** Get spending for last N months  
**Endpoint:** `GET /api/analytics/{familyId}/trends`  
**Query Parameters:**
- `months` (default: 12, range: 1-120)

#### Failure Points
- Invalid months parameter (< 1 or > 120)
- Months not in chronological order
- Date range calculation wrong
- Empty months skipped (should show 0)

#### Test Cases

**Case 5.2.1: Success - Get 12 Month Trends**
```bash
curl -X GET "http://localhost:5001/api/analytics/507f1f77bcf86cd799439100/trends?months=12" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

Expected: `200 OK` with 12 months of data in order from oldest to newest

**Case 5.2.2: Invalid Months (> 120)**
```bash
curl -X GET "http://localhost:5001/api/analytics/507f1f77bcf86cd799439100/trends?months=150" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

Expected: `400 Bad Request`
```json
{
  "success": false,
  "error": {
    "code": "INVALID_MONTHS",
    "message": "months must be between 1 and 120"
  }
}
```

---

### 5.3 Budget Status (T-ANA-003)

**Objective:** Get budget vs actual spending  
**Endpoint:** `GET /api/analytics/{familyId}/budgets/status`

#### Failure Points
- No budgets defined (should return empty array)
- Incorrect spent calculation
- Status thresholds wrong (80% for warning)
- Division by zero when limit = 0

#### Test Cases

**Case 5.3.1: Success - Get Budget Status**
```bash
curl -X GET http://localhost:5001/api/analytics/507f1f77bcf86cd799439100/budgets/status \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

Expected: `200 OK`
```json
{
  "success": true,
  "data": [
    {
      "category": "Groceries",
      "limit": 5000,
      "spent": 4200,
      "remaining": 800,
      "percentage": 84.0,
      "status": "warning"
    }
  ]
}
```

**Status Logic:**
- `spent > limit` → "exceeded" (red)
- `spent / limit > 0.8` → "warning" (yellow)
- `spent / limit <= 0.8` → "ok" (green)

---

### 5.4 Spending Comparison (T-ANA-004)

**Objective:** Compare member spending over date range  
**Endpoint:** `GET /api/analytics/{familyId}/spending/comparison`  
**Query Parameters:**
- `startDate` (ISO format, default: 30 days ago)
- `endDate` (ISO format, default: today)

#### Failure Points
- Invalid date format
- startDate > endDate (400 error expected)
- User info not populated (showing IDs)
- Results not sorted by total (descending)

#### Test Cases

**Case 5.4.1: Success - Get Comparison**
```bash
curl -X GET "http://localhost:5001/api/analytics/507f1f77bcf86cd799439100/spending/comparison?startDate=2026-08-01&endDate=2026-08-31" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

Expected: `200 OK`
```json
{
  "success": true,
  "data": [
    {
      "name": "Alice Johnson",
      "total": 7500
    },
    {
      "name": "Bob Smith",
      "total": 5000
    }
  ]
}
```

**Case 5.4.2: Invalid Date Range**
```bash
curl -X GET "http://localhost:5001/api/analytics/507f1f77bcf86cd799439100/spending/comparison?startDate=2026-08-31&endDate=2026-08-01" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

Expected: `400 Bad Request`
```json
{
  "success": false,
  "error": {
    "code": "INVALID_DATE_RANGE",
    "message": "startDate must be before endDate"
  }
}
```

---

## Test Execution Order

Follow this sequence to test all features end-to-end:

1. **Setup Phase**
   - T-AUTH-001: Create user alice@example.com
   - T-AUTH-001: Create user bob@example.com
   - T-AUTH-002: Login alice (get tokens)
   - T-AUTH-004: Get alice's profile

2. **Category Loading**
   - T-CAT-001: Load hierarchical categories
   - T-CAT-002: Load flat category list

3. **Family Setup**
   - T-FAM-001: Create "Test Family" (alice as owner)
   - T-FAM-002: Get alice's families
   - T-FAM-003: Add bob as member
   - Save family ID for expense tests

4. **Expense Operations**
   - T-EXP-001: Create 5+ expenses (various categories, dates)
   - T-EXP-002: List all expenses
   - T-EXP-005: Filter by date range (Aug 1-31)
   - T-EXP-006: Filter by category (Groceries)
   - T-EXP-003: Get single expense
   - T-EXP-004: Update expense amount
   - T-EXP-005: Delete expense
   - T-EXP-002: Verify deletion (expense count decreased)

5. **Family Member Management**
   - T-FAM-005: Update bob's role to viewer
   - T-FAM-006: Get settlements
   - T-FAM-004: Remove bob from family
   - T-FAM-003: Add bob back (verify member still exists)

6. **Analytics**
   - T-ANA-001: Get dashboard summary
   - T-ANA-002: Get 12-month trends
   - T-ANA-003: Get budget status
   - T-ANA-004: Get spending comparison

7. **Edge Cases & Error Handling**
   - Test all 403, 404, 400 scenarios
   - Test rate limiting (rapid signup/login attempts)
   - Test empty result sets
   - Test pagination limits

---

## Sample Test Data

### User 1: Alice Johnson
```json
{
  "email": "alice@example.com",
  "password": "AlicePass123",
  "name": "Alice Johnson"
}
```

### User 2: Bob Smith
```json
{
  "email": "bob@example.com",
  "password": "BobPass123",
  "name": "Bob Smith"
}
```

### Sample Expenses
```json
[
  {
    "description": "Weekly groceries at metro",
    "amount": 2500,
    "category": "Groceries",
    "date": "2026-08-15T14:30:00Z"
  },
  {
    "description": "Uber to office",
    "amount": 350,
    "category": "Travel",
    "date": "2026-08-16T08:00:00Z"
  },
  {
    "description": "Movie tickets",
    "amount": 600,
    "category": "Entertainment",
    "date": "2026-08-17T19:00:00Z"
  }
]
```

---

## Common Issues & Solutions

### Issue 1: 401 Unauthorized on Protected Routes
**Solution:** Ensure `Authorization: Bearer {token}` header is included and token is not expired

### Issue 2: 403 Forbidden for Family Operations
**Solution:** Verify user is family member (check familyIds in user profile)

### Issue 3: 429 Rate Limit Exceeded
**Solution:** Wait 15 minutes or use different IP address (if testing locally, this shouldn't occur)

### Issue 4: Category Not Found
**Solution:** Ensure category was created/seeded and seed data is loaded

### Issue 5: Expense Not Showing in Settlements
**Solution:** Verify splits array is populated when creating expense

---

## Database Seed Data

Before running tests, ensure MongoDB has seed data:

```bash
# Run seed script
node backend/src/seeds/seedCategories.js
```

This should create:
- 15+ main categories (level 1)
- 40+ level 2 subcategories
- 100+ level 3 sub-subcategories

---

## Performance Benchmarks

| Operation | Expected Time | Notes |
|-----------|---------------|-------|
| Load categories | < 500ms | Should use .lean() |
| List 20 expenses | < 200ms | With pagination |
| Get summary | < 300ms | Current month |
| Get 12-month trends | < 500ms | Multiple DB queries |
| Add member | < 100ms | 2 DB operations |
| Get settlements | < 200ms | Single aggregation |

---

## Monitoring & Logging

Enable request logging in .env:
```
LOG_LEVEL=debug
REQUEST_LOG=true
```

Check logs for:
- Slow queries (> 1s)
- Unhandled errors
- N+1 query problems
- Memory leaks

---

## Next Steps

After completing test plan:
1. Document any failures or edge cases not covered
2. Update tests based on findings
3. Automate tests using Jest/Supertest
4. Set up CI/CD pipeline
5. Monitor production metrics

