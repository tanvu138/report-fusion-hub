# Issue #3: Implement Backend API Error Message Internationalization

## 🌐 Overview
Implement internationalization for backend API error messages to provide localized error responses to frontend users. This will complete the full-stack i18n implementation for the TPG Reports application.

## 🎯 Objectives
- Create backend i18n infrastructure for API error messages
- Internationalize all user-facing server error responses
- Ensure error messages are properly localized based on client language preference

## 📋 Current State Analysis

### Backend Hardcoded Strings Identified

#### **Authentication & Authorization** (`middleware/auth.js`, `middleware/temp-auth.js`)
```javascript
// Current hardcoded messages:
"Authentication required. No token provided."
"Authentication required"
"User not found" 
"Token expired"
"Invalid token"
"Insufficient permissions"
"Section not found"
"You can only edit sections for your department"
```

#### **User Management** (`controllers/userController.js`, `services/userService.js`)
```javascript
// Validation and error messages:
"Username is required and must be a non-empty string."
"Name is required and must be a non-empty string."
"User not found."
"Failed to create user."
"Failed to update user."
"Password must be at least 6 characters long."
// ... (40+ more messages identified)
```

#### **Report Management** (`controllers/reportController.js`)
```javascript
// Business logic error messages:
"Template not found"
"Template is not active"
"A report with similar details already exists"
"Report not found"
"Cannot add sections to finalized report"
"You do not have access to this report"
// ... (20+ more messages identified)
```

#### **File Upload & Images** (`routes/upload.js`, `routes/reportImages.js`)
```javascript
// File handling error messages:
"File too large. Maximum size is 5MB."
"File type not allowed"
"Image not found."
"Invalid filename."
"Access denied to this resource"
// ... (15+ more messages identified)
```

## 🏗️ Implementation Plan

### Phase 1: Backend i18n Infrastructure

#### 1.1 Create Translation System
```javascript
// server/utils/i18n.js
const translations = {
  en: {
    // Authentication errors
    'auth.required': 'Authentication required',
    'auth.tokenExpired': 'Token expired',
    'auth.invalidToken': 'Invalid token',
    'auth.userNotFound': 'User not found',
    'auth.insufficientPermissions': 'Insufficient permissions',
    
    // User management errors  
    'user.usernameRequired': 'Username is required and must be a non-empty string',
    'user.nameRequired': 'Name is required and must be a non-empty string',
    'user.notFound': 'User not found',
    'user.createFailed': 'Failed to create user',
    'user.updateFailed': 'Failed to update user',
    'user.passwordTooShort': 'Password must be at least 6 characters long',
    
    // Report management errors
    'report.templateNotFound': 'Template not found',
    'report.templateInactive': 'Template is not active',
    'report.duplicateExists': 'A report with similar details already exists',
    'report.notFound': 'Report not found',
    'report.cannotAddSections': 'Cannot add sections to finalized report',
    'report.accessDenied': 'You do not have access to this report',
    
    // File upload errors
    'file.tooLarge': 'File too large. Maximum size is 5MB',
    'file.typeNotAllowed': 'File type not allowed',
    'file.imageNotFound': 'Image not found',
    'file.invalidFilename': 'Invalid filename',
    'file.accessDenied': 'Access denied to this resource'
  },
  vi: {
    // Vietnamese translations
    'auth.required': 'Yêu cầu xác thực',
    'auth.tokenExpired': 'Token đã hết hạn',
    'auth.invalidToken': 'Token không hợp lệ',
    'auth.userNotFound': 'Không tìm thấy người dùng',
    'auth.insufficientPermissions': 'Không đủ quyền truy cập',
    
    'user.usernameRequired': 'Tên đăng nhập là bắt buộc và phải là chuỗi không rỗng',
    'user.nameRequired': 'Tên là bắt buộc và phải là chuỗi không rỗng',
    'user.notFound': 'Không tìm thấy người dùng',
    'user.createFailed': 'Tạo người dùng thất bại',
    'user.updateFailed': 'Cập nhật người dùng thất bại',
    'user.passwordTooShort': 'Mật khẩu phải có ít nhất 6 ký tự',
    
    'report.templateNotFound': 'Không tìm thấy mẫu',
    'report.templateInactive': 'Mẫu không hoạt động',
    'report.duplicateExists': 'Đã tồn tại báo cáo với thông tin tương tự',
    'report.notFound': 'Không tìm thấy báo cáo',
    'report.cannotAddSections': 'Không thể thêm phần vào báo cáo đã hoàn thiện',
    'report.accessDenied': 'Bạn không có quyền truy cập báo cáo này',
    
    'file.tooLarge': 'File quá lớn. Kích thước tối đa là 5MB',
    'file.typeNotAllowed': 'Loại file không được phép',
    'file.imageNotFound': 'Không tìm thấy hình ảnh',
    'file.invalidFilename': 'Tên file không hợp lệ',
    'file.accessDenied': 'Từ chối truy cập tài nguyên này'
  }
};

function t(key, language = 'en', variables = {}) {
  let text = translations[language]?.[key] || translations.en[key] || key;
  
  // Variable substitution
  if (variables) {
    Object.entries(variables).forEach(([varKey, value]) => {
      text = text.replace(new RegExp(`\\{${varKey}\\}`, 'g'), String(value));
    });
  }
  
  return text;
}

module.exports = { t };
```

#### 1.2 Language Detection Middleware
```javascript
// server/middleware/language.js
const detectLanguage = (req, res, next) => {
  // Priority: 1. Query param, 2. Header, 3. Default
  const language = req.query.lang || 
                  req.headers['accept-language']?.includes('vi') ? 'vi' : 'en' ||
                  'en';
  
  req.language = language;
  next();
};

module.exports = { detectLanguage };
```

### Phase 2: Update Controllers and Middleware

#### 2.1 Authentication Middleware Updates
**File**: `server/middleware/auth.js`
```javascript
// Before:
return res.status(401).json({ error: 'Authentication required' });

// After:
const { t } = require('../utils/i18n');
return res.status(401).json({ 
  error: t('auth.required', req.language) 
});
```

#### 2.2 User Controller Updates  
**File**: `server/controllers/userController.js`
```javascript
// Pattern for all user-related errors:
const { t } = require('../utils/i18n');

// Before:
return res.status(400).json({ error: 'User not found' });

// After:
return res.status(400).json({ 
  error: t('user.notFound', req.language)
});
```

#### 2.3 Report Controller Updates
**File**: `server/controllers/reportController.js`
```javascript
// Pattern for report-related errors:
const { t } = require('../utils/i18n');

// Before:
return res.status(404).json({ error: 'Report not found' });

// After:
return res.status(404).json({ 
  error: t('report.notFound', req.language)
});
```

## 📁 Files to Modify

### Core Infrastructure Files (Create):
1. `server/utils/i18n.js` - Translation utility
2. `server/middleware/language.js` - Language detection middleware

### Controllers to Update:
3. `server/middleware/auth.js`
4. `server/middleware/temp-auth.js`
5. `server/controllers/userController.js`
6. `server/services/userService.js`
7. `server/controllers/departmentController.js`
8. `server/services/departmentService.js`
9. `server/controllers/reportController.js`
10. `server/controllers/reportTemplateController.js`
11. `server/controllers/sectionController.js`
12. `server/controllers/templatePackController.js`
13. `server/controllers/authController.js`
14. `server/controllers/sharedReportController.js`
15. `server/controllers/exportController.js`
16. `server/controllers/templateController.js`
17. `server/routes/upload.js`
18. `server/routes/reportImages.js`

### Application Setup:
19. `server/app.js` - Add language detection middleware

## 🔧 Implementation Steps

### Step 1: Create Infrastructure (1 hour)
1. Create `server/utils/i18n.js` with translation function
2. Create `server/middleware/language.js` for language detection
3. Add language middleware to `server/app.js`

### Step 2: Update Authentication (30 minutes)
1. Update `server/middleware/auth.js`
2. Update `server/middleware/temp-auth.js`
3. Replace 8 hardcoded auth error messages

### Step 3: Update User Management (1 hour)
1. Update `server/controllers/userController.js`
2. Update `server/services/userService.js`
3. Replace ~25 hardcoded user error messages

### Step 4: Update Report Management (1.5 hours)
1. Update all report-related controllers
2. Replace ~35 hardcoded report error messages

### Step 5: Update File Upload (30 minutes)
1. Update upload routes
2. Replace ~15 hardcoded file error messages

### Step 6: Testing & Validation (1 hour)
1. Test API responses with different language headers
2. Verify frontend receives localized errors
3. Test error handling across all endpoints

## ✅ Acceptance Criteria

- [ ] Backend i18n infrastructure created and working
- [ ] Language detection middleware implemented
- [ ] All authentication error messages internationalized
- [ ] All user management error messages internationalized
- [ ] All report management error messages internationalized
- [ ] All file upload error messages internationalized
- [ ] API responses respect `Accept-Language` header
- [ ] Frontend receives localized error messages
- [ ] No hardcoded user-facing error strings remain in backend
- [ ] Vietnamese translations are accurate and natural

## 🧪 Testing Strategy

### Manual Testing:
```bash
# Test with English (default)
curl -X POST http://localhost:8945/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"invalid","password":"invalid"}'

# Test with Vietnamese
curl -X POST http://localhost:8945/api/auth/login \
  -H "Content-Type: application/json" \
  -H "Accept-Language: vi" \
  -d '{"username":"invalid","password":"invalid"}'

# Test with query parameter
curl -X POST http://localhost:8945/api/auth/login?lang=vi \
  -H "Content-Type: application/json" \
  -d '{"username":"invalid","password":"invalid"}'
```

### Frontend Integration Testing:
1. Set frontend language to Vietnamese
2. Trigger various error conditions
3. Verify error messages display in Vietnamese
4. Test error handling in forms, uploads, and API calls

## 📚 Reference Materials

- **Frontend i18n Pattern**: `src/contexts/LanguageContext.tsx`
- **Translation Key Structure**: Dot notation (e.g., `auth.required`)
- **Variable Substitution**: `{variableName}` pattern
- **HTTP Status Codes**: Maintain existing status codes
- **Error Response Format**: Keep existing JSON structure

## 🎯 Priority
**Medium** - Enhances user experience but not critical for core functionality

---
**Estimated Time**: 5-6 hours  
**Skills Required**: Node.js, Express.js, i18n patterns, API design  
**Dependencies**: None

## 💡 Implementation Notes

1. **Maintain API Compatibility**: Keep existing error response structure
2. **Performance**: Translation function should be lightweight
3. **Fallback Strategy**: Always fall back to English if translation missing
4. **Consistency**: Use same key naming convention as frontend
5. **Testing**: Create comprehensive test cases for both languages

## 🔄 Future Enhancements (Optional)

- Add more languages (French, Spanish, etc.)
- Implement pluralization support
- Add date/time localization for error messages
- Create admin interface for managing backend translations