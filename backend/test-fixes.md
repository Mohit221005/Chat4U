# 🧪 Quick Test Guide - Bug Fixes

## Prerequisites
- Server running on http://localhost:3000
- Valid JWT token (login first)

---

## Test 1: Message Validation ✅

### Test A: Send Text-Only Message

```bash
curl -X POST http://localhost:3000/api/messages/send/USER_ID_HERE \
  -H "Content-Type: application/json" \
  -H "Cookie: jwt=YOUR_JWT_TOKEN" \
  -d '{"text":"Hello there!","image":""}'
```

**Expected:** ✅ 201 Success with message object

---

### Test B: Send Image-Only Message

```bash
curl -X POST http://localhost:3000/api/messages/send/USER_ID_HERE \
  -H "Content-Type: application/json" \
  -H "Cookie: jwt=YOUR_JWT_TOKEN" \
  -d '{"text":"","image":"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="}'
```

**Expected:** ✅ 201 Success with message object

---

### Test C: Send Empty Message (Should Fail)

```bash
curl -X POST http://localhost:3000/api/messages/send/USER_ID_HERE \
  -H "Content-Type: application/json" \
  -H "Cookie: jwt=YOUR_JWT_TOKEN" \
  -d '{"text":"","image":""}'
```

**Expected:** ❌ 400 Error - "Message must contain either text or image"

---

## Test 2: Profile Images ✅

### Test A: Get Chat Partners

```bash
curl http://localhost:3000/api/messages/users \
  -H "Cookie: jwt=YOUR_JWT_TOKEN"
```

**Expected:** Array of users, each with `profilePic` field

**Check:**
- ✅ All users have `profilePic` URLs
- ✅ URLs start with `https://ui-avatars.com/api/...`
- ✅ No broken Cloudinary URLs

---

### Test B: Create New User

```bash
curl -X POST http://localhost:3000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "testuser@example.com",
    "fullName": "Test User",
    "password": "password123"
  }'
```

**Expected:** User object with `profilePic` field

**Check:**
- ✅ `user.profilePic` is `https://ui-avatars.com/api/?name=Test%20User&background=random&size=200`
- ✅ Open URL in browser - should show "TU" avatar

---

### Test C: Verify Avatar Loads

Copy any `profilePic` URL from the response and paste in browser.

**Example:**
```
https://ui-avatars.com/api/?name=John%20Doe&background=random&size=200
```

**Expected:**
- ✅ Image loads instantly
- ✅ Shows initials (e.g., "JD")
- ✅ Has colored background

---

## Quick Frontend Test

If you have frontend running:

1. **Open chat app**
2. **Check chat list** - All avatars should be visible
3. **Send a message** - Type text and hit send (should work)
4. **Send image** - Upload image (should work)
5. **Create new user** - Should get personalized avatar

---

## Troubleshooting

### Messages still failing?

Check logs:
```bash
tail -f logs/combined.log
```

Look for: `Send message request` debug logs

### Profile pics still broken?

1. **Check one URL directly in browser:**
   ```
   https://ui-avatars.com/api/?name=Test&background=random&size=200
   ```
   Should load instantly

2. **Check database:**
   ```javascript
   // In MongoDB shell
   db.users.findOne({}, { profilePic: 1, fullName: 1 })
   ```
   
   New users should have ui-avatars.com URLs
   Old users might still have Cloudinary URLs (that's OK)

---

## Success Indicators ✅

- ✅ Text messages send successfully
- ✅ Image messages send successfully
- ✅ Empty messages are rejected with clear error
- ✅ All users in chat list show avatars
- ✅ No 404 errors in network tab
- ✅ No broken image icons
- ✅ New users get personalized avatars

---

## If All Tests Pass 🎉

Both bugs are fixed! Your app should now:
- Send messages without validation errors
- Display profile pictures for all users
- Show personalized avatars for new users
- Have better debugging capability

Enjoy your bug-free chat app! 🚀
