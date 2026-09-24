import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "wxt";

// See https://wxt.dev/api/config.html
export default defineConfig({
  modules: ["@wxt-dev/module-react"],
  vite: () => ({
    plugins: [tailwindcss()],
    build: {
      sourcemap: false,
    },
  }),
  manifest: {
    name: "PaperTab",
    description:
      "A drawable wallpaper for your New Tab page. Toggle drawing mode on to sketch, toggle it off to keep it as your background.",
    permissions: ["storage", "unlimitedStorage"],
    icons: {
      16: "/icon/16.png",
      32: "/icon/32.png",
      48: "/icon/48.png",
      128: "/icon/128.png",
    },
    action: {
      default_title: "PaperTab",
      default_icon: {
        16: "/icon/16.png",
        32: "/icon/32.png",
        48: "/icon/48.png",
        128: "/icon/128.png",
      },
    },
  },
});
