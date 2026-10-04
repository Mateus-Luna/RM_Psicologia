const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('logoAPI', {
  selectLogo: () => ipcRenderer.invoke('logo:select'),
  getLogoUrl: () => ipcRenderer.sendSync('logo:get-url'),
});