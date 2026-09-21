import { defineConfig } from 'wxt';
import tailwindcss from '@tailwindcss/vite';

// See https://wxt.dev/api/config.html
export default defineConfig({
  modules: ['@wxt-dev/module-react'],
  vite: () => ({
    plugins: [tailwindcss()],
    build: {
      sourcemap: true,
    },
  }),
  manifest: {
    name: 'Canvas Wallpaper',
    description: 'A drawable wallpaper for your New Tab page. Toggle drawing mode on to sketch, toggle it off to keep it as your background.',
    permissions: ['storage', 'unlimitedStorage'],
    icons: {
      16: '/icon/16.png',
      48: '/icon/48.png',
      128: '/icon/128.png',
    },
  },
});
