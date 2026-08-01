/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_BACKEND_ORIGIN?: string;
  readonly VITE_MOCK_BASE_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
