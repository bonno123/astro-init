/// <reference path="../.astro/types.d.ts" />
/// <reference types="astro/client" />

interface ImportMetaEnv {
    readonly PUBLIC_SITE_NAME: string;
    readonly PUBLIC_CONTACT_EMAIL: string;
    // more env variables...

    readonly PUBLIC_BACKEND_SERVER_URL: string;
  }
  
  interface ImportMeta {
    readonly env: ImportMetaEnv;
  }