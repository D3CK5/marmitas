import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';

export default [
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  {
    ignores: [
      'node_modules/**',
      'dist/**',
      'test/**',
      'scripts/**',
      '**/*.test.ts',
      '**/*.spec.ts',
      '**/*.d.ts',
      'src/services/security-monitoring.service.ts'
    ],
  },
  {
    files: ['**/*.ts'],
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: {
        project: false, // Não usar projeto para evitar problemas com arquivos não encontrados
      },
    },
    rules: {
      'no-unused-vars': 'off', // Desativado porque o TypeScript já cuida disso
      '@typescript-eslint/no-unused-vars': 'warn',
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/explicit-module-boundary-types': 'off',
      '@typescript-eslint/no-namespace': 'warn'
    },
  },
]; 