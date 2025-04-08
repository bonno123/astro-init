/// <reference path="../.astro/types.d.ts" />
/// <reference types="astro/client" />

interface ImportMetaEnv {
  readonly PUBLIC_SITE_NAME: string;
  readonly PUBLIC_CONTACT_EMAIL: string;
  readonly PUBLIC_CONTACT_PHONE: string;
  readonly PUBLIC_GOOGLE_APPS_SCRIPT_DEPLOYMENT_ID: string;
  // more env variables...

  readonly PUBLIC_BACKEND_SERVER_URL: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}