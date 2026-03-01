# Campus Link - Backend Testing Guide

## ✅ SERVER STATUS
- **Status**: Running
- **Port**: 8080
- **Database**: campus-link (MongoDB Atlas)
- **Connection**: ✅ Connected
- **Models Loaded**: User, Group, JoinRequest

---

## 🧪 TESTING FLOW (Use Postman)

### STEP 1: Register a User (Get Token)

**Endpoint**: `POST http://localhost:8080/api/auth/register`

**Headers**:
```
Content-Type: application/json
```

**Body** (raw JSON):
```json
{
  "name": "Test Owner",
  "email": "owner@test.com",
  "password": "password123"
}
```

**Expected Response**:
```json
{
  "success": true,
  "message": "User registered successfully",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "_id": "...",
    "name": "Test Owner",
    "email": "owner@test.com",
    "role": "user"
  }
}
```

**⚠️ SAVE THE TOKEN** - You'll need it for the next steps.

---

### STEP 2: Promote User to Admin (MongoDB Compass)

Since the registered user has role "user" but group creation requires "admin" or "owner":

**Option A: Use MongoDB Compass**
1. Open MongoDB Compass
2. Connect to: `mongodb+srv://CampusLink:Campuslink000@campuslink.ekb8q6k.mongodb.net/`
3. Navigate to: `campus-link` → `users`
4. Find your user by email: `owner@test.com`
5. Edit the document and change: `"role": "user"` → `"role": "admin"`
6. Save

**Option B: Use Admin Endpoint** (if you already have an admin)
```
POST http://localhost:8080/api/admin/promote/:userId
Authorization: Bearer <ADMIN_TOKEN>
```

---

### STEP 3: Create a Group (THE CRITICAL TEST)

**Endpoint**: `POST http://localhost:8080/api/groups`

**Headers**:
```
Content-Type: application/json
Authorization: Bearer <YOUR_TOKEN_FROM_STEP_1>
```

**Body** (raw JSON):
```json
{
  "name": "Computer Science Study Group",
  "subject": "CS 101",
  "description": "A group for learning CS fundamentals"
}
```

**Expected Response**:
```json
{
  "success": true,
  "message": "Group created successfully",
  "group": {
    "_id": "...",
    "name": "Computer Science Study Group",
    "subject": "CS 101",
    "description": "A group for learning CS fundamentals",
    "createdBy": {
      "_id": "...",
      "name": "Test Owner",
      "email": "owner@test.com"
    },
    "admins": ["..."],
    "members": ["..."],
    "createdAt": "...",
    "updatedAt": "..."
  }
}
```

**🔍 WATCH SERVER LOGS**:
You should see:
```
🔐 Protect middleware called for: POST /api/groups
✅ Token found in header
✅ Token verified. User ID: ...
✅ User authenticated: { id: '...', email: 'owner@test.com', role: 'admin' }
🔑 Authorize middleware called. Required roles: [ 'admin', 'owner' ] - User role: admin
✅ Authorization passed
🎯 CREATE GROUP CALLED
Request body: { name: 'Computer Science Study Group', subject: 'CS 101', ... }
User: { id: '...', email: 'owner@test.com', role: 'admin' }
✅ Validation passed. Creating group...
📝 Group data to save: { name: 'Computer Science Study Group', ... }
🔍 Mongoose connection state: 1
🔍 Database name: campus-link
✅ Group created successfully: { id: '...', name: 'Computer Science Study Group', ... }
🔍 Verification - Group found in DB: YES
🔍 Saved group details: { id: '...', name: 'Computer Science Study Group' }
✅ Group populated. Sending response...
```

---

### STEP 4: Verify in MongoDB

**Check MongoDB Atlas**:
1. Open MongoDB Atlas
2. Navigate to: Clusters → Browse Collections
3. Database: `campus-link`
4. Collections should now include:
   - `users` ✅
   - `groups` ✅ (NEW!)
   - `joinrequests` (created when needed)

**Verify Group Document**:
- Click on `groups` collection
- You should see your newly created group
- It should have:
  - `_id`: ObjectId
  - `name`: "Computer Science Study Group"
  - `subject`: "CS 101"
  - `createdBy`: ObjectId (reference to user)
  - `admins`: [ObjectId]
  - `members`: [ObjectId]
  - `createdAt`: timestamp
  - `updatedAt`: timestamp

---

### STEP 5: List All Groups

**Endpoint**: `GET http://localhost:8080/api/groups`

**Headers**:
```
Authorization: Bearer <YOUR_TOKEN>
```

**Expected Response**:
```json
{
  "success": true,
  "count": 1,
  "groups": [
    {
      "_id": "...",
      "name": "Computer Science Study Group",
      "subject": "CS 101",
      ...
    }
  ]
}
```

---

## 🚨 TROUBLESHOOTING

### Issue: 401 "Not authorized"
- **Cause**: No token or expired token
- **Solution**: Register again or login to get a fresh token

### Issue: 403 "User role 'user' is not authorized"
- **Cause**: User role is still "user", not "admin" or "owner"
- **Solution**: Follow Step 2 to promote the user

### Issue: 500 "Error creating group"
- **Cause**: Check server logs for specific error
- **Solution**: Look for ❌ symbols in the server console

### Issue: Group created but not in MongoDB
- **Cause**: Silent failure (should not happen with current logs)
- **Solution**: Check server logs - if you see "✅ Group created successfully" but "Group found in DB: NO", there's a database write issue

---

## 📊 EXPECTED SERVER LOG FLOW

```
✅ MongoDB Connected: ac-00zjriu-shard-00-00.ekb8q6k.mongodb.net
📊 Database: campus-link
🔌 Connection State: 1 (1 = connected)
📦 Registered Models: [ 'User', 'Group', 'JoinRequest' ]
🔍 Verifying models after connection...
Available models: [ 'User', 'Group', 'JoinRequest' ]
🔍 Database name from mongoose: campus-link
🚀 Server is running on port 8080
📍 Environment: development
🌐 API URL: http://localhost:8080
✅ All systems ready!

[When you create a group]
🔐 Protect middleware called for: POST /api/groups
✅ Token found in header
✅ Token verified. User ID: ...
✅ User authenticated: ...
🔑 Authorize middleware called. Required roles: [ 'admin', 'owner' ] - User role: admin
✅ Authorization passed
🎯 CREATE GROUP CALLED
...
✅ Group created successfully: ...
🔍 Verification - Group found in DB: YES
```

---

## ✅ SUCCESS CRITERIA

1. ✅ Server starts without errors
2. ✅ MongoDB connection established
3. ✅ All models registered (User, Group, JoinRequest)
4. ✅ User can register and get token
5. ✅ Admin/owner can create groups
6. ✅ Group appears in MongoDB `groups` collection
7. ✅ GET /api/groups returns created groups
8. ✅ Server logs show complete flow without errors

---

## 🎯 NEXT STEPS AFTER VERIFICATION

Once you confirm groups are being saved:

1. **Remove debug logs** (optional - they're helpful for debugging)
2. **Test from frontend** (React app)
3. **Verify all group operations**:
   - Create group ✅
   - List groups ✅
   - Join group request
   - Approve/reject requests
   - View group details

---

## 📝 NOTES

- **Port**: Changed to 8080 (update frontend if needed)
- **Database**: `campus-link` on MongoDB Atlas
- **Authentication**: JWT with 30-day expiration
- **Role System**: user → admin → owner
- **Group Creation**: Requires admin or owner role
