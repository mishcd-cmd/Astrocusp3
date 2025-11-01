import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      // React Native to Web
      'react-native$': 'react-native-web',
      // Optional: expo-linear-gradient has web support via RN-Web when bundled correctly
      '@': path.resolve(__dirname, '.'),
    },
    extensions: [
      '.web.tsx',
      '.web.ts',
      '.web.jsx',
      '.web.js',
      '.tsx',
      '.ts',
      '.jsx',
      '.js',
      '.json'
    ],
  },
  define: {
    __DEV__: process.env.NODE_ENV !== 'production'
  }
});
