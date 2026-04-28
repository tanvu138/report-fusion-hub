module.exports = {
  root: true,
  env: {
    es2020: true,
    node: true,
  },
  plugins: ['security'],
  extends: ['eslint:recommended', 'plugin:security/recommended'],
  rules: {
    // Lightweight import organization rules (warnings only)
    'import/order': 'warn',
    '@typescript-eslint/consistent-type-imports': 'warn',
  },
};
