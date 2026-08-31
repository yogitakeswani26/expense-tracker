# Expense Tracker - Quick Reference: Curl Commands

**Base URL:** `http://localhost:5001`

Copy-paste ready curl commands for all API endpoints.

---

## Authentication Endpoints

### 1. Signup
```bash
curl -X POST http://localhost:5001/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "alice@example.com",
    "password": "SecurePass123",
    "name": "Alice Johnson"
  }'
```

### 2. Login
```bash
curl -X POST http://localhost:5001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "alice@example.com",
    "password": "SecurePass123"
  }'
```

### 3. Refresh Token
```bash
curl -X POST http://localhost:5001/api/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{
    "refreshToken": "PASTE_REFRESH_TOKEN_HERE"
  }'
```

### 4. Get Profile
```bash
curl -X GET http://localhost:5001/api/auth/profile \
  -H "Authorization: Bearer ACCESS_TOKEN_HERE"
```

### 5. Update Profile
```bash
curl -X PUT http://localhost:5001/api/auth/profile \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ACCESS_TOKEN_HERE" \
  -d '{
    "name": "Alice Smith",
    "currency": "USD",
    "timezone": "America/New_York"
  }'
```

---

## Category Endpoints

### 1. Get All Categories (Hierarchical)
```bash
curl -X GET http://localhost:5001/api/categories
```

### 2. Get Flat Category List
```bash
curl -X GET http://localhost:5001/api/categories/flat
```

### 3. Get Single Category
```bash
curl -X GET http://localhost:5001/api/categories/CATEGORY_ID_HERE
```

---

## Family Endpoints

### 1. Create Family
```bash
curl -X POST http://localhost:5001/api/families \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ACCESS_TOKEN_HERE" \
  -d '{
    "name": "Johnson Family",
    "currency": "INR",
    "timezone": "Asia/Kolkata"
  }'
```

### 2. Get My Families
```bash
curl -X GET http://localhost:5001/api/families \
  -H "Authorization: Bearer ACCESS_TOKEN_HERE"
```

### 3. Get Single Family
```bash
curl -X GET http://localhost:5001/api/families/FAMILY_ID_HERE \
  -H "Authorization: Bearer ACCESS_TOKEN_HERE"
```

### 4. Update Family
```bash
curl -X PUT http://localhost:5001/api/families/FAMILY_ID_HERE \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ACCESS_TOKEN_HERE" \
  -d '{
    "name": "Johnson Family Updated",
    "currency": "USD"
  }'
```

### 5. Add Member (by Email)
```bash
curl -X POST http://localhost:5001/api/families/FAMILY_ID_HERE/members \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ACCESS_TOKEN_HERE" \
  -d '{
    "email": "bob@example.com",
    "role": "member"
  }'
```

### 6. Add Member (by User ID)
```bash
curl -X POST http://localhost:5001/api/families/FAMILY_ID_HERE/members \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ACCESS_TOKEN_HERE" \
  -d '{
    "userId": "USER_ID_HERE",
    "role": "member"
  }'
```

### 7. Remove Member
```bash
curl -X DELETE http://localhost:5001/api/families/FAMILY_ID_HERE/members/USER_ID_HERE \
  -H "Authorization: Bearer ACCESS_TOKEN_HERE"
```

### 8. Update Member Role
```bash
curl -X PUT http://localhost:5001/api/families/FAMILY_ID_HERE/members/USER_ID_HERE/role \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ACCESS_TOKEN_HERE" \
  -d '{
    "role": "viewer"
  }'
```

### 9. Get Settlements (Who Owes Who)
```bash
curl -X GET http://localhost:5001/api/families/FAMILY_ID_HERE/settlements \
  -H "Authorization: Bearer ACCESS_TOKEN_HERE"
```

---

## Expense Endpoints

### 1. Create Expense
```bash
curl -X POST http://localhost:5001/api/expenses/FAMILY_ID_HERE \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ACCESS_TOKEN_HERE" \
  -d '{
    "description": "Weekly groceries",
    "amount": 2500,
    "currency": "INR",
    "categoryId": "CATEGORY_ID_HERE",
    "date": "2026-08-31T10:30:00Z",
    "paymentMethod": "cash",
    "tags": ["shopping", "weekly"]
  }'
```

### 2. List Expenses (All)
```bash
curl -X GET http://localhost:5001/api/expenses/FAMILY_ID_HERE \
  -H "Authorization: Bearer ACCESS_TOKEN_HERE"
```

### 3. List Expenses (Paginated)
```bash
curl -X GET "http://localhost:5001/api/expenses/FAMILY_ID_HERE?page=1&limit=20" \
  -H "Authorization: Bearer ACCESS_TOKEN_HERE"
```

### 4. Filter Expenses by Date Range
```bash
curl -X GET "http://localhost:5001/api/expenses/FAMILY_ID_HERE?startDate=2026-08-01&endDate=2026-08-31" \
  -H "Authorization: Bearer ACCESS_TOKEN_HERE"
```

### 5. Filter Expenses by Category
```bash
curl -X GET "http://localhost:5001/api/expenses/FAMILY_ID_HERE?category=Groceries" \
  -H "Authorization: Bearer ACCESS_TOKEN_HERE"
```

### 6. Filter Expenses by Amount Range
```bash
curl -X GET "http://localhost:5001/api/expenses/FAMILY_ID_HERE?minAmount=100&maxAmount=5000" \
  -H "Authorization: Bearer ACCESS_TOKEN_HERE"
```

### 7. Filter Expenses by Tag
```bash
curl -X GET "http://localhost:5001/api/expenses/FAMILY_ID_HERE?tag=shopping" \
  -H "Authorization: Bearer ACCESS_TOKEN_HERE"
```

### 8. Get Single Expense
```bash
curl -X GET http://localhost:5001/api/expenses/FAMILY_ID_HERE/EXPENSE_ID_HERE \
  -H "Authorization: Bearer ACCESS_TOKEN_HERE"
```

### 9. Update Expense
```bash
curl -X PUT http://localhost:5001/api/expenses/FAMILY_ID_HERE/EXPENSE_ID_HERE \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ACCESS_TOKEN_HERE" \
  -d '{
    "description": "Weekly groceries - updated",
    "amount": 2800
  }'
```

### 10. Delete Expense
```bash
curl -X DELETE http://localhost:5001/api/expenses/FAMILY_ID_HERE/EXPENSE_ID_HERE \
  -H "Authorization: Bearer ACCESS_TOKEN_HERE"
```

### 11. Get Expense Categories
```bash
curl -X GET http://localhost:5001/api/expenses/FAMILY_ID_HERE/categories \
  -H "Authorization: Bearer ACCESS_TOKEN_HERE"
```

---

## Analytics Endpoints

### 1. Dashboard Summary (Current Month)
```bash
curl -X GET http://localhost:5001/api/analytics/FAMILY_ID_HERE/summary \
  -H "Authorization: Bearer ACCESS_TOKEN_HERE"
```

### 2. Monthly Trends (12 Months)
```bash
curl -X GET "http://localhost:5001/api/analytics/FAMILY_ID_HERE/trends?months=12" \
  -H "Authorization: Bearer ACCESS_TOKEN_HERE"
```

### 3. Monthly Trends (6 Months)
```bash
curl -X GET "http://localhost:5001/api/analytics/FAMILY_ID_HERE/trends?months=6" \
  -H "Authorization: Bearer ACCESS_TOKEN_HERE"
```

### 4. Budget Status
```bash
curl -X GET http://localhost:5001/api/analytics/FAMILY_ID_HERE/budgets/status \
  -H "Authorization: Bearer ACCESS_TOKEN_HERE"
```

### 5. Spending Comparison (Last 30 Days)
```bash
curl -X GET http://localhost:5001/api/analytics/FAMILY_ID_HERE/spending/comparison \
  -H "Authorization: Bearer ACCESS_TOKEN_HERE"
```

### 6. Spending Comparison (Custom Date Range)
```bash
curl -X GET "http://localhost:5001/api/analytics/FAMILY_ID_HERE/spending/comparison?startDate=2026-08-01&endDate=2026-08-31" \
  -H "Authorization: Bearer ACCESS_TOKEN_HERE"
```

---

## Health Check

### Health Status
```bash
curl http://localhost:5001/health
```

Expected Response:
```json
{
  "success": true,
  "data": {
    "status": "OK",
    "timestamp": "2026-08-31T12:00:00.000Z",
    "environment": "development"
  }
}
```

---

## Quick Test Workflow

### Step 1: Create User
```bash
curl -X POST http://localhost:5001/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "testuser@example.com",
    "password": "TestPass123",
    "name": "Test User"
  }'
```

Store the `accessToken` and `refreshToken` from response.

### Step 2: Get User Profile
```bash
curl -X GET http://localhost:5001/api/auth/profile \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

Store the `_id` (userId).

### Step 3: Create Family
```bash
curl -X POST http://localhost:5001/api/families \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -d '{
    "name": "Test Family",
    "currency": "INR",
    "timezone": "Asia/Kolkata"
  }'
```

Store the `_id` (familyId).

### Step 4: Load Categories
```bash
curl -X GET http://localhost:5001/api/categories
```

Pick a `_id` from response (categoryId).

### Step 5: Create Expense
```bash
curl -X POST http://localhost:5001/api/expenses/YOUR_FAMILY_ID \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -d '{
    "description": "Test expense",
    "amount": 1000,
    "currency": "INR",
    "categoryId": "YOUR_CATEGORY_ID",
    "date": "2026-08-31T12:00:00Z",
    "paymentMethod": "cash"
  }'
```

### Step 6: Get Analytics Summary
```bash
curl -X GET http://localhost:5001/api/analytics/YOUR_FAMILY_ID/summary \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

---

## Helpful Bash Function

Add this to your `.bashrc` or `.zshrc` for easier testing:

```bash
# Extract token from JSON response
alias extract_token='jq -r ".data.accessToken"'
alias extract_family_id='jq -r ".data._id"'
alias extract_user_id='jq -r ".data._id"'

# Login and extract token
login_test() {
  curl -s -X POST http://localhost:5001/api/auth/login \
    -H "Content-Type: application/json" \
    -d "{\"email\": \"$1\", \"password\": \"$2\"}" | extract_token
}

# Get profile with token
get_profile() {
  curl -s -X GET http://localhost:5001/api/auth/profile \
    -H "Authorization: Bearer $1"
}
```

Usage:
```bash
TOKEN=$(login_test "alice@example.com" "SecurePass123")
get_profile "$TOKEN"
```

---

## Response Status Codes

| Code | Meaning | Common Cause |
|------|---------|--------------|
| 200 | OK | Successful GET/PUT request |
| 201 | Created | Successful POST request (resource created) |
| 400 | Bad Request | Invalid input data, missing fields, validation error |
| 401 | Unauthorized | Missing or invalid authentication token |
| 403 | Forbidden | User lacks permission (e.g., not family owner) |
| 404 | Not Found | Resource doesn't exist (user, family, expense) |
| 429 | Too Many Requests | Rate limit exceeded (signup/login) |
| 500 | Internal Server Error | Server error, check logs |

---

## Common Query Parameters

### Pagination
```
?page=1&limit=20
```

### Date Filtering
```
?startDate=2026-08-01&endDate=2026-08-31
```

### Category Filtering
```
?category=Groceries
```

### Amount Filtering
```
?minAmount=100&maxAmount=5000
```

### Tag Filtering
```
?tag=shopping
```

### Trends
```
?months=12
```

---

## Error Response Format

All errors follow this format:

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable error message"
  }
}
```

---

## Testing Tips

1. **Use Variables**: Save IDs in bash variables for chaining commands
   ```bash
   TOKEN="your_token"
   FAMILY_ID="your_family_id"
   ```

2. **Pretty Print JSON**: Pipe to `jq`
   ```bash
   curl ... | jq .
   ```

3. **Save Response**: Use `-o` flag
   ```bash
   curl ... -o response.json
   ```

4. **Show Headers**: Use `-i` flag
   ```bash
   curl -i ...
   ```

5. **Verbose Output**: Use `-v` flag
   ```bash
   curl -v ...
   ```

6. **Follow Redirects**: Use `-L` flag
   ```bash
   curl -L ...
   ```

---

## Troubleshooting

### Connection Refused
- Ensure backend is running: `npm run dev` in backend folder
- Check port 5001 is available

### Invalid Token Error
- Login again to get fresh token
- Token may have expired (15 minute expiry)
- Check Authorization header format: `Bearer token_here`

### CORS Error
- Frontend must be on allowed origin (check `app.ts`)
- Default: http://localhost:5173

### Rate Limit Error (429)
- Wait 15 minutes before retrying
- Don't send >5 signup/login requests per 15min

### Database Connection Error
- Ensure MongoDB is running: `mongod`
- Check connection string in .env

---

## Load Testing Commands

Test with 100 requests:
```bash
for i in {1..100}; do
  curl -s http://localhost:5001/api/categories &
done
wait
```

Measure response time:
```bash
time curl -s http://localhost:5001/api/categories > /dev/null
```

---

## Notes

- Replace `YOUR_ACCESS_TOKEN` with actual token from login
- Replace `FAMILY_ID_HERE`, `USER_ID_HERE`, `CATEGORY_ID_HERE` with actual IDs
- Dates should be in ISO 8601 format: `YYYY-MM-DDTHH:mm:ssZ`
- All currency codes are ISO 4217 (INR, USD, EUR, etc.)
- All timezone names are from IANA timezone database

