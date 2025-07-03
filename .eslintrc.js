module.exports = {
  env: {
    browser: true,
    es2021: true,
    webextensions: true, // Enable web extensions globals
  },
  extends: 'eslint:recommended',
  parserOptions: {
    ecmaVersion: 12,
    sourceType: 'module',
  },
  rules: {
    // Add your custom ESLint rules here
  },
};
