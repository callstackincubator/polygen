import path from 'node:path';
import { fileURLToPath } from 'node:url';
import js from '@eslint/js';
import { FlatCompat } from '@eslint/eslintrc';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const compat = new FlatCompat({
  baseDirectory: __dirname,
  recommendedConfig: js.configs.recommended,
  allConfig: js.configs.all,
});

export default [{
  ignores: ['**/lib/**/*', '**/dist/**/*', '**/node_modules/**/*'],
}, ...compat.extends('@react-native', 'prettier', 'plugin:prettier/recommended'), {
  rules: {
    'react/react-in-jsx-scope': 'off',

    'prettier/prettier': ['error', {
      quoteProps: 'consistent',
      singleQuote: true,
      tabWidth: 2,
      trailingComma: 'es5',
      useTabs: false,
    }],
  },
}];
