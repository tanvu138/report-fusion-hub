# Testing Guide

This document outlines the testing strategy and implementation for the Report Fusion Hub application.

## Testing Stack

### Unit/Integration Testing
- **Framework**: Vitest
- **Testing Library**: @testing-library/react
- **Environment**: jsdom
- **Coverage**: v8 provider with 70% threshold

### E2E Testing
- **Framework**: Playwright
- **Browsers**: Chromium, Firefox, WebKit
- **Mobile**: Pixel 5, iPhone 12 simulation
- **Features**: Screenshots, videos, traces on failure

## Test Structure

```
tests/
├── e2e/                    # End-to-end tests
│   ├── auth.spec.ts       # Authentication flows
│   ├── error-handling.spec.ts # Error states and recovery
│   ├── home.spec.ts       # Homepage functionality
│   ├── mobile.spec.ts     # Mobile responsiveness
│   └── navigation.spec.ts # Navigation and accessibility
├── helpers/               # Test utilities
│   ├── auth.ts           # Authentication helpers
│   └── common.ts         # Common test utilities
├── health.spec.ts        # API health check
└── README.md             # This file

src/
├── components/
│   └── ui/
│       └── __tests__/     # Component unit tests
├── utils/
│   └── __tests__/         # Utility function tests
└── middleware/
    └── __tests__/         # Middleware tests
```

## Running Tests

### Unit Tests
```bash
npm run test:unit          # Run once
npm run test:unit:watch    # Watch mode
npm run test:coverage      # With coverage report
```

### E2E Tests
```bash
npm run test:e2e           # All browsers
npm run test:e2e:chromium  # Chromium only
npm run test:e2e:mobile    # Mobile viewports only
npm run test:e2e:headed    # With browser UI
npm run test:e2e:ui        # Playwright UI mode
npm run test:e2e:debug     # Debug mode
```

### All Tests
```bash
npm run test:all           # Unit + E2E
npm run test:ci            # CI-optimized (unit + chromium only)
```

## Test Categories

### 1. Authentication Tests (`auth.spec.ts`)
Tests user authentication flows:
- Login form validation
- Successful login/logout
- Role-based access control
- Session persistence
- Error handling

### 2. Navigation Tests (`navigation.spec.ts`)
Tests navigation and accessibility:
- Header navigation
- Breadcrumbs
- Back button functionality
- Active states
- ARIA landmarks
- Keyboard navigation

### 3. Error Handling Tests (`error-handling.spec.ts`)
Tests error states and recovery:
- Loading skeletons
- Network errors
- Retry mechanisms
- Progress indicators
- Offline handling
- Form validation errors

### 4. Mobile Tests (`mobile.spec.ts`)
Tests responsive design:
- Mobile navigation
- Dialog sizing
- Touch-friendly buttons
- Table responsiveness
- Form layouts
- Scrolling behavior

### 5. Home Page Tests (`home.spec.ts`)
Tests homepage functionality:
- Content display
- Navigation links
- Accessibility structure
- Mobile responsiveness

## Test Helpers

### Authentication (`tests/helpers/auth.ts`)
- `login(page, user)` - Generic login helper
- `loginAsSecretary(page)` - Secretary user login
- `loginAsDepartment(page)` - Department user login
- `logout(page)` - Logout helper
- `isLoggedIn(page)` - Check login status

### Common Utilities (`tests/helpers/common.ts`)
- `navigateAndWait(page, url)` - Navigate with loading wait
- `waitForLoadingToComplete(page)` - Wait for skeletons to disappear
- `fillFormField(page, label, value)` - Fill form inputs
- `waitForToast(page, message?)` - Wait for notifications
- `checkBasicAccessibility(page)` - Basic a11y checks

## Test Data

### Test Users
```typescript
TEST_USERS = {
  secretary: {
    email: 'admin@tpg.test',
    password: 'admin123',
    role: 'secretary'
  },
  department: {
    email: 'department@tpg.test', 
    password: 'dept123',
    role: 'department'
  }
}
```

## Coverage Requirements

- **Lines**: 70%
- **Branches**: 70% 
- **Functions**: 70%
- **Statements**: 70%

## Best Practices

### Writing Tests
1. Use descriptive test names
2. Follow AAA pattern (Arrange, Act, Assert)
3. Test user behavior, not implementation
4. Use semantic queries (getByRole, getByLabel)
5. Clean up after tests

### E2E Tests
1. Start each test from a clean state
2. Use page object patterns for complex flows
3. Wait for elements properly
4. Handle flaky network conditions
5. Take screenshots on failures

### Unit Tests
1. Mock external dependencies
2. Test edge cases and error conditions
3. Use factory functions for test data
4. Keep tests isolated and independent

## Accessibility Testing

All E2E tests include basic accessibility checks:
- ARIA landmarks (banner, main, contentinfo)
- Proper heading hierarchy
- Form labels and descriptions
- Focus management
- Keyboard navigation
- Color contrast (manual verification)

## CI/CD Integration

### GitHub Actions
```yaml
- name: Run tests
  run: npm run test:ci
  
- name: Upload coverage
  uses: codecov/codecov-action@v3
```

### Pre-commit Hooks
```json
{
  "lint-staged": {
    "*.{ts,tsx}": ["npm run test:unit", "npm run lint"]
  }
}
```

## Debugging Tests

### Unit Tests
```bash
# Debug specific test
npm run test:unit:watch -- ErrorMessage.test.tsx

# Debug with inspector
node --inspect-brk ./node_modules/vitest/vitest.mjs run
```

### E2E Tests
```bash
# Debug mode (opens debugger)
npm run test:e2e:debug

# Headed mode (see browser)
npm run test:e2e:headed

# Interactive UI
npm run test:e2e:ui
```

### Playwright Traces
After test failures, check:
- `test-results/` for screenshots
- `playwright-report/` for HTML report with traces
- Console logs and network requests

## Common Issues

### Flaky Tests
- Add proper waits (`waitForLoadingToComplete`)
- Use network idle state
- Increase timeouts for slow operations
- Mock time-dependent operations

### Network Issues
- Mock external API calls
- Use `page.route()` for request interception
- Test both success and failure scenarios

### Element Not Found
- Use `waitFor` methods
- Check element visibility
- Verify correct selectors
- Use accessibility-friendly queries

## Future Improvements

1. **Visual Regression Testing**
   - Add screenshot comparison tests
   - Detect unintended UI changes

2. **Performance Testing**
   - Web Vitals measurement
   - Bundle size monitoring
   - Load time benchmarks

3. **API Testing**
   - Contract testing with server
   - Schema validation
   - Error response testing

4. **Accessibility Automation**
   - axe-core integration
   - Automated WCAG compliance
   - Color contrast verification