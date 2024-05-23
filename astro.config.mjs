import { defineConfig } from 'astro/config';
import vue from "@astrojs/vue";
import db from "@astrojs/db";

import netlify from "@astrojs/netlify";

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
    format: 'directory'
  },
  trailingSlash: 'always',
  output: 'hybrid',
  adapter: netlify()
});