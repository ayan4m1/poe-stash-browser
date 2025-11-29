import { contextBridge, ipcRenderer, IpcRendererEvent } from 'electron';

const sendMessage =
  (name: string) =>
  /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
  (...args: any[]) =>
    ipcRenderer.send(name, ...args);

const handleEvent =
  (name: string) =>
  /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
  (callback: (event: IpcRendererEvent, ...args: any[]) => void) =>
    ipcRenderer.on(name, callback);

const invokeEvent =
  (name: string) =>
  /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
  (...args: any[]) =>
    ipcRenderer.invoke(name, ...args);

contextBridge.exposeInMainWorld('authBridge', {
  initiate: invokeEvent('initiate'),
  connect: sendMessage('connect'),
  disconnect: sendMessage('disconnect'),
  onConnectionStateChange: handleEvent('onConnectionStateChange'),
  onMessageReceived: handleEvent('onMessageReceived')
});
