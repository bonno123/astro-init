import { defineConfig } from 'astro/config';
import vue from "@astrojs/vue";

// https://astro.build/config
export default defineConfig({
  site: 'https://www.avikb.dev',

  integrations: [
    vue(),
  ],

  build: {
    format: 'directory',
  },

  trailingSlash: 'always',

  // The old multi-page site's URLs, pointed at the matching part of the
  // one-page home so old links and search results still land somewhere.
  redirects: {
    '/about': '/',
    '/resume': '/#declared',
    '/services': '/#declared',
    '/projects': '/#building',
    '/contact': '/#say-hi',
    '/lab': '/',
    '/playground': '/',
    '/worker': '/',
  },

  security: {
    checkOrigin: false,
  },
});