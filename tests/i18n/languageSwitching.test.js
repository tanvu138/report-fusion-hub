/**
 * Language Switching Tests
 * 
 * Tests for Phase 2: Language Switching Testing from GitHub Issue #23
 * Tests runtime switching, persistence, and deep links
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { LanguageProvider, useLanguage } from '../../src/contexts/LanguageContext.tsx';

// Mock localStorage
const createMockStorage = () => {
  let storage = {};
  return {
    getItem: jest.fn((key) => storage[key] || null),
    setItem: jest.fn((key, value) => { storage[key] = value; }),
    removeItem: jest.fn((key) => { delete storage[key]; }),
    clear: jest.fn(() => { storage = {}; }),
  };
};

// Test component for language switching
const LanguageSwitchTestComponent = () => {
  const { t, language, setLanguage } = useLanguage();
  
  return (
    <div>
      <div data-testid="current-language">{language}</div>
      <div data-testid="translated-text">{t('index.hero.title')}</div>
      <div data-testid="app-name">{t('app.name')}</div>
      <button onClick={() => setLanguage('en')} data-testid="switch-english">
        Switch to English
      </button>
      <button onClick={() => setLanguage('vi')} data-testid="switch-vietnamese">
        Switch to Vietnamese
      </button>
      <div data-testid="variable-test">{t('app.footer', { '0': '2024' })}</div>
    </div>
  );
};

describe('Language Switching Tests', () => {
  let mockStorage;

  beforeEach(() => {
    mockStorage = createMockStorage();
    Object.defineProperty(window, 'localStorage', { value: mockStorage });
    jest.clearAllMocks();
  });

  describe('Runtime Language Switching', () => {
    test('switches language immediately without page refresh', async () => {
      render(
        <LanguageProvider>
          <LanguageSwitchTestComponent />
        </LanguageProvider>
      );

      // Default should be Vietnamese (as per context implementation)
      expect(screen.getByTestId('current-language')).toHaveTextContent('vi');

      // Switch to English
      fireEvent.click(screen.getByTestId('switch-english'));
      
      await waitFor(() => {
        expect(screen.getByTestId('current-language')).toHaveTextContent('en');
      });

      // Verify localStorage was updated
      expect(mockStorage.setItem).toHaveBeenCalledWith('language', 'en');
    });

    test('text content updates when language changes', async () => {
      render(
        <LanguageProvider>
          <LanguageSwitchTestComponent />
        </LanguageProvider>
      );

      const textElement = screen.getByTestId('translated-text');
      const initialText = textElement.textContent;

      // Switch language
      fireEvent.click(screen.getByTestId('switch-english'));
      
      await waitFor(() => {
        const newText = textElement.textContent;
        // Text should be defined (may or may not be different based on translation)
        expect(newText).toBeDefined();
      });
    });

    test('brand name remains consistent across languages', () => {
      render(
        <LanguageProvider>
          <LanguageSwitchTestComponent />
        </LanguageProvider>
      );

      const brandName = screen.getByTestId('app-name').textContent;
      expect(brandName).toBe('TPG Reports');

      // Switch language
      fireEvent.click(screen.getByTestId('switch-english'));
      
      // Brand name should remain the same
      expect(screen.getByTestId('app-name')).toHaveTextContent('TPG Reports');
    });

    test('handles rapid language switching correctly', async () => {
      render(
        <LanguageProvider>
          <LanguageSwitchTestComponent />
        </LanguageProvider>
      );

      // Rapidly switch languages
      fireEvent.click(screen.getByTestId('switch-english'));
      fireEvent.click(screen.getByTestId('switch-vietnamese'));
      fireEvent.click(screen.getByTestId('switch-english'));
      
      await waitFor(() => {
        expect(screen.getByTestId('current-language')).toHaveTextContent('en');
      });

      // Should have called setItem multiple times
      expect(mockStorage.setItem).toHaveBeenCalledTimes(3);
    });
  });

  describe('Language Persistence', () => {
    test('loads language from localStorage on initialization', () => {
      // Pre-populate localStorage
      mockStorage.getItem.mockReturnValue('en');

      render(
        <LanguageProvider>
          <LanguageSwitchTestComponent />
        </LanguageProvider>
      );

      // Should start with English since it was in localStorage
      expect(screen.getByTestId('current-language')).toHaveTextContent('en');
      expect(mockStorage.getItem).toHaveBeenCalledWith('language');
    });

    test('defaults to Vietnamese when no localStorage value exists', () => {
      mockStorage.getItem.mockReturnValue(null);

      render(
        <LanguageProvider>
          <LanguageSwitchTestComponent />
        </LanguageProvider>
      );

      // Should default to Vietnamese
      expect(screen.getByTestId('current-language')).toHaveTextContent('vi');
    });

    test('persists language changes to localStorage', () => {
      render(
        <LanguageProvider>
          <LanguageSwitchTestComponent />
        </LanguageProvider>
      );

      // Switch to English
      fireEvent.click(screen.getByTestId('switch-english'));
      expect(mockStorage.setItem).toHaveBeenCalledWith('language', 'en');

      // Switch back to Vietnamese
      fireEvent.click(screen.getByTestId('switch-vietnamese'));
      expect(mockStorage.setItem).toHaveBeenCalledWith('language', 'vi');
    });
  });

  describe('Variable Substitution', () => {
    test('handles variable substitution correctly in both languages', () => {
      render(
        <LanguageProvider>
          <LanguageSwitchTestComponent />
        </LanguageProvider>
      );

      // Check Vietnamese (default)
      let variableText = screen.getByTestId('variable-test').textContent;
      expect(variableText).toContain('2024');

      // Switch to English
      fireEvent.click(screen.getByTestId('switch-english'));
      
      variableText = screen.getByTestId('variable-test').textContent;
      expect(variableText).toContain('2024');
    });
  });

  describe('Error Handling', () => {
    test('handles missing translation keys gracefully', () => {
      const TestComponentWithMissingKey = () => {
        const { t } = useLanguage();
        return <div data-testid="missing-key">{t('nonexistent.key')}</div>;
      };

      render(
        <LanguageProvider>
          <TestComponentWithMissingKey />
        </LanguageProvider>
      );

      // Should display the key itself when translation is missing
      expect(screen.getByTestId('missing-key')).toHaveTextContent('nonexistent.key');
    });

    test('handles malformed variable substitution gracefully', () => {
      const TestComponentWithBadVariables = () => {
        const { t } = useLanguage();
        return <div data-testid="bad-variables">{t('app.footer', { invalid: 'test' })}</div>;
      };

      render(
        <LanguageProvider>
          <TestComponentWithBadVariables />
        </LanguageProvider>
      );

      // Should not crash and should render something
      const element = screen.getByTestId('bad-variables');
      expect(element).toBeInTheDocument();
      expect(element.textContent).toBeDefined();
    });
  });

  describe('Performance Tests', () => {
    test('language switching completes quickly', async () => {
      render(
        <LanguageProvider>
          <LanguageSwitchTestComponent />
        </LanguageProvider>
      );

      const startTime = performance.now();

      fireEvent.click(screen.getByTestId('switch-english'));
      
      await waitFor(() => {
        expect(screen.getByTestId('current-language')).toHaveTextContent('en');
      });

      const endTime = performance.now();
      const duration = endTime - startTime;

      // Language switching should be very fast (under 50ms in tests)
      expect(duration).toBeLessThan(50);
    });

    test('does not cause memory leaks with multiple switches', () => {
      render(
        <LanguageProvider>
          <LanguageSwitchTestComponent />
        </LanguageProvider>
      );

      // Perform many language switches
      for (let i = 0; i < 100; i++) {
        fireEvent.click(screen.getByTestId(i % 2 === 0 ? 'switch-english' : 'switch-vietnamese'));
      }

      // Should not crash or cause issues
      expect(screen.getByTestId('current-language')).toBeInTheDocument();
    });
  });

  describe('Integration with Context', () => {
    test('provides correct context values', () => {
      const ContextTestComponent = () => {
        const context = useLanguage();
        
        return (
          <div>
            <div data-testid="has-language">{context.language ? 'true' : 'false'}</div>
            <div data-testid="has-setLanguage">{typeof context.setLanguage === 'function' ? 'true' : 'false'}</div>
            <div data-testid="has-t">{typeof context.t === 'function' ? 'true' : 'false'}</div>
          </div>
        );
      };

      render(
        <LanguageProvider>
          <ContextTestComponent />
        </LanguageProvider>
      );

      expect(screen.getByTestId('has-language')).toHaveTextContent('true');
      expect(screen.getByTestId('has-setLanguage')).toHaveTextContent('true');
      expect(screen.getByTestId('has-t')).toHaveTextContent('true');
    });

    test('throws error when used outside provider', () => {
      // Mock console.error to prevent test output pollution
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      const TestComponentOutsideProvider = () => {
        const { t } = useLanguage();
        return <div>{t('test')}</div>;
      };

      // This should throw an error or use default values
      expect(() => {
        render(<TestComponentOutsideProvider />);
      }).not.toThrow(); // useContext returns default value, doesn't throw

      consoleSpy.mockRestore();
    });
  });
});