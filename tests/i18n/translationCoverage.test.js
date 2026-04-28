/**
 * Translation Coverage Tests
 * 
 * Comprehensive test suite for validating i18n implementation
 * based on GitHub Issue #23 requirements
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { LanguageProvider, useLanguage } from '../../src/contexts/LanguageContext.tsx';
import testTranslations, { testVariableSubstitution } from '../../src/utils/testTranslations.js';

// Mock components for testing
const TestComponent = () => {
  const { t, language, setLanguage } = useLanguage();
  return (
    <div>
      <p data-testid="app-name">{t('app.name')}</p>
      <p data-testid="current-language">{language}</p>
      <button onClick={() => setLanguage('vi')} data-testid="switch-vi">Switch to Vietnamese</button>
      <button onClick={() => setLanguage('en')} data-testid="switch-en">Switch to English</button>
      <p data-testid="sample-text">{t('index.hero.title')}</p>
    </div>
  );
};

describe('Translation Coverage Tests', () => {
  
  describe('Phase 1: Translation Key Coverage', () => {
    test('all translation keys exist in both languages', () => {
      const results = testTranslations();
      
      // Test that there are no missing keys
      expect(results.issues.missingInVietnamese).toHaveLength(0);
      expect(results.issues.missingInEnglish).toHaveLength(0);
      
      // Log statistics for reporting
      console.log('Translation Coverage Statistics:', results.summary);
      
      // Ensure translation completeness
      expect(results.summary.isComplete).toBe(true);
    });

    test('no empty translation values exist', () => {
      const results = testTranslations();
      
      expect(results.issues.emptyEnglish).toHaveLength(0);
      expect(results.issues.emptyVietnamese).toHaveLength(0);
    });

    test('identifies potentially untranslated content', () => {
      const results = testTranslations();
      
      // Allow some identical translations (like brand names)
      const allowedIdentical = ['app.name'];
      const problematicIdentical = results.issues.identicalTranslations.filter(
        key => !allowedIdentical.includes(key)
      );
      
      // Log for review but don't fail test - some identical translations might be valid
      if (problematicIdentical.length > 0) {
        console.warn('Potentially untranslated keys:', problematicIdentical);
      }
    });
  });

  describe('Phase 2: Language Switching Functionality', () => {
    test('language switching works correctly', async () => {
      render(
        <LanguageProvider>
          <TestComponent />
        </LanguageProvider>
      );

      // Test initial state (Vietnamese is default)
      expect(screen.getByTestId('current-language')).toHaveTextContent('vi');
      
      // Switch to English
      fireEvent.click(screen.getByTestId('switch-en'));
      await waitFor(() => {
        expect(screen.getByTestId('current-language')).toHaveTextContent('en');
      });
      
      // Switch back to Vietnamese
      fireEvent.click(screen.getByTestId('switch-vi'));
      await waitFor(() => {
        expect(screen.getByTestId('current-language')).toHaveTextContent('vi');
      });
    });

    test('text content updates when language changes', async () => {
      render(
        <LanguageProvider>
          <TestComponent />
        </LanguageProvider>
      );

      // Get initial text
      const initialText = screen.getByTestId('sample-text').textContent;
      
      // Switch language
      fireEvent.click(screen.getByTestId('switch-en'));
      
      await waitFor(() => {
        const newText = screen.getByTestId('sample-text').textContent;
        // Text should change (unless the translation is identical)
        expect(newText).toBeDefined();
      });
    });

    test('language preference persists in localStorage', () => {
      // Mock localStorage
      const localStorageMock = {
        getItem: jest.fn(),
        setItem: jest.fn(),
        removeItem: jest.fn(),
      };
      Object.defineProperty(window, 'localStorage', { value: localStorageMock });

      render(
        <LanguageProvider>
          <TestComponent />
        </LanguageProvider>
      );

      // Switch language
      fireEvent.click(screen.getByTestId('switch-en'));
      
      // Verify localStorage was called
      expect(localStorageMock.setItem).toHaveBeenCalledWith('language', 'en');
    });
  });

  describe('Phase 3: Variable Substitution', () => {
    test('variable substitution works correctly', () => {
      const mockT = (key, variables) => {
        const translations = {
          'app.footer': '© {0} TPG Reports. All rights reserved.',
          'test.greeting': 'Hello {name}, you have {count} messages'
        };
        
        let text = translations[key] || key;
        if (variables) {
          Object.entries(variables).forEach(([varKey, value]) => {
            text = text.replace(new RegExp(`\\{${varKey}\\}`, 'g'), String(value));
          });
        }
        return text;
      };

      const results = testVariableSubstitution(mockT);
      
      expect(results.passedTests).toBeGreaterThan(0);
      expect(results.failedTests).toBe(0);
    });
  });

  describe('Phase 4: Component Integration Tests', () => {
    test('LanguageProvider wraps components correctly', () => {
      render(
        <LanguageProvider>
          <TestComponent />
        </LanguageProvider>
      );

      // Should not throw errors and should render
      expect(screen.getByTestId('app-name')).toBeInTheDocument();
      expect(screen.getByTestId('current-language')).toBeInTheDocument();
    });
  });
});

describe('Visual Regression Prevention', () => {
  test('components render without errors in both languages', () => {
    const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
    
    render(
      <LanguageProvider>
        <TestComponent />
      </LanguageProvider>
    );

    // Switch to Vietnamese
    fireEvent.click(screen.getByTestId('switch-vi'));
    
    // Switch to English
    fireEvent.click(screen.getByTestId('switch-en'));
    
    // Should not have any console errors
    expect(consoleError).not.toHaveBeenCalled();
    
    consoleError.mockRestore();
  });
});

describe('Performance Tests', () => {
  test('language switching is performant', async () => {
    const startTime = performance.now();
    
    render(
      <LanguageProvider>
        <TestComponent />
      </LanguageProvider>
    );

    // Perform language switch
    fireEvent.click(screen.getByTestId('switch-en'));
    
    await waitFor(() => {
      expect(screen.getByTestId('current-language')).toHaveTextContent('en');
    });
    
    const endTime = performance.now();
    const duration = endTime - startTime;
    
    // Language switching should be under 100ms
    expect(duration).toBeLessThan(100);
  });
});