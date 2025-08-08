import { defineConfig } from 'vite';

// ESM構文で export
export default defineConfig({
  root: '.', // 省略可能
  base: './', // 相対パス（必要に応じて）
});