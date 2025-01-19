import { ipcRenderer, contextBridge, IpcRendererEvent } from 'electron';

// --------- Expose some API to the Renderer process ---------
contextBridge.exposeInMainWorld('ipcRenderer', {
  receive(...args: Parameters<typeof ipcRenderer.on>) {
    const [channel, listener] = args
    // Deliberately strip event as it includes `sender` 
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const subscription = (_: IpcRendererEvent, ...args: any[]) => listener(...args as [any]);
    ipcRenderer.on(channel, subscription);
    return () => {
      ipcRenderer.removeListener(channel, subscription);
    }
  },
  invoke(...args: Parameters<typeof ipcRenderer.invoke>) {
    const [channel, ...omit] = args
    return ipcRenderer.invoke(channel, ...omit)
  },
  // You can expose other APTs you need here.
  // ...
});
