 # Translation Task: Internationalize UI Component

## Task Overview
Extract and translate all English UI text in the following view/page to support Vietnamese localization.

**Target Component/Page:** [[VIEW NAME or PAGE NAME HERE]]

## Step-by-Step Instructions

### 1. Locate the Component
- Check `src/routes.tsx` or routing configuration to find which component serves this page
- Note the component path and any child components it uses

### 2. Identify Text to Translate
Search for and document all:
- Static text in JSX (e.g., `<h1>Welcome</h1>`)
- Button labels (e.g., `<Button>Submit</Button>`)
- Placeholder text (e.g., `placeholder="Enter name"`)
- Error messages
- Tooltips and help text
- Table headers
- Form field labels
- Any hardcoded English strings

### 3. Create Translation Keys
Convert each text to a translation key using this naming convention:
- Format: `[page].[section].[element]`
- Examples:
  - "Submit Report" → `reports.form.submitButton`
  - "Enter report title" → `reports.form.titlePlaceholder`
  - "Required field" → `common.validation.required`

### 4. Update the Component
Replace hardcoded text with translation function calls:
```typescript
// Before:
<Button>Submit Report</Button>

// After:
<Button>{t('reports.form.submitButton')}</Button>
```

### 5. Add Translations
Update the translation files:
- English: `src/locales/en/translation.json`
- Vietnamese: `src/locales/vi/translation.json`

Example entries:
```json
// en/translation.json
{
  "reports": {
    "form": {
      "submitButton": "Submit Report",
      "titlePlaceholder": "Enter report title"
    }
  }
}

// vi/translation.json
{
  "reports": {
    "form": {
      "submitButton": "Gửi Báo Cáo",
      "titlePlaceholder": "Nhập tiêu đề báo cáo"
    }
  }
}
```

### 6. Import Translation Hook
Ensure the component imports and uses the translation hook:
```typescript
import { useTranslation } from 'react-i18next';

function MyComponent() {
  const { t } = useTranslation();
  // ... rest of component
}
```

## Checklist
- [ ] Located target component and all child components
- [ ] Identified ALL English text (including edge cases)
- [ ] Created consistent translation keys
- [ ] Updated component to use translation function
- [ ] Added English translations to `en/translation.json`
- [ ] Added Vietnamese translations to `vi/translation.json`
- [ ] Tested both languages work correctly
- [ ] No hardcoded English text remains

## Notes
- For dynamic text (e.g., from API), ensure backend also supports i18n
- Common translations (like "Save", "Cancel") should use `common.*` namespace
- Keep translation keys descriptive but concise
- Test all text appears correctly in both languages