# Issue #2: Internationalize Form and Filter Components

## 🌐 Overview
Complete internationalization of form and filter components to provide localized user experience for data entry, search, and filtering operations across the application.

## 🎯 Objectives
- Internationalize form labels, placeholders, and validation messages
- Localize filter options and sort controls
- Ensure consistent user experience across all form interactions

## 📋 Components to Update

### 1. **TemplateFilters.tsx** (`src/components/ui/`)
**Hardcoded strings to translate:**
- `"Search templates..."` → `t('templateFilters.searchPlaceholder')`
- `"All Departments"` → `t('templateFilters.allDepartments')`
- `"Sort Options"` → `t('templateFilters.sortOptions')`
- `"Name"` → `t('templateFilters.sortBy.name')`
- `"Date Modified"` → `t('templateFilters.sortBy.dateModified')`
- `"Section Count"` → `t('templateFilters.sortBy.sectionCount')`
- `"Ascending"` → `t('templateFilters.sortOrder.ascending')`
- `"Descending"` → `t('templateFilters.sortOrder.descending')`

### 2. **UserFilters.tsx** (`src/components/ui/`)
**Hardcoded strings to translate:**
- `"Search users by name, username, or email..."` → `t('userFilters.searchPlaceholder')`
- `"All Roles"` → `t('userFilters.allRoles')`
- `"All Departments"` → `t('userFilters.allDepartments')`
- Sort field labels:
  - `"Name"` → `t('userFilters.sortBy.name')`
  - `"Username"` → `t('userFilters.sortBy.username')`
  - `"Role"` → `t('userFilters.sortBy.role')`
  - `"Department"` → `t('userFilters.sortBy.department')`
  - `"Date Created"` → `t('userFilters.sortBy.dateCreated')`

### 3. **Form Components with Missing Translations**
Search for and update components containing these patterns:

#### **Template Creation Dialogs**
- `"Enter template name"` → `t('forms.templateNamePlaceholder')`
- `"Optional description"` → `t('forms.descriptionPlaceholder')`
- `"Select a department"` → `t('forms.selectDepartment')`
- `"Template Name"` → `t('forms.templateName')`
- `"Description"` → `t('forms.description')`
- `"Instructions"` → `t('forms.instructions')`

#### **User Creation/Edit Dialogs**
- `"Leave blank to keep unchanged"` → `t('forms.passwordPlaceholder')`

### 4. **Loading States and Error Messages**
Find and update components with these patterns:
- `"Loading user..."` → `t('loading.user')`
- `"Loading reports..."` → `t('loading.reports')`
- `"Loading templates..."` → `t('loading.templates')`
- `"No changes detected"` → `t('error.noChangesDetected')`

### 5. **Toast Messages Across Components**
Search for and update hardcoded toast messages:
- `"Content Saved"` → `t('toast.contentSaved')`
- `"Template Created"` → `t('toast.templateCreated')`
- `"User Updated"` → `t('toast.userUpdated')`
- `"Auto-saved"` → `t('toast.autoSaved')`
- `"Update Failed"` → `t('toast.updateFailed')`
- `"Assignment Failed"` → `t('toast.assignmentFailed')`
- `"Auto-save failed"` → `t('toast.autoSaveFailed')`
- `"Section Duplicated"` → `t('toast.sectionDuplicated')`
- `"Sections Assigned"` → `t('toast.sectionsAssigned')`
- `"Password Reset Successful"` → `t('toast.passwordResetSuccessful')`

## 🔍 Search Strategy

Use these Grep commands to find remaining hardcoded strings:

```bash
# Find hardcoded placeholders
grep -r "placeholder=" src/ --include="*.tsx" | grep -v "t("

# Find hardcoded form labels
grep -r "Search\|Filter\|Sort" src/ --include="*.tsx" | grep -v "t("

# Find hardcoded loading messages
grep -r "Loading\|loading" src/ --include="*.tsx" | grep -v "t("

# Find hardcoded toast messages
grep -r "toast\|Toast" src/ --include="*.tsx" -A 5 | grep -v "t("
```

## ✅ Translation Keys Already Added
All required translation keys have been added to `LanguageContext.tsx` with both English and Vietnamese translations. **No new keys need to be created.**

## 🔧 Implementation Pattern

```typescript
// 1. Import useLanguage hook
import { useLanguage } from '@/contexts/LanguageContext';

// 2. Add hook in component
const { t } = useLanguage();

// 3. Replace hardcoded strings in different contexts:

// Placeholders:
// Before: placeholder="Search templates..."
// After: placeholder={t('templateFilters.searchPlaceholder')}

// Toast messages:
// Before: toast({ title: "Template Created", ... })
// After: toast({ title: t('toast.templateCreated'), ... })

// Form labels:
// Before: <label>Template Name</label>
// After: <label>{t('forms.templateName')}</label>
```

## 📁 Target Files (Search these directories)

1. `src/components/ui/TemplateFilters.tsx`
2. `src/components/ui/UserFilters.tsx`  
3. `src/components/forms/` (all form components)
4. `src/components/dialogs/` (all dialog components)
5. Search globally for components using toast messages
6. Search globally for loading state messages

## ✅ Acceptance Criteria

- [ ] All form placeholders use translation keys
- [ ] All filter labels and options are internationalized
- [ ] All sort options use translation keys
- [ ] All loading states display localized messages
- [ ] All toast messages use translation keys
- [ ] Language switching updates all form elements correctly
- [ ] No hardcoded user-facing strings remain in form/filter components
- [ ] All components import and use `useLanguage` hook correctly

## 🧪 Testing Checklist

1. **Filter Components**:
   - [ ] Switch language and verify all filter labels change
   - [ ] Test search placeholders in both languages
   - [ ] Verify sort option labels update correctly

2. **Form Components**:
   - [ ] Test all form labels in both languages
   - [ ] Verify placeholder text updates on language switch
   - [ ] Test form validation messages (if any found)

3. **Toast Messages**:
   - [ ] Trigger various actions that show toasts
   - [ ] Verify toast titles/descriptions use correct language
   - [ ] Ensure no English text appears when Vietnamese is selected

4. **Loading States**:
   - [ ] Test loading messages in both languages
   - [ ] Verify error messages display correctly

## 🔍 Discovery Phase

Before starting implementation, run these commands to identify all remaining hardcoded strings:

```bash
# Create a report of remaining hardcoded strings
grep -r "placeholder\|Search\|Filter\|Sort\|Loading\|toast" src/ --include="*.tsx" | grep -v "t(" > remaining_strings.txt
```

## 📚 Reference Files

- **Translation Context**: `src/contexts/LanguageContext.tsx` (lines 1506-1589 for new keys)
- **Example Implementations**: 
  - `src/pages/Index.tsx` (comprehensive example)
  - `src/components/ui/EmptyState.tsx` (toast and UI patterns)
  - `src/components/ui/ReportDeleteDialog.tsx` (dialog pattern)

## 🎯 Priority
**High** - Critical for complete user experience localization

---
**Estimated Time**: 3-4 hours  
**Skills Required**: React, TypeScript, i18n patterns, Grep/search skills  
**Dependencies**: None (all translation keys already exist)

## 💡 Pro Tips
- Use global search to find all instances of hardcoded strings
- Test each component individually after updating
- Pay special attention to toast messages as they're often overlooked
- Ensure consistent spacing and formatting in translated text