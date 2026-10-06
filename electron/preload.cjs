const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('logoAPI', {
  selectLogo: () =>
    ipcRenderer.invoke('logo:select'),

  getLogo: () =>
    ipcRenderer.invoke('logo:get'),
});

contextBridge.exposeInMainWorld('backupAPI', {
  saveBackup: (buffer, filename) =>
    ipcRenderer.invoke('backup:save', {
      buffer,
      filename,
    }),
});