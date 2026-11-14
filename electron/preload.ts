import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
  loadDatabase: () => ipcRenderer.invoke('db:load'),
  saveDatabase: (data: Uint8Array) => ipcRenderer.invoke('db:save', data),
  exportBackupFile: (base64: string) => ipcRenderer.invoke('backup:export', base64),
  importBackupFile: () => ipcRenderer.invoke('backup:import'),
  printThermalReceipt: (options?: any) => ipcRenderer.invoke('print:receipt', options),
  minimizeWindow: () => ipcRenderer.send('window:minimize'),
  maximizeWindow: () => ipcRenderer.send('window:maximize'),
  closeWindow: () => ipcRenderer.send('window:close'),
  isElectron: true,
});
