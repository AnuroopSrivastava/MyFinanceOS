import { contextBridge, ipcRenderer } from 'electron';

// Expose safe filesystem/backup helpers to the renderer process
contextBridge.exposeInMainWorld('electronAPI', {
  saveDbBackup: (encryptedPayload: string) => 
    ipcRenderer.invoke('save-db-backup', encryptedPayload),
    
  loadDbBackup: () => 
    ipcRenderer.invoke('load-db-backup'),

  saveConfigBackup: (configPayload: string) => 
    ipcRenderer.invoke('save-config-backup', configPayload),
    
  loadConfigBackup: () => 
    ipcRenderer.invoke('load-config-backup')
});
