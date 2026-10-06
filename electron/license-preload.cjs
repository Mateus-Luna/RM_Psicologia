const {
  contextBridge,
  ipcRenderer,
} = require('electron');

contextBridge.exposeInMainWorld('licenseAPI', {
  getMachineId: () =>
    ipcRenderer.invoke('license:get-machine-id'),

  activate: (licenseKey) =>
    ipcRenderer.invoke(
      'license:activate',
      licenseKey,
    ),
});

contextBridge.exposeInMainWorld('logoAPI', {
  selectLogo: () =>
    ipcRenderer.invoke('logo:select'),

  getLogoUrl: () =>
    ipcRenderer.invoke('logo:get'),

  removeLogo: () =>
    ipcRenderer.invoke('logo:remove'),
});