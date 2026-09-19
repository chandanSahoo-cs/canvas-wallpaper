import { defineConfig } from 'wxt';
import tailwindcss from '@tailwindcss/vite';

// See https://wxt.dev/api/config.html
export default defineConfig({
  modules: ['@wxt-dev/module-react'],
  vite: () => ({
    plugins: [tailwindcss()],
  }),
  manifest: {
    name: 'Canvas Wallpaper',
    description: 'A drawable wallpaper for your New Tab page. Toggle drawing mode on to sketch, toggle it off to keep it as your background.',
    permissions: ['storage', 'unlimitedStorage'],
  },
});
