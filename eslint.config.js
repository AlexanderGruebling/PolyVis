import js from '@eslint/js';
import globals from 'globals';

export default [
  {
    files: ['src/**/*.js'],
    languageOptions: {
      globals: { ...globals.browser },
      ecmaVersion: 'latest',
      sourceType: 'module',
    },
  },
  js.configs.recommended,
  { ignores: ['dist/', 'node_modules/'] },
];
