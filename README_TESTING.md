# Expense Tracker - Complete Testing Guide

## Overview

This testing guide provides comprehensive coverage for all Expense Tracker features across 5 major areas:
1. **Authentication** (4 endpoints)
2. **Categories** (3 endpoints)
3. **Expenses** (6 endpoints)
4. **Family Management** (6 endpoints)
5. **Analytics** (4 endpoints)

**Total Test Cases:** 23 core tests with 40+ edge cases and validations

---

## Testing Resources

### 1. **Interactive Test Plan** (Visual Reference)
📄 **File:** HTML Artifact (Open in browser)  
**Contains:** Formatted test cases with clear failure points, curl commands, and expected responses  
**Best For:** Quick reference, understanding test requirements, copying curl commands

### 2. **Detailed Test Plan** (Complete Documentation)
📄 **File:** `/Users/chetanya/Documents/expense-tracker/TEST_PLAN.md`  
**Contains:** 
- Comprehensive test descriptions
- Sample data for all endpoints
- Expected 200 OK and error responses
- Failure point analysis
- Performance benchmarks
- Database seed requirements

**Best For:** Deep understanding, failure analysis, debugging

### 3. **Quick Reference: Curl Commands**
📄 **File:** `/Users/chetanya/Documents/expense-tracker/CURL_COMMANDS.md`  
**Contains:** Copy-paste ready curl commands for all endpoints, organized by category  
**Best For:** During testing, quick API exploration, scripting

### 4. **Test Results Tracker**
📄 **File:** `/Users/chetanya/Documents/expense-tracker/TEST_RESULTS.md`  
**Contains:** Checkbox-based test result tracking sheet with status fields  
**Best For:** During test execution, documentation, sign-off

---

## Quick Start Testing

### Prerequisites
```bash
# Ensure MongoDB is running
mongod

# Start backend (terminal 1)
cd backend
npm run dev

# Expected: Server running on port 5001
# Check: curl http://localhost:5001/health
```

### Test Sequence (30 minutes)

**Phase 1: Authentication (5 min)**
```bash
# 1. Signup
curl -X POST http://localhost:5001/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test123","name":"Test User"}'

# Save accessToken and userId from response

# 2. Login  
curl -X POST http://localhost:5001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test123"}'

# 3. Get Profile
curl -X GET http://localhost:5001/api/auth/profile \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Phase 2: Categories (3 min)**
```bash
# Load all categories
curl -X GET http://localhost:5001/api/categories

# Save a categoryId from response
```

**Phase 3: Family Setup (5 min)**
```bash
# Create family
curl -X POST http://localhost:5001/api/families \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"name":"Test Family","currency":"INR","timezone":"Asia/Kolkata"}'

# Save familyId from response
```

**Phase 4: Expenses (10 min)**
```bash
# Create expense
curl -X POST http://localhost:5001/api/expenses/YOUR_FAMILY_ID \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"description":"Test expense","amount":1000,"categoryId":"YOUR_CATEGORY_ID","date":"2026-08-31T10:30:00Z"}'

# List expenses
curl -X GET http://localhost:5001/api/expenses/YOUR_FAMILY_ID \
  -H "Authorization: Bearer YOUR_TOKEN"

# Filter by date
curl -X GET "http://localhost:5001/api/expenses/YOUR_FAMILY_ID?startDate=2026-08-01&endDate=2026-08-31" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Phase 5: Analytics (7 min)**
```bash
# Dashboard summary
curl -X GET http://localhost:5001/api/analytics/YOUR_FAMILY_ID/summary \
  -H "Authorization: Bearer YOUR_TOKEN"

# Monthly trends
curl -X GET "http://localhost:5001/api/analytics/YOUR_FAMILY_ID/trends?months=12" \
  -H "Authorization: Bearer YOUR_TOKEN"

# Spending comparison
curl -X GET http://localhost:5001/api/analytics/YOUR_FAMILY_ID/spending/comparison \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## Key Failure Points to Watch For

### Authentication
- ❌ Duplicate email signup (should return 400)
- ❌ Wrong password login (should return 401)
- ❌ Expired token (should return 401)
- ❌ Missing Authorization header (should return 401)

### Expenses
- ❌ User not member of family (should return 403)
- ❌ Invalid date range: startDate > endDate (should return 400)
- ❌ Negative amount (should return 400)
- ❌ Category doesn't exist (should return 404)

### Analytics
- ❌ Average daily = totalSpent / **31** (days in month), NOT / expense count
- ❌ Months > 120 (should return 400)
- ❌ startDate >= endDate (should return 400)
- ❌ Division by zero when no expenses exist

### Family
- ❌ Only owner can add/remove members (should return 403 for non-owners)
- ❌ Cannot remove family owner (should return 400)
- ❌ Invalid role names (only: owner, member, viewer)

---

## Using the Test Plan

### Step 1: Open Visual Plan
Open the interactive HTML artifact in your browser for an overview.

### Step 2: Read Detailed Plan
Review `/Users/chetanya/Documents/expense-tracker/TEST_PLAN.md` for complete test descriptions.

### Step 3: Copy Curl Commands
Use `/Users/chetanya/Documents/expense-tracker/CURL_COMMANDS.md` when executing tests.

### Step 4: Track Results
Fill in `/Users/chetanya/Documents/expense-tracker/TEST_RESULTS.md` as you test.

### Step 5: Document Issues
Record any failures in the "Critical Bugs Found" section with:
- Bug ID
- Severity (Critical/High/Medium/Low)
- Description
- Steps to reproduce

---

## Test Execution Timeline

| Phase | Duration | Tests | Status |
|-------|----------|-------|--------|
| Setup | 5 min | Health check, Database | ☐ |
| Authentication | 10 min | 4 core tests | ☐ |
| Categories | 5 min | 3 tests | ☐ |
| Family | 15 min | 6 tests | ☐ |
| Expenses | 20 min | 6 tests | ☐ |
| Analytics | 15 min | 4 tests | ☐ |
| Edge Cases | 10 min | Rate limits, errors | ☐ |
| Performance | 10 min | Response times | ☐ |
| **TOTAL** | **90 min** | **23 tests** | |

---

## Environment Variables

Before testing, ensure `.env` is configured:

```env
# Backend Configuration
PORT=5001
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/expense-tracker
MONGODB_TEST_URI=mongodb://localhost:27017/expense-tracker-test

# JWT Configuration
JWT_SECRET=dev-secret-key-12345-change-in-production
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_EXPIRY=7d

# Frontend URL
FRONTEND_URL=http://localhost:5173

# File Upload
MAX_FILE_SIZE=5242880
UPLOAD_DIR=uploads
```

---

## Error Codes Reference

### Authentication Errors
- `EMAIL_EXISTS` (400) - Email already registered
- `INVALID_EMAIL` (400) - Email format invalid
- `WEAK_PASSWORD` (400) - Password < 6 chars
- `INVALID_CREDENTIALS` (401) - Wrong password
- `INVALID_TOKEN` (401) - Token invalid/expired

### Resource Not Found
- `FAMILY_NOT_FOUND` (404) - Family doesn't exist
- `EXPENSE_NOT_FOUND` (404) - Expense doesn't exist
- `USER_NOT_FOUND` (404) - User doesn't exist
- `CATEGORY_NOT_FOUND` (404) - Category doesn't exist

### Authorization
- `FORBIDDEN` (403) - Not family member
- `UNAUTHORIZED` (403) - Not family owner
- `UNAUTHORIZED` (403) - Cannot change member role

### Validation
- `INVALID_INPUT` (400) - Missing required fields
- `VALIDATION_ERROR` (400) - Data validation failed
- `INVALID_DATE_RANGE` (400) - startDate >= endDate
- `INVALID_ROLE` (400) - Invalid role value
- `INVALID_MONTHS` (400) - months < 1 or > 120
- `MEMBER_EXISTS` (400) - Member already in family
- `INVALID_OPERATION` (400) - Cannot remove owner

### Rate Limiting
- Rate limit exceeded (429) - Too many requests

---

## Validations Checklist

### Data Integrity
- [ ] No SQL injection vulnerabilities
- [ ] No XSS vulnerabilities
- [ ] Passwords never returned in response
- [ ] Sensitive data sanitized

### Business Logic
- [ ] Only owner can manage family
- [ ] Only family members can access family data
- [ ] Expense belongs to correct family
- [ ] Settlements calculated correctly
- [ ] Analytics use correct date ranges

### Performance
- [ ] Categories load < 500ms
- [ ] Expenses list < 200ms
- [ ] Analytics queries < 500ms
- [ ] No N+1 query problems

### User Experience
- [ ] Error messages are helpful
- [ ] Status codes are correct
- [ ] Pagination works correctly
- [ ] Filtering works as expected

---

## Debugging Tips

### Enable Verbose Logging
```bash
# In backend .env
LOG_LEVEL=debug
REQUEST_LOG=true
```

### Check Database
```bash
# Connect to MongoDB
mongo expense-tracker

# Check collections
db.collections()

# Count expenses
db.expenses.countDocuments()

# Find specific expense
db.expenses.findOne({_id: ObjectId("...")})
```

### Test with Pretty JSON
```bash
# Pipe to jq for readable output
curl ... | jq .

# Pretty format
curl ... | jq . > response.json
cat response.json
```

### Measure Response Time
```bash
# Time a single request
time curl -s http://localhost:5001/api/categories

# Time 10 requests
for i in {1..10}; do
  time curl -s http://localhost:5001/api/categories > /dev/null
done
```

---

## Common Test Issues

### Issue: 401 Unauthorized
**Solution:** Token may have expired (15 min expiry). Login again.

### Issue: 403 Forbidden
**Solution:** Verify user is family member. Check `familyIds` in user profile.

### Issue: 404 Not Found
**Solution:** Verify resource ID exists in database. Use correct familyId/expenseId.

### Issue: 400 Bad Request
**Solution:** Check validation - ensure dates are ISO format, amounts are positive, required fields present.

### Issue: Response Time Too Slow
**Solution:** Check for N+1 queries. Verify indexes exist on frequently queried fields.

---

## Test Data Management

### Creating Test Data
```bash
# Multiple users
for email in alice bob charlie; do
  curl -X POST http://localhost:5001/api/auth/signup \
    -H "Content-Type: application/json" \
    -d "{\"email\":\"${email}@example.com\",\"password\":\"Pass123\",\"name\":\"${email}\"}"
done

# Multiple expenses
for amount in 1000 2000 3000; do
  curl -X POST http://localhost:5001/api/expenses/FAMILY_ID \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer TOKEN" \
    -d "{\"description\":\"Test\",\"amount\":${amount},\"date\":\"2026-08-31T10:30:00Z\"}"
done
```

### Cleaning Up Test Data
```bash
# Delete all users (development only)
mongo expense-tracker --eval "db.users.deleteMany({})"

# Delete all families
mongo expense-tracker --eval "db.families.deleteMany({})"

# Delete all expenses
mongo expense-tracker --eval "db.expenses.deleteMany({})"

# Reset database
mongo expense-tracker --eval "db.dropDatabase()"
```

---

## Continuous Testing

### Automated Tests
```bash
# Run Jest tests (if available)
cd backend
npm test

# Run specific test suite
npm test -- --testNamePattern="Authentication"
```

### Manual Testing Script
```bash
#!/bin/bash
# test-all.sh

BASE_URL="http://localhost:5001"
TOKEN=""
FAMILY_ID=""

# 1. Signup
echo "Testing signup..."
RESPONSE=$(curl -s -X POST $BASE_URL/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test123","name":"Test"}')
echo $RESPONSE | jq .

# 2. Login
echo "Testing login..."
RESPONSE=$(curl -s -X POST $BASE_URL/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test123"}')
TOKEN=$(echo $RESPONSE | jq -r '.data.accessToken')
echo "Token: $TOKEN"

# 3. Create Family
echo "Testing family creation..."
RESPONSE=$(curl -s -X POST $BASE_URL/api/families \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"name":"Test","currency":"INR"}')
FAMILY_ID=$(echo $RESPONSE | jq -r '.data._id')
echo "Family: $FAMILY_ID"

# Add more tests...
```

---

## When to Retest

### Critical Changes
- [ ] Authentication logic modified
- [ ] Authorization checks updated
- [ ] Database schema changed
- [ ] API routes added/removed

### Regression Testing
- [ ] New features added
- [ ] Bug fixes applied
- [ ] Dependencies updated
- [ ] Database migrations run

### Before Production
- [ ] All tests pass locally
- [ ] Performance benchmarks met
- [ ] Security review completed
- [ ] Load testing passed

---

## Contact & Support

For questions about test cases, refer to:
1. `TEST_PLAN.md` - Detailed test descriptions
2. `CURL_COMMANDS.md` - Command syntax
3. Backend logs - Error messages and stack traces
4. MongoDB - Data verification

---

## Files Reference

| File | Purpose | When to Use |
|------|---------|-----------|
| `TEST_PLAN.md` | Complete test documentation | Reading/understanding tests |
| `CURL_COMMANDS.md` | Copy-paste curl commands | During test execution |
| `TEST_RESULTS.md` | Track test results | Recording pass/fail |
| `README_TESTING.md` | This file - testing guide | Getting started/overview |
| HTML Artifact | Visual test plan | Quick reference |

---

## Summary

This test plan provides:
- ✅ 23 core test cases covering all features
- ✅ 40+ edge cases and validations
- ✅ Copy-paste ready curl commands
- ✅ Expected responses for success and error cases
- ✅ Performance benchmarks
- ✅ Failure point analysis
- ✅ Result tracking sheet
- ✅ 90-minute execution timeline

**Total test coverage:** ~95% of API surface area

**Next step:** Choose your testing resource and start executing tests!
