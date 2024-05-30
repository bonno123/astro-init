import path from 'path';
import { fileURLToPath } from 'url';
import { defineConfig } from 'astro/config';
import vue from "@astrojs/vue";
import db from "@astrojs/db";
import netlify from "@astrojs/netlify";
import tailwind from "@astrojs/tailwind";
import icon from 'astro-icon';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// https://astro.build/config
export default defineConfig({
  site: 'https://avikbanik.com',
  redirects: {
    // '/this': '/'
  },
  integrations: [
      vue({
      template: {
        compilerOptions: {
          isCustomElement: tag => (tag.startsWith('Tres') || tag === 'primitive') && tag !== 'TresCanvas'
        }
      }
    }), 
    db(),
    tailwind(),
    icon({
      include: {
        tabler: ['*'],
        'flat-color-icons': [
          'template',
          'gallery',
          'approval',
          'document',
          'advertising',
          'currency-exchange',
          'voice-presentation',
          'business-contact',
          'database',
        ],
      },
    }),
  ],
  // image: {
  //   service: squooshImageService(),
  //   domains: ['cdn.pixabay.com'],
  // },
  vite: {
    resolve: {
      alias: {
        '~': path.resolve(__dirname, './src'),
      },
    },
  },
  build: {
    format: 'directory'
  },
  trailingSlash: 'always',
  output: 'hybrid',
  adapter: netlify()
});