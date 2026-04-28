# i18n Developer Guide for Report Fusion

**Last Updated**: July 25, 2025  
**Version**: 1.0  
**For**: React developers working on Report Fusion application

## Table of Contents

1. [Quick Start](#quick-start)
2. [Understanding the i18n System](#understanding-the-i18n-system)
3. [Adding New Translations](#adding-new-translations)
4. [Component Integration](#component-integration)
5. [Best Practices](#best-practices)
6. [Testing i18n Implementation](#testing-i18n-implementation)
7. [Common Patterns](#common-patterns)
8. [Troubleshooting](#troubleshooting)
9. [Tools and Scripts](#tools-and-scripts)

## Quick Start

### 1. Basic Usage in Components

```javascript
import { useLanguage } from '@/contexts/LanguageContext';

const MyComponent = () => {
  const { t, language, setLanguage } = useLanguage();

  return (
    <div>
      <h1>{t('myComponent.title')}</h1>
      <p>{t('myComponent.description')}</p>
      <button onClick={() => setLanguage(language === 'en' ? 'vi' : 'en')}>
        Switch Language
      </button>
    </div>
  );
};
```

### 2. Adding Translation Keys

Edit `/src/contexts/LanguageContext.tsx`:

```javascript
// In enTranslations object
'myComponent.title': 'My Component Title',
'myComponent.description': 'This is a description of my component.',

// In viTranslations object  
'myComponent.title': 'Tiêu đề thành phần của tôi',
'myComponent.description': 'Đây là mô tả về thành phần của tôi.',
```

### 3. Variable Substitution

```javascript
// Translation keys with variables
'user.greeting': 'Hello {name}, you have {count} messages',
'user.greeting': 'Xin chào {name}, bạn có {count} tin nhắn',

// Usage in component
const greeting = t('user.greeting', { name: 'John', count: 5 });
// Result: "Hello John, you have 5 messages"
```

## Understanding the i18n System

### Architecture Overview

The Report Fusion i18n system is built on React Context and consists of:

1. **LanguageContext** (`/src/contexts/LanguageContext.tsx`)
   - Central translation store
   - Language switching logic
   - Translation function (`t`)

2. **Translation Objects**
   - `enTranslations`: English translations (~1,342 keys)
   - `viTranslations`: Vietnamese translations (~1,342 keys)

3. **useLanguage Hook**
   - Access to current language
   - Language switching function
   - Translation function

### File Structure

```
src/
├── contexts/
│   └── LanguageContext.tsx      # Main i18n implementation
├── utils/
│   └── testTranslations.js      # Testing utilities
└── components/
    └── LanguageToggle.tsx       # Language switching UI
```

### Supported Languages

- **English (`en`)**: Default fallback language
- **Vietnamese (`vi`)**: Primary user language (default)

## Adding New Translations

### Step 1: Identify Translatable Content

Look for hardcoded English strings in your components:

```javascript
// ❌ Bad - Hardcoded string
<h1>Report Dashboard</h1>
<button>Create New Report</button>
<p>No reports found. Please create a new report to get started.</p>

// ✅ Good - Using translation keys  
<h1>{t('dashboard.title')}</h1>
<button>{t('dashboard.createNew')}</button>
<p>{t('dashboard.emptyState')}</p>
```

### Step 2: Create Translation Keys

Follow the hierarchical naming convention:

```javascript
// Pattern: [page/component].[section].[element]
'dashboard.title': 'Report Dashboard',
'dashboard.createNew': 'Create New Report', 
'dashboard.emptyState': 'No reports found. Please create a new report to get started.',

// Vietnamese translations
'dashboard.title': 'Bảng điều khiển báo cáo',
'dashboard.createNew': 'Tạo báo cáo mới',
'dashboard.emptyState': 'Không tìm thấy báo cáo. Vui lòng tạo báo cáo mới để bắt đầu.',
```

### Step 3: Add Keys to Translation Files

Edit `/src/contexts/LanguageContext.tsx`:

1. Find the `enTranslations` object
2. Add your English keys in alphabetical order within their section
3. Find the `viTranslations` object  
4. Add corresponding Vietnamese translations
5. Ensure both objects have identical keys

### Step 4: Update Component

```javascript
import { useLanguage } from '@/contexts/LanguageContext';

const Dashboard = () => {
  const { t } = useLanguage();

  return (
    <div>
      <h1>{t('dashboard.title')}</h1>
      <button>{t('dashboard.createNew')}</button>
      {reports.length === 0 && (
        <p>{t('dashboard.emptyState')}</p>
      )}
    </div>
  );
};
```

## Component Integration

### Basic Integration

```javascript
import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';

const MyComponent = () => {
  const { t } = useLanguage();

  return (
    <div>
      <h2>{t('myComponent.title')}</h2>
      <p>{t('myComponent.description')}</p>
    </div>
  );
};

export default MyComponent;
```

### Integration with Forms

```javascript
import { useLanguage } from '@/contexts/LanguageContext';

const ContactForm = () => {
  const { t } = useLanguage();

  return (
    <form>
      <label htmlFor="name">{t('form.nameLabel')}</label>
      <input 
        id="name"
        placeholder={t('form.namePlaceholder')}
      />
      
      <label htmlFor="email">{t('form.emailLabel')}</label>
      <input 
        id="email"
        placeholder={t('form.emailPlaceholder')}
      />
      
      <button type="submit">{t('form.submitButton')}</button>
    </form>
  );
};
```

### Integration with Toast Messages

```javascript
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/contexts/LanguageContext';

const DeleteComponent = () => {
  const { toast } = useToast();
  const { t } = useLanguage();

  const handleDelete = async () => {
    try {
      await deleteItem();
      toast({
        title: t('delete.success.title'),
        description: t('delete.success.description'),
      });
    } catch (error) {
      toast({
        title: t('delete.error.title'),
        description: t('delete.error.description'),
        variant: 'destructive',
      });
    }
  };
};
```

## Best Practices

### 1. Translation Key Naming

#### ✅ Good Naming Patterns
```javascript
// Hierarchical structure
'page.section.element'
'dashboard.reports.createButton'
'settings.profile.emailLabel' 

// Semantic meaning
'user.validation.emailRequired'
'report.status.published'
'navigation.menu.dashboard'

// Action-based for buttons
'button.save'
'button.cancel'
'button.delete'
```

#### ❌ Bad Naming Patterns
```javascript
// Too generic
'text1'
'button2'
'message'

// Non-semantic
'dashboardText'
'redButton'
'bigTitle'

// Inconsistent structure
'dashboard_title'      // mixing conventions
'DashboardButton'      // wrong case
'dashboard-menu-item'  // inconsistent separator
```

### 2. Variable Substitution

#### ✅ Good Variable Usage
```javascript
// Translation keys
'user.itemCount': 'You have {count} {itemType}',
'error.fileSize': 'File {filename} is too large ({size}MB). Maximum size is {maxSize}MB.',

// Component usage
t('user.itemCount', { count: 5, itemType: 'reports' })
t('error.fileSize', { filename: 'document.pdf', size: 15, maxSize: 10 })
```

#### ❌ Bad Variable Usage
```javascript
// Don't concatenate translations
t('user.greeting') + ' ' + userName + '!'  // ❌

// Don't use complex objects as variables
t('message', { user: { name: 'John', role: 'admin' } })  // ❌

// Use proper variable substitution
t('user.greeting', { name: userName })  // ✅
```

### 3. Handling Pluralization

```javascript
// For simple cases, use conditional logic
const itemCount = items.length;
const message = itemCount === 1 
  ? t('item.single', { count: itemCount })
  : t('item.plural', { count: itemCount });

// Translation keys
'item.single': 'You have {count} item',
'item.plural': 'You have {count} items',
'item.single': 'Bạn có {count} mục',      // Vietnamese
'item.plural': 'Bạn có {count} mục',      // Vietnamese (same form)
```

### 4. Long Text and Content

```javascript
// For long content, break into logical sections
'about.mission.title': 'Our Mission',
'about.mission.content': 'We strive to provide the best reporting platform...',
'about.vision.title': 'Our Vision', 
'about.vision.content': 'To become the leading solution for collaborative reporting...',

// Don't put entire paragraphs in single keys
'about.longText': 'Our Mission: We strive... Our Vision: To become...'  // ❌
```

## Testing i18n Implementation

### 1. Manual Testing Checklist

```javascript
// Test each component
const TestChecklist = () => {
  const { language, setLanguage } = useLanguage();
  
  return (
    <div>
      <h3>Manual i18n Testing</h3>
      <ul>
        <li>✅ Switch to Vietnamese - all text updates</li>
        <li>✅ Switch to English - all text updates</li>
        <li>✅ Refresh page - language persists</li>
        <li>✅ No hardcoded English text visible</li>
        <li>✅ Layout doesn't break with longer Vietnamese text</li>
        <li>✅ Variable substitution works correctly</li>
      </ul>
    </div>
  );
};
```

### 2. Automated Testing

```javascript
// Component test example
import { render, screen } from '@testing-library/react';
import { LanguageProvider } from '@/contexts/LanguageContext';
import MyComponent from './MyComponent';

test('component renders with correct translations', () => {
  render(
    <LanguageProvider>
      <MyComponent />
    </LanguageProvider>
  );
  
  // Test that translation keys are used, not hardcoded text
  expect(screen.getByText(/dashboard\.title/)).not.toBeInTheDocument();
  
  // Test that actual translations appear
  expect(screen.getByText('Report Dashboard')).toBeInTheDocument();
});
```

### 3. Using Testing Tools

```bash
# Run hardcoded string detection
node scripts/findHardcodedStrings.js

# Run translation coverage tests
npm test -- --testPathPattern=i18n

# Check for missing translation keys
node -e "import('./src/utils/testTranslations.js').then(m => console.log(m.default()))"
```

## Common Patterns

### 1. Conditional Content Based on Language

```javascript
const ConditionalContent = () => {
  const { language, t } = useLanguage();
  
  return (
    <div>
      <h1>{t('welcome.title')}</h1>
      
      {/* Language-specific content */}
      {language === 'vi' && (
        <p className="text-sm text-gray-600">
          Hệ thống hỗ trợ tiếng Việt hoàn toàn
        </p>
      )}
      
      {language === 'en' && (
        <p className="text-sm text-gray-600">
          Full English language support available
        </p>
      )}
    </div>
  );
};
```

### 2. Dynamic Content with Variables

```javascript
const DynamicContent = ({ user, reportCount }) => {
  const { t } = useLanguage();
  
  return (
    <div>
      <h2>{t('dashboard.welcome', { name: user.name })}</h2>
      <p>{t('dashboard.reportCount', { count: reportCount })}</p>
      
      {/* Date formatting - consider locale */}
      <p>{t('dashboard.lastLogin', { 
        date: new Date(user.lastLogin).toLocaleDateString(
          language === 'vi' ? 'vi-VN' : 'en-US'
        )
      })}</p>
    </div>
  );
};
```

### 3. Error Handling with i18n

```javascript
const ErrorHandling = () => {
  const { t } = useLanguage();
  const [error, setError] = useState(null);
  
  const handleAction = async () => {
    try {
      await performAction();
    } catch (err) {
      // Translate error messages
      const errorMessage = err.code 
        ? t(`errors.${err.code}`)
        : t('errors.generic');
        
      setError(errorMessage);
    }
  };
  
  return (
    <div>
      {error && (
        <div className="error">
          {error}
        </div>
      )}
    </div>
  );
};
```

### 4. Loading States

```javascript
const LoadingComponent = () => {
  const { t } = useLanguage();
  const [loading, setLoading] = useState(true);
  
  if (loading) {
    return <div>{t('common.loading')}</div>;
  }
  
  return (
    <div>
      {/* Component content */}
    </div>
  );
};
```

## Troubleshooting

### Common Issues and Solutions

#### 1. Missing Translation Key

**Problem**: Translation key not found, showing key instead of text

```javascript
// Shows: "dashboard.newTitle" instead of translated text
<h1>{t('dashboard.newTitle')}</h1>
```

**Solution**:
1. Check if key exists in both `enTranslations` and `viTranslations`
2. Verify key spelling matches exactly
3. Ensure key is in correct hierarchical section

#### 2. Variable Substitution Not Working

**Problem**: Variables showing as `{variableName}` in rendered text

```javascript
// Shows: "Hello {name}" instead of "Hello John"
t('greeting', { name: 'John' })
```

**Solution**:
1. Check translation key has correct variable syntax: `{variableName}`
2. Ensure variable names match exactly in translation and usage
3. Verify variables are passed as object: `{ name: 'John' }`

#### 3. Language Not Persisting

**Problem**: Language resets to default on page refresh

**Solution**:
1. Check localStorage is working in browser
2. Verify `setLanguage` function is called properly
3. Check for localStorage permissions/privacy settings

#### 4. Layout Breaking with Vietnamese Text

**Problem**: Vietnamese text is longer and breaks component layout

**Solution**:
1. Use flexible CSS layouts (flexbox, grid)
2. Test with longer Vietnamese translations
3. Set appropriate `min-width` and `max-width` constraints
4. Use `overflow-wrap: break-word` for long words

#### 5. Component Not Re-rendering on Language Change

**Problem**: Text doesn't update when language is switched

**Solution**:
1. Ensure component is wrapped in `LanguageProvider`
2. Use `useLanguage()` hook inside component
3. Check that `t()` function is called in render, not in useEffect/useState

## Tools and Scripts

### 1. Hardcoded String Detection

```bash
# Run hardcoded string scanner
node scripts/findHardcodedStrings.js

# Output: Detailed report of all hardcoded strings
# Creates: hardcoded-strings-report.json
```

### 2. Translation Coverage Testing

```javascript
// Run in browser console or Node.js
import testTranslations from './src/utils/testTranslations.js';

const results = testTranslations();
console.log('Missing Vietnamese keys:', results.issues.missingInVietnamese);
console.log('Missing English keys:', results.issues.missingInEnglish);
```

### 3. Browser Testing Utilities

```javascript
// Add to browser console for manual testing
window.i18nTest = {
  switchLanguage: (lang) => {
    localStorage.setItem('language', lang);
    window.location.reload();
  },
  getCurrentLanguage: () => localStorage.getItem('language'),
  testAllKeys: () => {
    // Custom implementation to test visible translation keys
  }
};

// Usage
i18nTest.switchLanguage('vi');
i18nTest.switchLanguage('en');
```

### 4. VS Code Snippets

Add to your VS Code snippets for faster development:

```json
{
  "i18n useLanguage": {
    "prefix": "i18n",
    "body": [
      "import { useLanguage } from '@/contexts/LanguageContext';",
      "",
      "const { t } = useLanguage();"
    ],
    "description": "Import and use i18n hook"
  },
  "i18n translate": {
    "prefix": "t",
    "body": [
      "{t('${1:translation.key}')}"
    ],
    "description": "Translation function call"
  }
}
```

## Migration Guide for Existing Components

### Step 1: Assessment

1. Run hardcoded string detection on your component
2. Identify all user-facing text
3. Plan translation key structure

### Step 2: Add i18n Hook

```javascript
// Before
const MyComponent = () => {
  return <h1>My Component</h1>;
};

// After
import { useLanguage } from '@/contexts/LanguageContext';

const MyComponent = () => {
  const { t } = useLanguage();
  return <h1>{t('myComponent.title')}</h1>;
};
```

### Step 3: Extract Strings to Translation Keys

```javascript
// Create systematic mapping
const translationMapping = {
  'Create New Report': 'reports.createNew',
  'Edit Report': 'reports.edit', 
  'Delete Report': 'reports.delete',
  'Are you sure?': 'common.confirmDelete',
};
```

### Step 4: Add Translation Keys

Add all keys to both `enTranslations` and `viTranslations` in `LanguageContext.tsx`.

### Step 5: Test

1. Switch languages and verify all text updates
2. Check layout doesn't break
3. Test variable substitution if used
4. Run automated tests

## Performance Considerations

### Bundle Size

- Translation data adds ~50KB to bundle
- Consider code splitting for very large translation sets
- Keys are loaded synchronously - no async loading needed

### Runtime Performance

- Language switching is immediate (<100ms)
- Translation function `t()` has minimal overhead
- No performance impact on component rendering

### Memory Usage

- Translation objects consume ~1MB memory
- No memory leaks with frequent language switching
- Context re-renders efficiently

## Contributing Guidelines

### Before Adding New Translations

1. Run hardcoded string detection to identify all strings
2. Plan consistent key naming structure
3. Consider variable substitution needs
4. Write tests for your translations

### Translation Quality Standards

1. **Accuracy**: Ensure Vietnamese translations are accurate and natural
2. **Consistency**: Use consistent terminology across the application  
3. **Context**: Provide enough context for translators
4. **Completeness**: Always add both English and Vietnamese keys

### Code Review Checklist

- [ ] No hardcoded strings in component
- [ ] Translation keys follow naming convention
- [ ] Both English and Vietnamese keys added
- [ ] Variable substitution tested
- [ ] Layout tested with longer Vietnamese text
- [ ] Component tests include i18n scenarios

---

This developer guide provides comprehensive guidance for implementing and maintaining internationalization in the Report Fusion application. For questions or issues, refer to the test results report or create an issue in the project repository.