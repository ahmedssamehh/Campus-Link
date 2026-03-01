# Quick Test Commands (cURL)

## 🚀 Quick Backend Test Using cURL or PowerShell

### Option 1: Using PowerShell (Recommended for Windows)

#### 1. Register User
```powershell
$registerBody = @{
    name = "Test Admin"
    email = "admin@test.com"
    password = "password123"
} | ConvertTo-Json

$response = Invoke-RestMethod -Uri "http://localhost:8080/api/auth/register" -Method Post -Body $registerBody -ContentType "application/json"

# Save token
$token = $response.token
Write-Host "Token: $token"
Write-Host "User Role: $($response.user.role)"
```

#### 2. Create Group (After promoting user to admin in MongoDB)
```powershell
$groupBody = @{
    name = "PowerShell Test Group"
    subject = "Backend Testing"
    description = "Testing from PowerShell"
} | ConvertTo-Json

$headers = @{
    "Authorization" = "Bearer $token"
    "Content-Type" = "application/json"
}

$groupResponse = Invoke-RestMethod -Uri "http://localhost:8080/api/groups" -Method Post -Body $groupBody -Headers $headers

Write-Host "Group Created: $($groupResponse.group.name)"
Write-Host "Group ID: $($groupResponse.group._id)"
```

#### 3. List All Groups
```powershell
$headers = @{
    "Authorization" = "Bearer $token"
}

$groups = Invoke-RestMethod -Uri "http://localhost:8080/api/groups" -Method Get -Headers $headers

Write-Host "Total Groups: $($groups.count)"
$groups.groups | ForEach-Object { Write-Host "- $($_.name) ($($_.subject))" }
```

---

### Option 2: Using cURL (Cross-platform)

#### 1. Register User
```bash
curl -X POST http://localhost:8080/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Admin",
    "email": "admin@test.com",
    "password": "password123"
  }'

# Save the token from response
```

#### 2. Create Group (Replace <TOKEN> with actual token)
```bash
curl -X POST http://localhost:8080/api/groups \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <TOKEN>" \
  -d '{
    "name": "cURL Test Group",
    "subject": "Backend Testing",
    "description": "Testing from cURL"
  }'
```

#### 3. List All Groups
```bash
curl -X GET http://localhost:8080/api/groups \
  -H "Authorization: Bearer <TOKEN>"
```

---

### Option 3: Complete PowerShell Test Script

Save as `test-backend.ps1`:

```powershell
# Campus Link Backend Test Script

Write-Host "🧪 Starting Backend Test..." -ForegroundColor Cyan

# Test 1: Register User
Write-Host "`n1️⃣ Registering user..." -ForegroundColor Yellow

$registerBody = @{
    name = "Test Admin User"
    email = "testadmin@campuslink.com"
    password = "SecurePassword123"
} | ConvertTo-Json

try {
    $registerResponse = Invoke-RestMethod -Uri "http://localhost:8080/api/auth/register" -Method Post -Body $registerBody -ContentType "application/json"
    $token = $registerResponse.token
    $userId = $registerResponse.user._id
    
    Write-Host "✅ User registered successfully" -ForegroundColor Green
    Write-Host "   User ID: $userId"
    Write-Host "   Email: $($registerResponse.user.email)"
    Write-Host "   Role: $($registerResponse.user.role)"
    Write-Host "   Token: $($token.Substring(0, 20))..."
    
} catch {
    Write-Host "❌ Registration failed: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Manual Step
Write-Host "`n⚠️ MANUAL STEP REQUIRED:" -ForegroundColor Yellow
Write-Host "   1. Open MongoDB Compass or Atlas"
Write-Host "   2. Connect to: mongodb+srv://CampusLink:Campuslink000@campuslink.ekb8q6k.mongodb.net/"
Write-Host "   3. Navigate to database: campus-link -> collection: users"
Write-Host "   4. Find user: testadmin@campuslink.com"
Write-Host "   5. Change role from 'user' to 'admin'"
Write-Host "   6. Press Enter when done..." -ForegroundColor Cyan
Read-Host

# Test 2: Create Group
Write-Host "`n2️⃣ Creating study group..." -ForegroundColor Yellow

$groupBody = @{
    name = "Computer Science Study Group"
    subject = "CS 101"
    description = "A comprehensive study group for CS fundamentals"
} | ConvertTo-Json

$headers = @{
    "Authorization" = "Bearer $token"
    "Content-Type" = "application/json"
}

try {
    $groupResponse = Invoke-RestMethod -Uri "http://localhost:8080/api/groups" -Method Post -Body $groupBody -Headers $headers
    
    Write-Host "✅ Group created successfully" -ForegroundColor Green
    Write-Host "   Group ID: $($groupResponse.group._id)"
    Write-Host "   Name: $($groupResponse.group.name)"
    Write-Host "   Subject: $($groupResponse.group.subject)"
    Write-Host "   Members: $($groupResponse.group.members.Count)"
    
} catch {
    Write-Host "❌ Group creation failed: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.ErrorDetails.Message) {
        $errorDetails = $_.ErrorDetails.Message | ConvertFrom-Json
        Write-Host "   Error: $($errorDetails.message)" -ForegroundColor Red
    }
    exit 1
}

# Test 3: List Groups
Write-Host "`n3️⃣ Fetching all groups..." -ForegroundColor Yellow

$headers = @{
    "Authorization" = "Bearer $token"
}

try {
    $listResponse = Invoke-RestMethod -Uri "http://localhost:8080/api/groups" -Method Get -Headers $headers
    
    Write-Host "✅ Groups fetched successfully" -ForegroundColor Green
    Write-Host "   Total Groups: $($listResponse.count)"
    Write-Host "`n   Groups:"
    $listResponse.groups | ForEach-Object {
        Write-Host "   - $($_.name) ($($_.subject))" -ForegroundColor Cyan
        Write-Host "     Members: $($_.members.Count), Created: $($_.createdAt)"
    }
    
} catch {
    Write-Host "❌ Failed to fetch groups: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Final Verification
Write-Host "`n🔍 Final Verification Steps:" -ForegroundColor Cyan
Write-Host "1. Check MongoDB Atlas:"
Write-Host "   - Collections: campus-link should have 'users' and 'groups'"
Write-Host "   - Groups collection should contain your test group"
Write-Host "`n2. Check Server Logs:"
Write-Host "   - Look for: '✅ Group created successfully'"
Write-Host "   - Look for: '🔍 Verification - Group found in DB: YES'"
Write-Host "`n✅ Backend test completed!" -ForegroundColor Green
```

Run with:
```powershell
.\test-backend.ps1
```

---

## 🎯 What to Look For

### In Server Logs:
```
🔐 Protect middleware called for: POST /api/groups
✅ Token found in header
✅ Token verified. User ID: ...
✅ User authenticated: { id: '...', email: 'admin@test.com', role: 'admin' }
🔑 Authorize middleware called. Required roles: [ 'admin', 'owner' ] - User role: admin
✅ Authorization passed
🎯 CREATE GROUP CALLED
Request body: { name: 'Test Group', ... }
✅ Validation passed. Creating group...
📝 Group data to save: { ... }
🔍 Mongoose connection state: 1
🔍 Database name: campus-link
✅ Group created successfully: { id: '...', name: 'Test Group' }
🔍 Verification - Group found in DB: YES
✅ Group populated. Sending response...
```

### In MongoDB Atlas:
- Database: `campus-link`
- Collection: `groups` (should exist)
- Documents: Your created groups should be visible

---

## 🚨 Common Issues

### 401 Error
```json
{
  "success": false,
  "message": "Not authorized to access this route. No token provided."
}
```
**Solution**: Make sure you're including the token in Authorization header

### 403 Error
```json
{
  "success": false,
  "message": "User role 'user' is not authorized to access this route"
}
```
**Solution**: Promote user to 'admin' or 'owner' in MongoDB

### 400 Error
```json
{
  "success": false,
  "message": "Please provide group name and subject"
}
```
**Solution**: Make sure request body includes `name` and `subject` fields

---

## 📊 Expected Response Examples

### Successful Registration:
```json
{
  "success": true,
  "message": "User registered successfully",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "_id": "675abc123...",
    "name": "Test Admin",
    "email": "admin@test.com",
    "role": "user",
    "createdAt": "2026-02-28T...",
    "updatedAt": "2026-02-28T..."
  }
}
```

### Successful Group Creation:
```json
{
  "success": true,
  "message": "Group created successfully",
  "group": {
    "_id": "675def456...",
    "name": "Computer Science Study Group",
    "subject": "CS 101",
    "description": "A comprehensive study group...",
    "createdBy": {
      "_id": "675abc123...",
      "name": "Test Admin",
      "email": "admin@test.com"
    },
    "admins": ["675abc123..."],
    "members": ["675abc123..."],
    "createdAt": "2026-02-28T...",
    "updatedAt": "2026-02-28T..."
  }
}
```

### Successful Group List:
```json
{
  "success": true,
  "count": 1,
  "groups": [
    {
      "_id": "675def456...",
      "name": "Computer Science Study Group",
      "subject": "CS 101",
      "description": "...",
      "createdBy": { ... },
      "admins": [...],
      "members": [...],
      "createdAt": "...",
      "updatedAt": "..."
    }
  ]
}
```

---

**Quick Start**: Run the PowerShell test script above for automated testing!
