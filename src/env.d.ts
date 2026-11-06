/// <reference types="vite/client" />
/// <reference types="vite-plugin-pwa/client" />

declare const __APP_VERSION__: string

declare module '*.vue' {
  import type { DefineComponent } from 'vue'
  const component: DefineComponent<object, object, unknown>
  export default component
}

declare module 'nosleep.js' {
  export default class NoSleep {
    isEnabled: boolean
    enable(): Promise<void>
    disable(): void
  }
}
