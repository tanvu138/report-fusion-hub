#!/usr/bin/env node

/**
 * Hardcoded String Detection Script
 * 
 * Scans React components for hardcoded English strings that should be translated
 * Part of GitHub Issue #23 - Comprehensive i18n Testing and Validation
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const config = {
  // Directories to scan
  scanDirs: ['src/components', 'src/pages'],
  // File extensions to include
  extensions: ['.tsx', '.ts', '.jsx', '.js'],
  // Patterns that indicate translatable content
  translatablePatterns: [
    // JSX text content
    />([^<{]*[a-zA-Z]{3,}[^<{]*)</g,
    // String literals in JSX attributes
    /(?:placeholder|title|aria-label|alt)=["']([^"']*[a-zA-Z]{3,}[^"']*)/g,
    // Toast messages and alerts
    /toast\s*\(\s*{[^}]*["']([^"']*[a-zA-Z]{3,}[^"']*)/g,
    // Error messages
    /(?:throw new Error|console\.error)\s*\(\s*["']([^"']*[a-zA-Z]{3,}[^"']*)/g
  ],
  // Patterns to exclude (non-translatable content)
  excludePatterns: [
    // Technical terms, class names, IDs
    /^[a-z-]+$/,
    // URLs and paths
    /^[./][a-zA-Z0-9./\-_]*$/,
    // Single words that are likely technical
    /^(className|onClick|onChange|onSubmit|useState|useEffect|import|export|const|let|var|function|return|if|else|for|while|try|catch|finally)$/,
    // CSS classes and Tailwind classes
    /^(bg-|text-|border-|hover:|focus:|active:|disabled:|w-|h-|p-|m-|flex|grid|hidden|block|inline)/,
    // Numbers and technical values
    /^\d+(%|px|rem|em)?$/,
    // File extensions
    /\.(tsx?|jsx?|css|scss|json|png|jpg|svg)$/,
    // API endpoints
    /^\/api\//,
    // Console log arguments
    /console\.(log|warn|error|info)/
  ]
};

class HardcodedStringDetector {
  constructor() {
    this.results = {
      totalFiles: 0,
      scannedFiles: 0,
      issuesFound: [],
      summary: {
        totalIssues: 0,
        byType: {},
        byFile: {},
        severityCount: { high: 0, medium: 0, low: 0 }
      }
    };
  }

  /**
   * Main scanning function
   */
  async scan() {
    console.log('🔍 Starting hardcoded string detection...\n');
    
    for (const dir of config.scanDirs) {
      const fullPath = path.join(process.cwd(), dir);
      if (fs.existsSync(fullPath)) {
        await this.scanDirectory(fullPath, dir);
      } else {
        console.log(`⚠️  Directory not found: ${dir}`);
      }
    }

    this.generateReport();
    return this.results;
  }

  /**
   * Recursively scan directory
   */
  async scanDirectory(dirPath, relativePath = '') {
    const items = fs.readdirSync(dirPath);

    for (const item of items) {
      const fullPath = path.join(dirPath, item);
      const relativeFilePath = path.join(relativePath, item);
      const stat = fs.statSync(fullPath);

      if (stat.isDirectory()) {
        // Skip node_modules and build directories
        if (!['node_modules', 'build', 'dist', '.git'].includes(item)) {
          await this.scanDirectory(fullPath, relativeFilePath);
        }
      } else if (this.shouldScanFile(fullPath)) {
        this.results.totalFiles++;
        await this.scanFile(fullPath, relativeFilePath);
      }
    }
  }

  /**
   * Check if file should be scanned
   */
  shouldScanFile(filePath) {
    const ext = path.extname(filePath);
    return config.extensions.includes(ext);
  }

  /**
   * Scan individual file for hardcoded strings
   */
  async scanFile(filePath, relativeFilePath) {
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      this.results.scannedFiles++;

      // Skip files that are clearly using i18n already
      if (content.includes('useLanguage') && content.includes('t(')) {
        this.scanFileWithI18n(content, relativeFilePath);
      } else {
        this.scanFileWithoutI18n(content, relativeFilePath);
      }

    } catch (error) {
      console.error(`Error scanning ${relativeFilePath}:`, error.message);
    }
  }

  /**
   * Scan file that already uses i18n (looking for hardcoded strings that escaped)
   */
  scanFileWithI18n(content, filePath) {
    const lines = content.split('\n');
    
    lines.forEach((line, lineNumber) => {
      // Look for hardcoded strings in files that use i18n
      const hardcodedInJSX = this.findHardcodedInJSX(line);
      const hardcodedInProps = this.findHardcodedInProps(line);
      const hardcodedInMessages = this.findHardcodedInMessages(line);

      [...hardcodedInJSX, ...hardcodedInProps, ...hardcodedInMessages].forEach(match => {
        if (this.isTranslatable(match.text)) {
          this.addIssue({
            file: filePath,
            line: lineNumber + 1,
            type: match.type,
            text: match.text,
            context: line.trim(),
            severity: 'high', // High because file uses i18n but has hardcoded strings
            suggestion: this.suggestTranslationKey(match.text)
          });
        }
      });
    });
  }

  /**
   * Scan file that doesn't use i18n yet
   */
  scanFileWithoutI18n(content, filePath) {
    const lines = content.split('\n');
    
    lines.forEach((line, lineNumber) => {
      const hardcodedStrings = this.findAllHardcodedStrings(line);
      
      hardcodedStrings.forEach(match => {
        if (this.isTranslatable(match.text)) {
          this.addIssue({
            file: filePath,
            line: lineNumber + 1,
            type: match.type,
            text: match.text,
            context: line.trim(),
            severity: 'medium', // Medium because entire file needs i18n setup
            suggestion: this.suggestI18nImplementation(filePath)
          });
        }
      });
    });
  }

  /**
   * Find hardcoded strings in JSX content
   */
  findHardcodedInJSX(line) {
    const matches = [];
    const jsxTextRegex = />([^<{]*[a-zA-Z]{2,}[^<{]*)</g;
    let match;

    while ((match = jsxTextRegex.exec(line)) !== null) {
      const text = match[1].trim();
      if (text && !this.isExcluded(text)) {
        matches.push({ type: 'jsx-text', text });
      }
    }

    return matches;
  }

  /**
   * Find hardcoded strings in component props
   */
  findHardcodedInProps(line) {
    const matches = [];
    const propRegex = /(?:placeholder|title|aria-label|alt|label)=["']([^"']*[a-zA-Z]{2,}[^"']*)/g;
    let match;

    while ((match = propRegex.exec(line)) !== null) {
      const text = match[1].trim();
      if (text && !this.isExcluded(text)) {
        matches.push({ type: 'jsx-prop', text });
      }
    }

    return matches;
  }

  /**
   * Find hardcoded strings in messages (toast, errors, etc.)
   */
  findHardcodedInMessages(line) {
    const matches = [];
    const messageRegex = /(?:toast|alert|confirm|Error)\s*\([^)]*["']([^"']*[a-zA-Z]{3,}[^"']*)/g;
    let match;

    while ((match = messageRegex.exec(line)) !== null) {
      const text = match[1].trim();
      if (text && !this.isExcluded(text)) {
        matches.push({ type: 'message', text });
      }
    }

    return matches;
  }

  /**
   * Find all hardcoded strings in a line
   */
  findAllHardcodedStrings(line) {
    return [
      ...this.findHardcodedInJSX(line),
      ...this.findHardcodedInProps(line),
      ...this.findHardcodedInMessages(line)
    ];
  }

  /**
   * Check if text should be excluded from translation
   */
  isExcluded(text) {
    return config.excludePatterns.some(pattern => {
      if (pattern instanceof RegExp) {
        return pattern.test(text);
      }
      return text.includes(pattern);
    });
  }

  /**
   * Check if text is translatable (user-facing content)
   */
  isTranslatable(text) {
    const trimmed = text.trim();
    
    // Too short
    if (trimmed.length < 3) return false;
    
    // Only numbers or symbols
    if (!/[a-zA-Z]/.test(trimmed)) return false;
    
    // Technical terms or code
    if (this.isExcluded(trimmed)) return false;
    
    // Common non-translatable patterns
    const nonTranslatablePatterns = [
      /^[A-Z_][A-Z0-9_]*$/, // Constants
      /^[a-z][a-zA-Z0-9]*$/, // camelCase variables
      /^\d+$/, // Numbers only
      /^#[0-9a-fA-F]+$/, // Hex colors
      /^\/[a-zA-Z0-9\/\-_]*$/, // Paths
      /^[a-zA-Z0-9\-_]+\.[a-zA-Z]{2,4}$/, // File names
    ];

    return !nonTranslatablePatterns.some(pattern => pattern.test(trimmed));
  }

  /**
   * Add issue to results
   */
  addIssue(issue) {
    this.results.issuesFound.push(issue);
    this.results.summary.totalIssues++;
    
    // Count by type
    this.results.summary.byType[issue.type] = (this.results.summary.byType[issue.type] || 0) + 1;
    
    // Count by file
    this.results.summary.byFile[issue.file] = (this.results.summary.byFile[issue.file] || 0) + 1;
    
    // Count by severity
    this.results.summary.severityCount[issue.severity]++;
  }

  /**
   * Suggest translation key for text
   */
  suggestTranslationKey(text) {
    const normalized = text
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .replace(/\s+/g, '.')
      .substring(0, 50);
    
    return `component.${normalized}`;
  }

  /**
   * Suggest i18n implementation for file
   */
  suggestI18nImplementation(filePath) {
    return `Add useLanguage hook and wrap translatable strings with t()`;
  }

  /**
   * Generate comprehensive report
   */
  generateReport() {
    console.log('\n📊 HARDCODED STRING DETECTION RESULTS');
    console.log('=====================================\n');

    console.log(`📁 Files Scanned: ${this.results.scannedFiles}/${this.results.totalFiles}`);
    console.log(`🚨 Total Issues Found: ${this.results.summary.totalIssues}\n`);

    // Severity breakdown
    console.log('📈 Issues by Severity:');
    console.log(`   🔴 High: ${this.results.summary.severityCount.high}`);
    console.log(`   🟡 Medium: ${this.results.summary.severityCount.medium}`);
    console.log(`   🟢 Low: ${this.results.summary.severityCount.low}\n`);

    // Type breakdown
    console.log('📋 Issues by Type:');
    Object.entries(this.results.summary.byType).forEach(([type, count]) => {
      console.log(`   ${type}: ${count}`);
    });
    console.log();

    // Files with most issues
    console.log('📂 Files with Most Issues:');
    const sortedFiles = Object.entries(this.results.summary.byFile)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10);
    
    sortedFiles.forEach(([file, count]) => {
      console.log(`   ${file}: ${count} issues`);
    });
    console.log();

    // Detailed issues (first 20)
    console.log('🔍 Detailed Issues (First 20):');
    console.log('================================');
    this.results.issuesFound.slice(0, 20).forEach((issue, index) => {
      console.log(`\n${index + 1}. ${issue.file}:${issue.line}`);
      console.log(`   Type: ${issue.type} | Severity: ${issue.severity}`);
      console.log(`   Text: "${issue.text}"`);
      console.log(`   Context: ${issue.context}`);
      console.log(`   Suggestion: ${issue.suggestion}`);
    });

    if (this.results.issuesFound.length > 20) {
      console.log(`\n... and ${this.results.issuesFound.length - 20} more issues.`);
    }

    console.log('\n✅ Scan completed. See full results in the return value.');
  }
}

// CLI usage
if (import.meta.url === `file://${process.argv[1]}`) {
  const detector = new HardcodedStringDetector();
  detector.scan().then(results => {
    // Write results to file for further analysis
    const resultsPath = path.join(process.cwd(), 'hardcoded-strings-report.json');
    fs.writeFileSync(resultsPath, JSON.stringify(results, null, 2));
    console.log(`\n📄 Detailed results written to: ${resultsPath}`);
    
    // Exit with error code if high-severity issues found
    if (results.summary.severityCount.high > 0) {
      process.exit(1);
    }
  }).catch(error => {
    console.error('❌ Error during scan:', error);
    process.exit(1);
  });
}

export default HardcodedStringDetector;