/// <reference types="vite/client" />

declare interface ImportMetaEnv {
  readonly VITE_PUBLIC_POSTHOG_KEY: string
  readonly VITE_PUBLIC_POSTHOG_HOST: string
  readonly MODE: string
  // more env variables can be defined here
}

declare interface ImportMeta {
  readonly env: ImportMetaEnv
}