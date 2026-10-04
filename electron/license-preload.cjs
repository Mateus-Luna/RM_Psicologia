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
  select: () =>
    ipcRenderer.invoke('logo:select'),

  get: () =>
    ipcRenderer.invoke('logo:get'),

  remove: () =>
    ipcRenderer.invoke('logo:remove'),
});