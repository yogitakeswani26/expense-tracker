# Expense Tracker - Test Results Tracking Sheet

**Test Date:** _________________  
**Tester Name:** _________________  
**Environment:** Development (localhost:5001)  
**Database:** MongoDB  

---

## Test Summary

| Category | Passed | Failed | Total | Pass Rate |
|----------|--------|--------|-------|-----------|
| Authentication | ___ | ___ | 4 | __% |
| Categories | ___ | ___ | 3 | __% |
| Expenses | ___ | ___ | 6 | __% |
| Family | ___ | ___ | 6 | __% |
| Analytics | ___ | ___ | 4 | __% |
| **TOTAL** | **___** | **___** | **23** | **___%** |

---

## 1. AUTHENTICATION TESTS

### T-AUTH-001: Signup with New Email

- [ ] **Case 1.1.1: Success - New User**
  - Status: ☐ Pass ☐ Fail
  - Expected: 201 Created
  - Actual: ___
  - Notes: _________________________________

- [ ] **Case 1.1.2: Duplicate Email**
  - Status: ☐ Pass ☐ Fail
  - Expected: 400 EMAIL_EXISTS
  - Actual: ___
  - Notes: _________________________________

- [ ] **Case 1.1.3: Invalid Password**
  - Status: ☐ Pass ☐ Fail
  - Expected: 400 WEAK_PASSWORD
  - Actual: ___
  - Notes: _________________________________

### T-AUTH-002: Login with Credentials

- [ ] **Case 1.2.1: Success - Valid Credentials**
  - Status: ☐ Pass ☐ Fail
  - Expected: 200 OK + tokens
  - Actual: ___
  - Notes: _________________________________

- [ ] **Case 1.2.2: Wrong Password**
  - Status: ☐ Pass ☐ Fail
  - Expected: 401 INVALID_CREDENTIALS
  - Actual: ___
  - Notes: _________________________________

- [ ] **Case 1.2.3: Missing Fields**
  - Status: ☐ Pass ☐ Fail
  - Expected: 400 INVALID_INPUT
  - Actual: ___
  - Notes: _________________________________

### T-AUTH-003: Token Refresh

- [ ] **Case 1.3.1: Success - Valid Refresh Token**
  - Status: ☐ Pass ☐ Fail
  - Expected: 200 OK + new accessToken
  - Actual: ___
  - Notes: _________________________________

### T-AUTH-004: Get User Profile

- [ ] **Case 1.4.1: Success - Get Profile**
  - Status: ☐ Pass ☐ Fail
  - Expected: 200 OK + user data
  - Actual: ___
  - Notes: _________________________________

- [ ] **Case 1.4.2: Missing Token**
  - Status: ☐ Pass ☐ Fail
  - Expected: 401 INVALID_TOKEN
  - Actual: ___
  - Notes: _________________________________

---

## 2. CATEGORY TESTS

### T-CAT-001: Load All Categories

- [ ] **Case 2.1.1: Hierarchical Structure**
  - Status: ☐ Pass ☐ Fail
  - Expected: 200 OK + 15+ categories
  - Actual: ___
  - Validation:
    - [ ] 15+ main categories (level 1)
    - [ ] Level 2 subcategories present
    - [ ] Level 3 sub-subcategories present
    - [ ] Categories ordered by `order` field
    - [ ] Response time < 2 seconds
  - Notes: _________________________________

### T-CAT-002: Get Flat Category List

- [ ] **Case 2.2.1: Flat List**
  - Status: ☐ Pass ☐ Fail
  - Expected: 200 OK + flat structure
  - Actual: ___
  - Validation:
    - [ ] Parent names enriched
    - [ ] No duplicate categories
    - [ ] Correct parent references
  - Notes: _________________________________

### T-CAT-003: Get Single Category

- [ ] **Case: Get Category by ID**
  - Status: ☐ Pass ☐ Fail
  - Expected: 200 OK
  - Actual: ___
  - Notes: _________________________________

---

## 3. EXPENSE TESTS

### T-EXP-001: Create Expense

- [ ] **Case 3.1.1: Success - Create Expense**
  - Status: ☐ Pass ☐ Fail
  - Expected: 201 Created + expense data
  - Actual: ___
  - Notes: _________________________________

- [ ] **Case 3.1.2: Invalid Amount**
  - Status: ☐ Pass ☐ Fail
  - Expected: 400 VALIDATION_ERROR
  - Actual: ___
  - Notes: _________________________________

- [ ] **Case 3.1.3: Not Family Member**
  - Status: ☐ Pass ☐ Fail
  - Expected: 403 FORBIDDEN
  - Actual: ___
  - Notes: _________________________________

### T-EXP-002: List Expenses

- [ ] **Case 3.2.1: Get All Expenses**
  - Status: ☐ Pass ☐ Fail
  - Expected: 200 OK + paginated results
  - Actual: ___
  - Notes: _________________________________

- [ ] **Case 3.2.2: Filter by Date Range**
  - Status: ☐ Pass ☐ Fail
  - Expected: 200 OK + filtered results
  - Actual: ___
  - Notes: _________________________________

- [ ] **Case 3.2.3: Invalid Date Range**
  - Status: ☐ Pass ☐ Fail
  - Expected: 400 INVALID_DATE_RANGE
  - Actual: ___
  - Notes: _________________________________

- [ ] **Case 3.2.4: Pagination Out of Range**
  - Status: ☐ Pass ☐ Fail
  - Expected: 200 OK + empty results
  - Actual: ___
  - Notes: _________________________________

### T-EXP-003: Get Single Expense

- [ ] **Case 3.3.1: Success**
  - Status: ☐ Pass ☐ Fail
  - Expected: 200 OK
  - Actual: ___
  - Notes: _________________________________

- [ ] **Case 3.3.2: Expense Not Found**
  - Status: ☐ Pass ☐ Fail
  - Expected: 404 EXPENSE_NOT_FOUND
  - Actual: ___
  - Notes: _________________________________

### T-EXP-004: Update Expense

- [ ] **Case 3.4.1: Success - Update Amount**
  - Status: ☐ Pass ☐ Fail
  - Expected: 200 OK + updated data
  - Actual: ___
  - Notes: _________________________________

### T-EXP-005: Delete Expense

- [ ] **Case 3.5.1: Success - Delete**
  - Status: ☐ Pass ☐ Fail
  - Expected: 200 OK
  - Actual: ___
  - Verification:
    - [ ] Expense count decreased
    - [ ] Deleted expense returns 404 on retrieval
  - Notes: _________________________________

### T-EXP-006: Filter by Category

- [ ] **Case: Filter by Category**
  - Status: ☐ Pass ☐ Fail
  - Expected: 200 OK + category filtered results
  - Actual: ___
  - Notes: _________________________________

---

## 4. FAMILY TESTS

### T-FAM-001: Create Family

- [ ] **Case 4.1.1: Success - Create Family**
  - Status: ☐ Pass ☐ Fail
  - Expected: 201 Created + creator as owner
  - Actual: ___
  - Notes: _________________________________

- [ ] **Case 4.1.2: Empty Name**
  - Status: ☐ Pass ☐ Fail
  - Expected: 400 INVALID_INPUT
  - Actual: ___
  - Notes: _________________________________

### T-FAM-002: Get User Families

- [ ] **Case 4.2.1: Success - Get All Families**
  - Status: ☐ Pass ☐ Fail
  - Expected: 200 OK + families array
  - Actual: ___
  - Notes: _________________________________

### T-FAM-003: Add Member

- [ ] **Case 4.3.1: Success - Add by Email**
  - Status: ☐ Pass ☐ Fail
  - Expected: 201 Created + member added
  - Actual: ___
  - Notes: _________________________________

- [ ] **Case 4.3.2: Duplicate Member**
  - Status: ☐ Pass ☐ Fail
  - Expected: 400 MEMBER_EXISTS
  - Actual: ___
  - Notes: _________________________________

- [ ] **Case 4.3.3: User Not Owner**
  - Status: ☐ Pass ☐ Fail
  - Expected: 403 UNAUTHORIZED
  - Actual: ___
  - Notes: _________________________________

### T-FAM-004: Remove Member

- [ ] **Case 4.4.1: Success - Remove Member**
  - Status: ☐ Pass ☐ Fail
  - Expected: 200 OK
  - Actual: ___
  - Notes: _________________________________

- [ ] **Case 4.4.2: Try to Remove Owner**
  - Status: ☐ Pass ☐ Fail
  - Expected: 400 INVALID_OPERATION
  - Actual: ___
  - Notes: _________________________________

### T-FAM-005: Update Member Role

- [ ] **Case 4.5.1: Success - Change Role**
  - Status: ☐ Pass ☐ Fail
  - Expected: 200 OK + role updated
  - Actual: ___
  - Notes: _________________________________

- [ ] **Case 4.5.2: Invalid Role**
  - Status: ☐ Pass ☐ Fail
  - Expected: 400 INVALID_ROLE
  - Actual: ___
  - Notes: _________________________________

### T-FAM-006: View Settlements

- [ ] **Case 4.6.1: Success - Get Settlements**
  - Status: ☐ Pass ☐ Fail
  - Expected: 200 OK + balance data
  - Actual: ___
  - Notes: _________________________________

---

## 5. ANALYTICS TESTS

### T-ANA-001: Dashboard Summary

- [ ] **Case 5.1.1: Success - Get Summary**
  - Status: ☐ Pass ☐ Fail
  - Expected: 200 OK + summary data
  - Actual: ___
  - Validation:
    - [ ] totalSpent = sum of August expenses
    - [ ] averageDaily = totalSpent / 31 (correct)
    - [ ] comparison % calculated correctly
    - [ ] category percentages sum to ~100%
    - [ ] No division by zero errors
  - Notes: _________________________________

### T-ANA-002: Monthly Trends

- [ ] **Case 5.2.1: Success - Get 12 Month Trends**
  - Status: ☐ Pass ☐ Fail
  - Expected: 200 OK + 12 months data
  - Actual: ___
  - Validation:
    - [ ] 12 months returned
    - [ ] Chronological order (oldest to newest)
    - [ ] All months have data (0 if empty)
  - Notes: _________________________________

- [ ] **Case 5.2.2: Invalid Months (> 120)**
  - Status: ☐ Pass ☐ Fail
  - Expected: 400 INVALID_MONTHS
  - Actual: ___
  - Notes: _________________________________

### T-ANA-003: Budget Status

- [ ] **Case 5.3.1: Success - Get Budget Status**
  - Status: ☐ Pass ☐ Fail
  - Expected: 200 OK + budget data
  - Actual: ___
  - Validation:
    - [ ] Spent calculation correct
    - [ ] Status thresholds correct (80% = warning)
    - [ ] No division by zero
    - [ ] Remaining amounts positive
  - Notes: _________________________________

### T-ANA-004: Spending Comparison

- [ ] **Case 5.4.1: Success - Get Comparison**
  - Status: ☐ Pass ☐ Fail
  - Expected: 200 OK + member spending data
  - Actual: ___
  - Validation:
    - [ ] User names populated
    - [ ] Sorted by total (descending)
    - [ ] All members included
  - Notes: _________________________________

- [ ] **Case 5.4.2: Invalid Date Range**
  - Status: ☐ Pass ☐ Fail
  - Expected: 400 INVALID_DATE_RANGE
  - Actual: ___
  - Notes: _________________________________

---

## Edge Cases & Error Handling

### Rate Limiting
- [ ] **Signup Rate Limit (5 per 15 min)**
  - Status: ☐ Pass ☐ Fail
  - Expected: 429 after 5 attempts
  - Actual: ___
  - Notes: _________________________________

- [ ] **Login Rate Limit (5 per 15 min)**
  - Status: ☐ Pass ☐ Fail
  - Expected: 429 after 5 attempts
  - Actual: ___
  - Notes: _________________________________

### Empty Result Sets
- [ ] **List Expenses - Empty Family**
  - Status: ☐ Pass ☐ Fail
  - Expected: 200 OK + empty array
  - Actual: ___
  - Notes: _________________________________

- [ ] **Filter Expenses - No Matches**
  - Status: ☐ Pass ☐ Fail
  - Expected: 200 OK + empty array
  - Actual: ___
  - Notes: _________________________________

### Authorization
- [ ] **Access Protected Route Without Token**
  - Status: ☐ Pass ☐ Fail
  - Expected: 401 Unauthorized
  - Actual: ___
  - Notes: _________________________________

- [ ] **Expired Token**
  - Status: ☐ Pass ☐ Fail
  - Expected: 401 Invalid or expired token
  - Actual: ___
  - Notes: _________________________________

### Invalid IDs
- [ ] **Non-existent Family ID**
  - Status: ☐ Pass ☐ Fail
  - Expected: 404 FAMILY_NOT_FOUND
  - Actual: ___
  - Notes: _________________________________

- [ ] **Invalid Object ID Format**
  - Status: ☐ Pass ☐ Fail
  - Expected: 400 or 404
  - Actual: ___
  - Notes: _________________________________

---

## Performance Tests

### Response Times
- [ ] **Load Categories**
  - Target: < 500ms
  - Actual: ___ms
  - Status: ☐ Pass ☐ Fail
  - Notes: _________________________________

- [ ] **List 20 Expenses**
  - Target: < 200ms
  - Actual: ___ms
  - Status: ☐ Pass ☐ Fail
  - Notes: _________________________________

- [ ] **Get Summary**
  - Target: < 300ms
  - Actual: ___ms
  - Status: ☐ Pass ☐ Fail
  - Notes: _________________________________

- [ ] **Get 12-Month Trends**
  - Target: < 500ms
  - Actual: ___ms
  - Status: ☐ Pass ☐ Fail
  - Notes: _________________________________

### Database Queries
- [ ] **No N+1 Queries**
  - Status: ☐ Pass ☐ Fail
  - Query count for categories: ___
  - Notes: _________________________________

- [ ] **Proper Indexing**
  - Status: ☐ Pass ☐ Fail
  - Slow queries detected: ☐ Yes ☐ No
  - Notes: _________________________________

---

## Data Integrity Tests

### Family-Expense Relationship
- [ ] **Expense Belongs to Correct Family**
  - Status: ☐ Pass ☐ Fail
  - Notes: _________________________________

- [ ] **User Removed from Family Loses Access**
  - Status: ☐ Pass ☐ Fail
  - Notes: _________________________________

### Settlement Calculations
- [ ] **Who Owes Who Calculation Accurate**
  - Status: ☐ Pass ☐ Fail
  - Test with splits: ☐ Yes ☐ No
  - Notes: _________________________________

- [ ] **Settlement Updates After Expense Delete**
  - Status: ☐ Pass ☐ Fail
  - Notes: _________________________________

### Currency Consistency
- [ ] **Currency Preserved in Expense**
  - Status: ☐ Pass ☐ Fail
  - Notes: _________________________________

- [ ] **Family Currency Used as Default**
  - Status: ☐ Pass ☐ Fail
  - Notes: _________________________________

---

## Regression Tests

### Existing Features
- [ ] **Login/Logout Flow**
  - Status: ☐ Pass ☐ Fail
  - Notes: _________________________________

- [ ] **Create/Edit/Delete Workflow**
  - Status: ☐ Pass ☐ Fail
  - Notes: _________________________________

- [ ] **Category Hierarchy**
  - Status: ☐ Pass ☐ Fail
  - Notes: _________________________________

- [ ] **Analytics Calculations**
  - Status: ☐ Pass ☐ Fail
  - Notes: _________________________________

---

## Critical Bugs Found

| ID | Severity | Description | Status |
|----|----------|-------------|--------|
| BUG-001 | ☐ Critical ☐ High ☐ Medium ☐ Low | ________________ | ☐ New ☐ Fixed |
| BUG-002 | ☐ Critical ☐ High ☐ Medium ☐ Low | ________________ | ☐ New ☐ Fixed |
| BUG-003 | ☐ Critical ☐ High ☐ Medium ☐ Low | ________________ | ☐ New ☐ Fixed |
| BUG-004 | ☐ Critical ☐ High ☐ Medium ☐ Low | ________________ | ☐ New ☐ Fixed |
| BUG-005 | ☐ Critical ☐ High ☐ Medium ☐ Low | ________________ | ☐ New ☐ Fixed |

---

## Test Execution Notes

### What Worked Well
- _________________________________
- _________________________________
- _________________________________

### Issues Encountered
- _________________________________
- _________________________________
- _________________________________

### Recommendations
- _________________________________
- _________________________________
- _________________________________

### Follow-up Testing Needed
- [ ] Load testing (100+ concurrent users)
- [ ] Database stress testing
- [ ] Security testing (SQL injection, XSS)
- [ ] Mobile API compatibility
- [ ] Rate limiting under load
- [ ] Timezone edge cases
- [ ] Large dataset performance
- [ ] API versioning

---

## Sign-off

- **Tester Name:** _________________________
- **Date Completed:** _____________________
- **Overall Status:** ☐ Pass ☐ Fail ☐ Conditional Pass
- **Recommended for Release:** ☐ Yes ☐ No
- **Comments:** _________________________________
  
---

## Test Summary Statistics

**Total Test Cases:** 23  
**Passed:** ___  
**Failed:** ___  
**Pass Rate:** ___%  
**Critical Issues:** ___  
**High Priority Issues:** ___  

**Testing Duration:** ___ hours  
**Regression Issues:** ☐ Yes ☐ No  
**Ready for Production:** ☐ Yes ☐ No

---

**Next Testing Phase:** ______________________  
**Re-testing Date:** ________________________
