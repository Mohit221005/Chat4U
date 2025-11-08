# 🐛 Bug Fix: Rate Limiting Blocking Auth Check

## Issue
The `/api/auth/check` endpoint was being rate-limited with the strict auth limiter (5 requests/15 minutes), causing 429 errors on page load even for legitimate users.

## Root Cause
In the initial Phase 1A implementation, `authLimiter` was applied to **all** auth routes using `router.use(authLimiter)`. This included the `/api/auth/check` endpoint, which is called by the frontend on every page load to verify authentication status.

### Impact
- Users would be locked out after just 5 page loads in 15 minutes
- Poor user experience with "Too many authentication attempts" errors
- Frontend would fail to verify auth status

## Solution
Apply rate limiting selectively based on endpoint sensitivity:

### Rate Limiting Strategy

| Endpoint | Rate Limit | Reason |
|----------|------------|--------|
| `POST /api/auth/signup` | **5 req/15min** (strict) | Vulnerable to spam/abuse |
| `POST /api/auth/login` | **5 req/15min** (strict) | Vulnerable to brute force |
| `POST /api/auth/logout` | **100 req/15min** (normal) | Low risk, authenticated |
| `PUT /api/auth/update-profile` | **100 req/15min** (normal) | Low risk, authenticated |
| `GET /api/auth/check` | **100 req/15min** (normal) | Called on every page load |

### Implementation

**Before (Incorrect):**
```javascript
// Applied strict limiter to ALL routes
router.use(authLimiter); // 5 req/15min

router.post("/signup", validateSignup, signup);
router.post("/login", validateLogin, login);
router.get("/check", protectRoute, (req, res) => res.json(req.user));
```

**After (Fixed):**
```javascript
// Apply strict limiter ONLY to sensitive endpoints
router.post("/signup", authLimiter, validateSignup, signup);
router.post("/login", authLimiter, validateLogin, login);

// Auth check uses normal API limiter (100 req/15min)
router.get("/check", protectRoute, (req, res) => res.json(req.user));
```

## Additional Protection

The `/api/auth/check` endpoint is still protected by:
1. **Global API Rate Limiter** (100 requests/15 minutes)
2. **skipSuccessfulRequests: true** - Successful requests don't count toward limit
3. **Authentication middleware** - Must have valid JWT token
4. **Arcjet protection** - DDoS and bot protection

This provides sufficient protection while allowing normal user behavior.

## Testing

### Test Rate Limiting is Working
```bash
# Test login rate limiting (should block after 5 attempts)
for i in {1..6}; do
  curl -X POST http://localhost:3000/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email":"test@test.com","password":"wrong"}'
  echo ""
done
```

### Test Auth Check is NOT Blocked
```bash
# Get auth token first
TOKEN="your_jwt_token"

# Call auth check 10 times (should all succeed)
for i in {1..10}; do
  curl http://localhost:3000/api/auth/check \
    -H "Cookie: jwt=$TOKEN"
  echo ""
done
```

## Files Modified
- `src/routes/auth.route.js` - Fixed rate limiting application

## Deployment
This fix is backward compatible and can be deployed immediately:

```bash
git add src/routes/auth.route.js
git commit -m "fix: Rate limiting blocking auth check endpoint"
git push origin main
```

## Prevention
For future endpoints, follow this guideline:

### When to Use Strict Rate Limiting (5 req/15min)
- ✅ Public authentication endpoints (signup, login)
- ✅ Password reset/forgot password
- ✅ Email verification endpoints
- ✅ Any endpoint that creates resources without authentication

### When to Use Normal Rate Limiting (100 req/15min)
- ✅ Authenticated endpoints
- ✅ Read-only endpoints called frequently
- ✅ Health check and status endpoints

### When to Skip Rate Limiting
- ✅ Internal service-to-service calls
- ✅ Health/readiness probes (if needed)
- ✅ Static file serving

---

**Fixed By:** Phase 1A Bug Fix
**Date:** November 5, 2025
**Status:** ✅ Resolved
