// Translation coverage testing utility
// This utility helps identify missing translation keys and validates translation completeness

import { enTranslations, viTranslations } from '../contexts/LanguageContext';

/**
 * Test translation coverage and identify missing keys
 * @returns {Object} Object containing test results and statistics
 */
const testTranslations = () => {
  const englishKeys = Object.keys(enTranslations);
  const vietnameseKeys = Object.keys(viTranslations);
  
  // Find missing keys in each language
  const missingInVietnamese = englishKeys.filter(key => !vietnameseKeys.includes(key));
  const missingInEnglish = vietnameseKeys.filter(key => !englishKeys.includes(key));
  
  // Find keys with identical values (potential translation issues)
  const identicalTranslations = englishKeys.filter(key => 
    viTranslations[key] && enTranslations[key] === viTranslations[key] && 
    !key.includes('app.name') // Brand name should be identical
  );
  
  // Find empty or undefined translations
  const emptyEnglish = englishKeys.filter(key => !enTranslations[key] || enTranslations[key].trim() === '');
  const emptyVietnamese = vietnameseKeys.filter(key => !viTranslations[key] || viTranslations[key].trim() === '');
  
  // Calculate coverage statistics
  const totalUniqueKeys = new Set([...englishKeys, ...vietnameseKeys]).size;
  const englishCoverage = ((englishKeys.length / totalUniqueKeys) * 100).toFixed(2);
  const vietnameseCoverage = ((vietnameseKeys.length / totalUniqueKeys) * 100).toFixed(2);
  
  const results = {
    summary: {
      totalEnglishKeys: englishKeys.length,
      totalVietnameseKeys: vietnameseKeys.length,
      totalUniqueKeys,
      englishCoverage: `${englishCoverage}%`,
      vietnameseCoverage: `${vietnameseCoverage}%`,
      isComplete: missingInVietnamese.length === 0 && missingInEnglish.length === 0
    },
    issues: {
      missingInVietnamese,
      missingInEnglish,
      identicalTranslations,
      emptyEnglish,
      emptyVietnamese
    },
    diagnostics: {
      hasTranslationGaps: missingInVietnamese.length > 0 || missingInEnglish.length > 0,
      hasEmptyTranslations: emptyEnglish.length > 0 || emptyVietnamese.length > 0,
      hasIdenticalTranslations: identicalTranslations.length > 0
    }
  };
  
  return results;
};

/**
 * Test variable substitution functionality
 * @param {Function} t - Translation function
 * @returns {Object} Test results for variable substitution
 */
const testVariableSubstitution = (t) => {
  const testCases = [
    { key: 'app.footer', variables: { '0': '2024' }, expected: '© 2024 TPG Reports' },
    // Add more test cases as needed
  ];
  
  const results = testCases.map(testCase => {
    try {
      const result = t(testCase.key, testCase.variables);
      const passed = result.includes(testCase.variables['0']);
      return {
        key: testCase.key,
        variables: testCase.variables,
        result,
        passed,
        expected: testCase.expected
      };
    } catch (error) {
      return {
        key: testCase.key,
        variables: testCase.variables,
        result: null,
        passed: false,
        error: error.message
      };
    }
  });
  
  return {
    totalTests: results.length,
    passedTests: results.filter(r => r.passed).length,
    failedTests: results.filter(r => !r.passed).length,
    results
  };
};

/**
 * Generate a detailed translation coverage report
 * @returns {string} Formatted report as a string
 */
const generateCoverageReport = () => {
  const results = testTranslations();
  
  let report = `
# Translation Coverage Report
Generated on: ${new Date().toISOString()}

## Summary
- Total English Keys: ${results.summary.totalEnglishKeys}
- Total Vietnamese Keys: ${results.summary.totalVietnameseKeys}
- Total Unique Keys: ${results.summary.totalUniqueKeys}
- English Coverage: ${results.summary.englishCoverage}
- Vietnamese Coverage: ${results.summary.vietnameseCoverage}
- Translation Complete: ${results.summary.isComplete ? '✅ Yes' : '❌ No'}

## Issues Found

### Missing in Vietnamese (${results.issues.missingInVietnamese.length})
${results.issues.missingInVietnamese.map(key => `- ${key}`).join('\n')}

### Missing in English (${results.issues.missingInEnglish.length})
${results.issues.missingInEnglish.map(key => `- ${key}`).join('\n')}

### Identical Translations (${results.issues.identicalTranslations.length})
${results.issues.identicalTranslations.map(key => `- ${key}: "${enTranslations[key]}"`).join('\n')}

### Empty English Translations (${results.issues.emptyEnglish.length})
${results.issues.emptyEnglish.map(key => `- ${key}`).join('\n')}

### Empty Vietnamese Translations (${results.issues.emptyVietnamese.length})
${results.issues.emptyVietnamese.map(key => `- ${key}`).join('\n')}

## Diagnostics
- Has Translation Gaps: ${results.diagnostics.hasTranslationGaps ? '❌ Yes' : '✅ No'}
- Has Empty Translations: ${results.diagnostics.hasEmptyTranslations ? '❌ Yes' : '✅ No'}
- Has Identical Translations: ${results.diagnostics.hasIdenticalTranslations ? '⚠️ Yes' : '✅ No'}

## Recommendations
${results.summary.isComplete ? 
  '✅ Translation coverage is complete! All keys have corresponding translations.' :
  '❌ Translation coverage is incomplete. Please address missing keys before production deployment.'
}
`;

  return report;
};

// Browser testing utility - can be added to window object for manual testing
const createBrowserTestUtility = () => {
  return {
    switchLanguage: (lang) => {
      localStorage.setItem('language', lang);
      window.location.reload();
    },
    getCurrentLanguage: () => localStorage.getItem('language') || 'vi',
    runCoverageTest: () => {
      const results = testTranslations();
      console.table(results.summary);
      console.log('Missing in Vietnamese:', results.issues.missingInVietnamese);
      console.log('Missing in English:', results.issues.missingInEnglish);
      return results;
    },
    generateReport: () => {
      const report = generateCoverageReport();
      console.log(report);
      return report;
    }
  };
};

// Export for testing framework integration
export default testTranslations;
export { testVariableSubstitution, generateCoverageReport, createBrowserTestUtility };