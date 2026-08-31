# HIGH PRIORITY FIXES - MANUAL CURL TESTS

**API Base URL:** `http://localhost:5001`

This guide provides curl commands to manually test all HIGH priority fixes applied to the expense tracker.

---

## SETUP: Create Test Users and Family

### 1. Create User: Alice (owner)

```bash
curl -X POST http://localhost:5001/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "alice-fix@example.com",
    "password": "Password123",
    "name": "Alice Johnson"
  }' | jq '.'

# Save accessToken and _id from response
ALICE_TOKEN="<paste accessToken>"
ALICE_ID="<paste _id>"
```

**Expected Response (201 Created):**
```json
{
  "success": true,
  "data": {
    "_id": "...",
    "email": "alice-fix@example.com",
    "name": "Alice Johnson",
    "accessToken": "...",
    "refreshToken": "..."
  }
}
```

---

### 2. Create User: Bob (member)

```bash
curl -X POST http://localhost:5001/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "bob-fix@example.com",
    "password": "Password123",
    "name": "Bob Smith"
  }' | jq '.'

# Save accessToken and _id
BOB_TOKEN="<paste accessToken>"
BOB_ID="<paste _id>"
```

---

### 3. Create User: Charlie (for role testing)

```bash
curl -X POST http://localhost:5001/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "charlie-fix@example.com",
    "password": "Password123",
    "name": "Charlie Brown"
  }' | jq '.'

CHARLIE_ID="<paste _id>"
```

---

### 4. Create Family

```bash
curl -X POST http://localhost:5001/api/families \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ALICE_TOKEN" \
  -d '{
    "name": "Fix Test Family",
    "currency": "INR",
    "timezone": "Asia/Kolkata"
  }' | jq '.'

# Save family ID
FAMILY_ID="<paste _id>"
```

**Expected Response (201 Created):**
```json
{
  "success": true,
  "data": {
    "_id": "family-id-here",
    "name": "Fix Test Family",
    "members": [
      {
        "userId": {
          "_id": "alice-id",
          "name": "Alice Johnson"
        },
        "role": "owner"
      }
    ]
  }
}
```

---

### 5. Add Bob as Family Member

```bash
curl -X POST http://localhost:5001/api/families/$FAMILY_ID/members \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ALICE_TOKEN" \
  -d '{
    "userId": "'$BOB_ID'",
    "role": "member"
  }' | jq '.'
```

---

### 6. Add Charlie as Family Member

```bash
curl -X POST http://localhost:5001/api/families/$FAMILY_ID/members \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ALICE_TOKEN" \
  -d '{
    "userId": "'$CHARLIE_ID'",
    "role": "member"
  }' | jq '.'
```

---

---

## FIX #1: EXPENSE AUTHORIZATION - Only Creator Can Modify

### Test 1.1: Alice Creates Expense

```bash
curl -X POST http://localhost:5001/api/expenses/$FAMILY_ID \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ALICE_TOKEN" \
  -d '{
    "description": "Alice Groceries",
    "amount": 5000,
    "date": "'$(date -u +%Y-%m-%dT%H:%M:%SZ)'",
    "category": "Groceries"
  }' | jq '.'

# Save expense ID
ALICE_EXPENSE_ID="<paste _id>"
```

**Expected Response (201 Created):**
```json
{
  "success": true,
  "data": {
    "_id": "expense-id",
    "familyId": "family-id",
    "description": "Alice Groceries",
    "amount": 5000,
    "paidBy": {
      "_id": "alice-id",
      "name": "Alice Johnson"
    }
  }
}
```

---

### Test 1.2: Bob CANNOT Update Alice's Expense ❌

```bash
curl -X PUT http://localhost:5001/api/expenses/$FAMILY_ID/$ALICE_EXPENSE_ID \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $BOB_TOKEN" \
  -d '{
    "description": "Updated by Bob (should fail)",
    "amount": 10000
  }' | jq '.'
```

**Expected Response (403 Forbidden):**
```json
{
  "success": false,
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Only the expense creator can update this expense"
  }
}
```

---

### Test 1.3: Alice CAN Update Her Own Expense ✅

```bash
curl -X PUT http://localhost:5001/api/expenses/$FAMILY_ID/$ALICE_EXPENSE_ID \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ALICE_TOKEN" \
  -d '{
    "description": "Updated Groceries",
    "amount": 6000
  }' | jq '.'
```

**Expected Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "_id": "expense-id",
    "description": "Updated Groceries",
    "amount": 6000
  }
}
```

---

### Test 1.4: Bob CANNOT Delete Alice's Expense ❌

```bash
curl -X DELETE http://localhost:5001/api/expenses/$FAMILY_ID/$ALICE_EXPENSE_ID \
  -H "Authorization: Bearer $BOB_TOKEN" | jq '.'
```

**Expected Response (403 Forbidden):**
```json
{
  "success": false,
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Only the expense creator can delete this expense"
  }
}
```

---

### Test 1.5: Alice CAN Delete Her Own Expense ✅

```bash
curl -X DELETE http://localhost:5001/api/expenses/$FAMILY_ID/$ALICE_EXPENSE_ID \
  -H "Authorization: Bearer $ALICE_TOKEN" | jq '.'
```

**Expected Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "success": true
  }
}
```

---

### Test 1.6: Verify Expense is Deleted

```bash
curl -X GET http://localhost:5001/api/expenses/$FAMILY_ID/$ALICE_EXPENSE_ID \
  -H "Authorization: Bearer $ALICE_TOKEN" | jq '.'
```

**Expected Response (404 Not Found):**
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

---

## FIX #2: MEMBER ROLE ESCALATION PREVENTION - Cannot Promote to Owner

### Test 2.1: Bob (member) CANNOT Promote Himself to Owner ❌

```bash
curl -X PUT http://localhost:5001/api/families/$FAMILY_ID/members/$BOB_ID/role \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $BOB_TOKEN" \
  -d '{
    "role": "owner"
  }' | jq '.'
```

**Expected Response (403 Forbidden):**
```json
{
  "success": false,
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Only family owner can change member roles"
  }
}
```

---

### Test 2.2: Alice (owner) CANNOT Promote Bob to Owner ❌

```bash
curl -X PUT http://localhost:5001/api/families/$FAMILY_ID/members/$BOB_ID/role \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ALICE_TOKEN" \
  -d '{
    "role": "owner"
  }' | jq '.'
```

**Expected Response (403 Forbidden):**
```json
{
  "success": false,
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Only one family owner is allowed. Cannot promote another member to owner."
  }
}
```

---

### Test 2.3: Alice CAN Promote Bob to Viewer ✅

```bash
curl -X PUT http://localhost:5001/api/families/$FAMILY_ID/members/$BOB_ID/role \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ALICE_TOKEN" \
  -d '{
    "role": "viewer"
  }' | jq '.'
```

**Expected Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "_id": "family-id",
    "members": [
      {
        "userId": {"_id": "bob-id", "name": "Bob Smith"},
        "role": "viewer"
      }
    ]
  }
}
```

---

### Test 2.4: Alice CAN Change Bob Back to Member ✅

```bash
curl -X PUT http://localhost:5001/api/families/$FAMILY_ID/members/$BOB_ID/role \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ALICE_TOKEN" \
  -d '{
    "role": "member"
  }' | jq '.'
```

---

### Test 2.5: Invalid Role Should Fail ❌

```bash
curl -X PUT http://localhost:5001/api/families/$FAMILY_ID/members/$BOB_ID/role \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ALICE_TOKEN" \
  -d '{
    "role": "admin"
  }' | jq '.'
```

**Expected Response (400 Bad Request):**
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid role"
  }
}
```

---

---

## FIX #3: RATE LIMITING - Prevent Brute Force Attacks

### Test 3.1: Normal Signup (Should Succeed) ✅

```bash
curl -X POST http://localhost:5001/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "ratelimit-test-1@example.com",
    "password": "Password123",
    "name": "Test User 1"
  }' | jq '.data.accessToken' | head -20
```

**Response includes rate limit headers:**
```
X-RateLimit-Limit: 10
X-RateLimit-Remaining: 9
X-RateLimit-Reset: 2024-08-31T12:05:00Z
```

---

### Test 3.2: Rapid Signup Attempts (Hit Rate Limit) ❌

```bash
# Make 15 rapid signup attempts (limit is 10 per minute)
for i in {1..15}; do
  echo "Attempt $i:"
  curl -X POST http://localhost:5001/api/auth/signup \
    -H "Content-Type: application/json" \
    -d '{
      "email": "ratelimit-test-'$i'@example.com",
      "password": "Password123",
      "name": "Test User '$i'"
    }' 2>/dev/null | jq '{status: .error.code, message: .error.message}' | head -5
  sleep 0.5
done
```

**Eventually returns (429 Too Many Requests):**
```json
{
  "success": false,
  "error": {
    "code": "TOO_MANY_REQUESTS",
    "message": "Too many requests. Please try again in XX seconds."
  }
}
```

**Response includes retry headers:**
```
HTTP/1.1 429 Too Many Requests
Retry-After: 45
X-RateLimit-Limit: 10
X-RateLimit-Remaining: 0
X-RateLimit-Reset: 2024-08-31T12:06:00Z
```

---

### Test 3.3: Check Rate Limit Headers

```bash
curl -i -X POST http://localhost:5001/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "check-headers@example.com",
    "password": "Password123",
    "name": "Check Headers"
  }' 2>/dev/null | grep -i "x-ratelimit\|retry-after"
```

**Output:**
```
X-RateLimit-Limit: 10
X-RateLimit-Remaining: 8
X-RateLimit-Reset: 2024-08-31T12:05:30Z
```

---

---

## FIX #4: IDEMPOTENCY - Prevent Duplicate Expenses

### Test 4.1: Create Expense With Idempotency Key

```bash
# Generate unique key for this expense
IDEMPOTENCY_KEY="exp-$(date +%s)-$(openssl rand -hex 4)"
echo "Using key: $IDEMPOTENCY_KEY"

curl -X POST http://localhost:5001/api/expenses/$FAMILY_ID \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ALICE_TOKEN" \
  -H "Idempotency-Key: $IDEMPOTENCY_KEY" \
  -d '{
    "description": "Idempotent Expense",
    "amount": 5000,
    "date": "'$(date -u +%Y-%m-%dT%H:%M:%SZ)'",
    "category": "Groceries"
  }' | jq '.'

# Save expense ID
EXPENSE_ID="<paste _id>"
```

---

### Test 4.2: Send Duplicate Request With Same Key

```bash
# Second request with SAME key (should return cached response)
curl -X POST http://localhost:5001/api/expenses/$FAMILY_ID \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ALICE_TOKEN" \
  -H "Idempotency-Key: $IDEMPOTENCY_KEY" \
  -d '{
    "description": "Idempotent Expense",
    "amount": 5000,
    "date": "'$(date -u +%Y-%m-%dT%H:%M:%SZ)'",
    "category": "Groceries"
  }' | jq '.'
```

**Expected:** Same expense ID as first request (cached response) ✅

---

### Test 4.3: Send Third Duplicate

```bash
# Third request with SAME key
curl -X POST http://localhost:5001/api/expenses/$FAMILY_ID \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ALICE_TOKEN" \
  -H "Idempotency-Key: $IDEMPOTENCY_KEY" \
  -d '{
    "description": "Idempotent Expense",
    "amount": 5000,
    "date": "'$(date -u +%Y-%m-%dT%H:%M:%SZ)'",
    "category": "Groceries"
  }' | jq '.data._id'
```

**Output:** Same ID (still only 1 expense created) ✅

---

### Test 4.4: Different Key Creates Different Expense

```bash
# Generate DIFFERENT key
NEW_KEY="exp-$(date +%s)-$(openssl rand -hex 4)"

curl -X POST http://localhost:5001/api/expenses/$FAMILY_ID \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ALICE_TOKEN" \
  -H "Idempotency-Key: $NEW_KEY" \
  -d '{
    "description": "Different Expense",
    "amount": 3000,
    "date": "'$(date -u +%Y-%m-%dT%H:%M:%SZ)'",
    "category": "Transport"
  }' | jq '.data._id'
```

**Output:** Different expense ID ✅

---

### Test 4.5: Verify Only 2 Expenses Created

```bash
curl -X GET http://localhost:5001/api/expenses/$FAMILY_ID \
  -H "Authorization: Bearer $ALICE_TOKEN" | jq '.data | {total: .total, count: (.expenses | length)}'
```

**Expected:**
```json
{
  "total": 2,
  "count": 2
}
```

---

---

## FIX #5: PAGINATION PROTECTION - Limit Max Items Per Page

### Test 5.1: Request Excessive Limit (Should Cap at 100)

```bash
curl -X GET "http://localhost:5001/api/expenses/$FAMILY_ID?limit=500" \
  -H "Authorization: Bearer $ALICE_TOKEN" | jq '.data | {limit: .limit, count: (.expenses | length)}'
```

**Expected:**
```json
{
  "limit": 100,
  "count": 0  // or number up to 100
}
```

---

### Test 5.2: Default Limit (Should be 20)

```bash
curl -X GET "http://localhost:5001/api/expenses/$FAMILY_ID" \
  -H "Authorization: Bearer $ALICE_TOKEN" | jq '.data | {limit: .limit, page: .page}'
```

**Expected:**
```json
{
  "limit": 20,
  "page": 1
}
```

---

### Test 5.3: Zero Limit (Should Enforce Minimum of 1)

```bash
curl -X GET "http://localhost:5001/api/expenses/$FAMILY_ID?limit=0" \
  -H "Authorization: Bearer $ALICE_TOKEN" | jq '.data.limit'
```

**Expected:** `1`

---

### Test 5.4: Negative Page (Should Enforce Minimum of 1)

```bash
curl -X GET "http://localhost:5001/api/expenses/$FAMILY_ID?page=-5" \
  -H "Authorization: Bearer $ALICE_TOKEN" | jq '.data.page'
```

**Expected:** `1`

---

### Test 5.5: Out-of-Range Page (Should Return Empty)

```bash
curl -X GET "http://localhost:5001/api/expenses/$FAMILY_ID?page=999&limit=20" \
  -H "Authorization: Bearer $ALICE_TOKEN" | jq '.data | {page: .page, total: .total, count: (.expenses | length)}'
```

**Expected:**
```json
{
  "page": 999,
  "total": 2,
  "count": 0
}
```

---

---

## FIX #6: CSV EXPORT OPTIMIZATION - Handle Large Datasets

### Test 6.1: Export CSV

```bash
curl -X GET http://localhost:5001/api/export/$FAMILY_ID/csv \
  -H "Authorization: Bearer $ALICE_TOKEN" | head -5
```

**Expected CSV output:**
```
Date,Description,Category,Amount (₹),Paid By,Tags,Notes
8/31/2024,"Different Expense",Transport,3000,Alice Johnson,"","Personal"
```

---

### Test 6.2: Check CSV Headers

```bash
curl -X GET http://localhost:5001/api/export/$FAMILY_ID/csv \
  -H "Authorization: Bearer $ALICE_TOKEN" \
  -H "Content-Type: application/json" \
  -s | head -1
```

**Expected:** `Date,Description,Category,Amount (₹),Paid By,Tags,Notes`

---

### Test 6.3: Export JSON

```bash
curl -X GET http://localhost:5001/api/export/$FAMILY_ID/json \
  -H "Authorization: Bearer $ALICE_TOKEN" | jq '{totalExpenses: .totalExpenses, totalAmount: .totalAmount, count: (.expenses | length)}'
```

**Expected:**
```json
{
  "totalExpenses": 2,
  "totalAmount": 8000,
  "count": 2
}
```

---

### Test 6.4: CSV With Date Range Filter

```bash
curl -X GET "http://localhost:5001/api/export/$FAMILY_ID/csv?startDate=2024-08-30&endDate=2024-08-31" \
  -H "Authorization: Bearer $ALICE_TOKEN" | wc -l
```

**Expected:** Fewer lines (filtered by date)

---

### Test 6.5: Verify CSV Content-Type

```bash
curl -i -X GET http://localhost:5001/api/export/$FAMILY_ID/csv \
  -H "Authorization: Bearer $ALICE_TOKEN" 2>/dev/null | grep -i content-type | head -1
```

**Expected:** `content-type: text/csv; charset=utf-8`

---

---

## SUMMARY OF EXPECTED RESULTS

| Test | Expected Behavior | Status |
|------|-------------------|--------|
| Expense Authorization | Non-creator cannot modify | ✅ Must Fail (403) |
| Role Escalation | Member cannot become owner | ✅ Must Fail (403) |
| Rate Limiting | Rapid requests blocked at 10/min | ✅ Must Fail (429) |
| Idempotency | Duplicate key returns same expense | ✅ Must Succeed |
| Pagination | Max 100 items, min 1 item | ✅ Must Enforce |
| CSV Export | Handles all expenses efficiently | ✅ Must Succeed |

---

## RUNNING ALL TESTS

```bash
# Save this as run_all_tests.sh
#!/bin/bash

echo "1. Testing Expense Authorization..."
# Run Test 1.1 - 1.6

echo "2. Testing Role Escalation Prevention..."
# Run Test 2.1 - 2.5

echo "3. Testing Rate Limiting..."
# Run Test 3.1 - 3.3

echo "4. Testing Idempotency..."
# Run Test 4.1 - 4.5

echo "5. Testing Pagination Protection..."
# Run Test 5.1 - 5.5

echo "6. Testing CSV Export..."
# Run Test 6.1 - 6.5

echo "All tests completed!"
```

---

## TROUBLESHOOTING

**Issue:** Token expired (401)
**Solution:** Get new token: `curl -X POST ... /api/auth/login`

**Issue:** Family not found (404)
**Solution:** Verify FAMILY_ID: `curl ... /api/families -H "Authorization: Bearer $TOKEN"`

**Issue:** Rate limit errors
**Solution:** Wait 60 seconds or use different IP address

**Issue:** Expense not found
**Solution:** Verify ALICE_EXPENSE_ID is correct

---

## NOTES

- All URLs assume backend running on `http://localhost:5001`
- Replace variable placeholders with actual values
- Use `jq` for pretty-printing JSON responses
- Use `| head -5` to limit output lines
- Save tokens and IDs for reuse in subsequent tests

