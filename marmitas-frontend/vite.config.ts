import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react-swc';
import { resolve } from 'path';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load env file based on mode
  const env = loadEnv(mode, process.cwd(), '');
  
  return {
    plugins: [react()],
    resolve: {
      alias: {
        '@': resolve(__dirname, './src'),
      },
    },
    server: {
      port: 3000,
      strictPort: true,
      host: true,
      proxy: {
        '/api': {
          target: env.VITE_API_URL || 'http://localhost:3001',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api/, ''),
        },
      },
    },
    build: {
      outDir: 'dist',
      emptyOutDir: true,
      sourcemap: mode !== 'production',
      minify: mode === 'production',
      target: 'es2020',
      rollupOptions: {
        output: {
          manualChunks: {
            vendor: [
              'react', 
              'react-dom', 
              'react-router-dom',
              '@tanstack/react-query'
            ],
            ui: [
              '@radix-ui/react-dialog',
              '@radix-ui/react-dropdown-menu',
              '@radix-ui/react-popover'
            ]
          },
        },
      },
      chunkSizeWarningLimit: 1000,
    },
    css: {
      devSourcemap: true,
      preprocessorOptions: {
        scss: {
          additionalData: `@import "@/styles/variables.scss";`,
        },
      },
    },
    test: {
      globals: true,
      environment: 'jsdom',
      setupFiles: ['./src/test/setup.ts'],
      css: true,
      coverage: {
        reporter: ['text', 'json', 'html'],
        exclude: [
          'node_modules/',
          'src/test/',
        ],
      },
    },
  };
}); 