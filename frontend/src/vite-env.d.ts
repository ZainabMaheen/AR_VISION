/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Flask API base URL, e.g. http://127.0.0.1:5000/api */
  readonly VITE_API_URL?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
