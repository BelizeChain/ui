import js from '@eslint/js';
import tsPlugin from '@typescript-eslint/eslint-plugin';

export default [
  js.configs.recommended,
  // Disables core rules that TypeScript already enforces (e.g. no-undef).
  tsPlugin.configs['flat/eslint-recommended'],
  ...tsPlugin.configs['flat/recommended'],
  {
    files: ['**/*.ts', '**/*.tsx'],
    rules: {
      '@typescript-eslint/no-unused-vars': 'warn',
      '@typescript-eslint/no-explicit-any': 'warn',
    },
  },
  {
    // Flat config always lints the default .js/.mjs/.cjs patterns; the legacy
    // eslintrc `--ext .ts,.tsx` run only covered TS, so keep that scope.
    ignores: ['dist/**', 'node_modules/**', '**/*.js', '**/*.mjs', '**/*.cjs'],
  },
];
