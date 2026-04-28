const fs = require('fs');
const content = fs.readFileSync('src/contexts/LanguageContext.tsx', 'utf8');

// Extract English translations
const enStart = content.indexOf('export const enTranslations: Record<string, string> = {');
const viStart = content.indexOf('export const viTranslations: Record<string, string> = {');

const enSection = content.substring(enStart, viStart);
const viSection = content.substring(viStart);

// Extract actual keys
const enKeyMatches = enSection.match(/\s*'([^']+)'\s*:\s*'[^']*'/g) || [];
const viKeyMatches = viSection.match(/\s*'([^']+)'\s*:\s*'[^']*'/g) || [];

const enKeys = enKeyMatches.map(match => match.match(/'([^']+)'/)[1]);
const viKeys = viKeyMatches.map(match => match.match(/'([^']+)'/)[1]);

console.log('English keys count:', enKeys.length);
console.log('Vietnamese keys count:', viKeys.length);

// Find missing keys
const missingInVi = enKeys.filter(key => !viKeys.includes(key));
const extraInVi = viKeys.filter(key => !enKeys.includes(key));

console.log('\nMissing in Vietnamese (' + missingInVi.length + ' keys):');
missingInVi.slice(0, 20).forEach(key => console.log('  -', key));
if (missingInVi.length > 20) console.log('  ... and', (missingInVi.length - 20), 'more');

console.log('\nExtra in Vietnamese (' + extraInVi.length + ' keys):');
extraInVi.slice(0, 20).forEach(key => console.log('  +', key));
if (extraInVi.length > 20) console.log('  ... and', (extraInVi.length - 20), 'more');

// Check for empty values
const emptyEnValues = enKeys.filter(key => {
  const match = enSection.match(new RegExp(`'${key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}'\\s*:\\s*'([^']*)'`));
  return match && match[1] === '';
});

const emptyViValues = viKeys.filter(key => {
  const match = viSection.match(new RegExp(`'${key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}'\\s*:\\s*'([^']*)'`));
  return match && match[1] === '';
});

console.log('\nEmpty English values (' + emptyEnValues.length + ' keys):');
emptyEnValues.slice(0, 10).forEach(key => console.log('  -', key));

console.log('\nEmpty Vietnamese values (' + emptyViValues.length + ' keys):');
emptyViValues.slice(0, 10).forEach(key => console.log('  -', key));