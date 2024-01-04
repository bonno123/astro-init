import { defineConfig } from 'astro/config';

import vue from "@astrojs/vue";

// https://astro.build/config
export default defineConfig({
  site: 'https://avikbanik.com',
  integrations: [
    vue({
      template: {
        compilerOptions: {
          isCustomElement: tag => (tag.startsWith('Tres') || tag === 'primitive' ) && tag !== 'TresCanvas',
        },
      },
    }),
  ],
});