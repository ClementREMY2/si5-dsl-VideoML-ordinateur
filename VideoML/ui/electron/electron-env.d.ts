/// <reference types="vite-plugin-electron/electron-env" />

declare namespace NodeJS {
  interface ProcessEnv {
    /**
     * The built directory structure
     *
     * ```tree
     * ├─┬─┬ dist
     * │ │ └── index.html
     * │ │
     * │ ├─┬ dist-electron
     * │ │ ├── main.js
     * │ │ └── preload.js
     * │
     * ```
     */
    APP_ROOT: string
    /** /dist/ or /public/ */
    VITE_PUBLIC: string
  }
}

// Used in Renderer process, expose in `preload.ts`
interface Window {
  ipcRenderer: {
    receive: (...args: Parameters<typeof ipcRenderer.on>) => () => void
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    invoke: (...args: Parameters<typeof ipcRenderer.invoke>) => Promise<any>
    // You can expose other APTs you need here.
    // ...
  }
}
