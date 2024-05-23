import { defineConfig } from 'astro/config';
import vue from "@astrojs/vue";
import db from "@astrojs/db";

import node from "@astrojs/node";

// https://astro.build/config
export default defineConfig({
  site: 'https://avikbanik.com',
  redirects: {
    // '/this': '/'
  },
  integrations: [vue({
    template: {
      compilerOptions: {
        isCustomElement: tag => (tag.startsWith('Tres') || tag === 'primitive') && tag !== 'TresCanvas'
      }
    }
  }), db()],
  build: {
    format: 'directory',
    server: './server'
  },
  trailingSlash: 'always',
  output: 'hybrid',
  adapter: node({
    mode: "standalone"
  })
});